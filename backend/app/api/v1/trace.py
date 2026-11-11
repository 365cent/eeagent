import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.base import get_db
from app.models.models import (
    CorrectionAudit,
    DemandPoint,
    Signal,
    SignalTag,
    TechLandingPoint,
    TechTheme,
    VehicleFunction,
)
from app.schemas.schemas import (
    AuditOut,
    SignalBase,
    SignalOut,
    TraceChain,
    TraceCompleteness,
    TraceDocumentOut,
    TraceSignalOut,
)
from app.domains.demand.serialization import enrich_demand_out as demand_enrich
from app.domains.landing.serialization import landing_point_out as lp_out
from app.domains.trace.freshness import compute_basis_freshness

router = APIRouter(tags=["trace"])

_TRACE_STAGES = ("landing_point", "vehicle_function", "demand_point", "theme", "signals")


def _demand_evidence_refs(demand: DemandPoint | None) -> list[str]:
    """Return the persisted signal IDs cited by validation and derivation JSON."""
    if demand is None:
        return []
    raw_refs: list[str] = []

    def append_from(value):
        if not isinstance(value, dict):
            return
        refs = value.get("evidence_signal_ids")
        if isinstance(refs, list):
            raw_refs.extend(str(item).strip() for item in refs if str(item).strip())

    append_from(demand.cross_validation)
    derivation = demand.derivation_trace
    if isinstance(derivation, dict):
        append_from(derivation)
        steps = derivation.get("steps")
        if isinstance(steps, list):
            for step in steps:
                append_from(step)
    # Preserve first-seen order while removing repeated citations across steps.
    return list(dict.fromkeys(raw_refs))


def _parse_evidence_refs(raw_refs: list[str]) -> tuple[list[uuid.UUID], list[str]]:
    parsed: list[uuid.UUID] = []
    invalid: list[str] = []
    for raw in raw_refs:
        try:
            value = uuid.UUID(raw)
        except (ValueError, AttributeError):
            invalid.append(raw)
            continue
        parsed.append(value)
    return parsed, invalid


@router.get("/trace/landing-points/{lp_id}", response_model=TraceChain)
async def trace_from_landing_point(lp_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Trace a landing point through its persisted function, demand, theme and evidence links."""
    lp = (
        await db.execute(
            select(TechLandingPoint)
            .options(
                selectinload(TechLandingPoint.domain),
                selectinload(TechLandingPoint.standards),
                selectinload(TechLandingPoint.assessments),
                selectinload(TechLandingPoint.vehicle_function).selectinload(
                    VehicleFunction.demand_point
                ),
                selectinload(TechLandingPoint.vehicle_function)
                .selectinload(VehicleFunction.demand_point)
                .selectinload(DemandPoint.functions),
            )
            .where(TechLandingPoint.id == lp_id)
        )
    ).scalar_one_or_none()
    if lp is None:
        raise HTTPException(404, "landing point not found")

    vehicle_function = lp.vehicle_function
    demand = vehicle_function.demand_point if vehicle_function else None
    theme = (
        await db.get(TechTheme, demand.source_tech_theme_id)
        if demand and demand.source_tech_theme_id
        else None
    )

    raw_evidence_refs = _demand_evidence_refs(demand)
    evidence_ids, invalid_evidence_refs = _parse_evidence_refs(raw_evidence_refs)
    predicates = []
    if theme is not None:
        predicates.append(Signal.tech_theme_id == theme.id)
    if evidence_ids:
        predicates.append(Signal.id.in_(evidence_ids))

    signals: list[TraceSignalOut] = []
    unresolved_evidence_ids = list(invalid_evidence_refs)
    unresolved_document_ids: list[str] = []
    if predicates:
        rows = (
            await db.execute(
                select(Signal)
                .options(
                    selectinload(Signal.tags).selectinload(SignalTag.vocab),
                    selectinload(Signal.document),
                )
                .where(or_(*predicates))
                .order_by(Signal.published_at, Signal.created_at, Signal.id)
            )
        ).scalars().all()
        found_ids = {signal.id for signal in rows}
        unresolved_evidence_ids.extend(
            str(evidence_id) for evidence_id in evidence_ids if evidence_id not in found_ids
        )
        for signal in rows:
            output = SignalOut(**SignalBase.model_validate(signal).model_dump())
            output.tags = [tag.vocab.name for tag in signal.tags]
            relationships: list[str] = []
            if theme is not None and signal.tech_theme_id == theme.id:
                relationships.append("theme_member")
            if signal.id in evidence_ids:
                relationships.append("demand_evidence")

            document_out = None
            if signal.document is not None:
                document_out = TraceDocumentOut(
                    id=signal.document.id,
                    filename=signal.document.filename,
                    mime=signal.document.mime,
                    size=signal.document.size,
                    sha256=signal.document.sha256,
                    ingest_status=signal.document.ingest_status,
                    figure_count=signal.document.figure_count,
                    created_at=signal.document.created_at,
                    raw_object_reference_present=bool(signal.document.object_key),
                    canonical_object_reference_present=bool(
                        signal.document.canonical_md_object_key
                    ),
                    endpoint=f"/api/v1/documents/{signal.document.id}",
                )
            elif signal.document_id is not None:
                unresolved_document_ids.append(str(signal.document_id))

            archive_present = bool(signal.snapshot_html_object_key)
            body_present = bool(signal.body_object_key)
            signals.append(
                TraceSignalOut(
                    **output.model_dump(),
                    trace_relationships=relationships,
                    body_reference_present=body_present,
                    archive_reference_present=archive_present,
                    is_archived=signal.evidence_status_code == "archived",
                    body_endpoint=(f"/api/v1/signals/{signal.id}/body" if body_present else None),
                    archive_endpoint=(
                        f"/api/v1/signals/{signal.id}/archive" if archive_present else None
                    ),
                    figures_endpoint=(
                        f"/api/v1/signals/{signal.id}/figures" if archive_present else None
                    ),
                    document=document_out,
                )
            )
    else:
        # Every cited ID is unresolved when no signal query can be made (e.g.
        # there is no theme and malformed evidence identifiers were persisted).
        unresolved_evidence_ids.extend(
            raw_id
            for raw_id in raw_evidence_refs
            if raw_id not in unresolved_evidence_ids
        )

    present_stages = ["landing_point"]
    if vehicle_function is not None:
        present_stages.append("vehicle_function")
    if demand is not None:
        present_stages.append("demand_point")
    if theme is not None:
        present_stages.append("theme")
    if signals:
        present_stages.append("signals")
    missing_stages = [stage for stage in _TRACE_STAGES if stage not in present_stages]

    assessments = sorted(lp.assessments, key=lambda item: item.version)
    current_assessment = next((item for item in assessments if item.is_current), None)
    demand_out = await demand_enrich(db, demand) if demand else None
    cross_validation = demand.cross_validation if demand and isinstance(demand.cross_validation, dict) else {}

    return TraceChain(
        landing_point=lp_out(lp),
        standards=list(lp.standards),
        assessment=current_assessment,
        assessment_versions=assessments,
        vehicle_function=vehicle_function,
        demand_point=demand_out,
        theme=theme,
        signals=signals,
        demand_review_status=demand.review_status if demand else None,
        demand_cross_validation_conclusion=cross_validation.get("conclusion"),
        function_published=vehicle_function.published if vehicle_function else None,
        basis_freshness=await compute_basis_freshness(db, demand),
        completeness=TraceCompleteness(
            complete=not missing_stages and not unresolved_evidence_ids and not unresolved_document_ids,
            present_stages=present_stages,
            missing_stages=missing_stages,
            unresolved_evidence_signal_ids=list(dict.fromkeys(unresolved_evidence_ids)),
            unresolved_document_ids=list(dict.fromkeys(unresolved_document_ids)),
        ),
    )


@router.get("/audit", response_model=list[AuditOut])
async def list_audit(entity_id: uuid.UUID | None = None, db: AsyncSession = Depends(get_db)):
    q = select(CorrectionAudit).order_by(CorrectionAudit.corrected_at.desc()).limit(200)
    if entity_id:
        q = q.where(CorrectionAudit.entity_id == entity_id)
    return (await db.execute(q)).scalars().all()
