from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import and_, exists, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.domains.imports.serialization import panorama_batch_out as _batch_out
from app.models.models import (
    CaptureJob,
    DemandPoint,
    DeploymentStandard,
    Document,
    PanoramaImportBatch,
    Signal,
    StrategicAssessment,
    StrategicFunnel,
    TechLandingPoint,
    TechTheme,
    VehicleFunction,
)
from app.schemas.schemas import (
    DataSyncStamp,
    OverviewStats,
    OverviewStrategyFunnelCounts,
    OverviewWeeklyNew,
)
from app.services.strategy_funnel import _current_step

router = APIRouter(tags=["overview"])

_EPOCH = datetime(1970, 1, 1, tzinfo=timezone.utc)


async def _table_count(db: AsyncSession, model) -> int:
    return int((await db.execute(select(func.count()).select_from(model))).scalar_one() or 0)


@router.get(
    "/sync-stamp",
    response_model=DataSyncStamp,
    description=(
        "Lightweight change detector for the SPA: one aggregated fingerprint over core entity "
        "timestamps and row counts. Clients poll or refetch on navigation; when fingerprint "
        "changes, invalidate list/overview queries and refetch in the background."
    ),
)
async def sync_stamp(db: AsyncSession = Depends(get_db)):
    signal_updated = (
        await db.execute(select(func.max(Signal.updated_at)))
    ).scalar_one()
    signal_created = (
        await db.execute(select(func.max(Signal.created_at)))
    ).scalar_one()
    capture_updated = (
        await db.execute(select(func.max(CaptureJob.updated_at)))
    ).scalar_one()
    theme_created = (
        await db.execute(select(func.max(TechTheme.created_at)))
    ).scalar_one()
    demand_created = (
        await db.execute(select(func.max(DemandPoint.created_at)))
    ).scalar_one()
    landing_created = (
        await db.execute(select(func.max(TechLandingPoint.created_at)))
    ).scalar_one()
    funnel_updated = (
        await db.execute(select(func.max(StrategicFunnel.updated_at)))
    ).scalar_one()
    assessment_at = (
        await db.execute(select(func.max(StrategicAssessment.assessed_at)))
    ).scalar_one()

    signal_count = await _table_count(db, Signal)
    capture_count = await _table_count(db, CaptureJob)
    theme_count = await _table_count(db, TechTheme)
    demand_count = await _table_count(db, DemandPoint)
    landing_count = await _table_count(db, TechLandingPoint)
    funnel_count = await _table_count(db, StrategicFunnel)
    assessment_count = await _table_count(db, StrategicAssessment)

    candidates = [
        signal_updated,
        signal_created,
        capture_updated,
        theme_created,
        demand_created,
        landing_created,
        funnel_updated,
        assessment_at,
    ]
    changed_at = max((t for t in candidates if t is not None), default=_EPOCH)
    fingerprint = ":".join(
        [
            str(int(changed_at.timestamp())),
            str(signal_count),
            str(capture_count),
            str(theme_count),
            str(demand_count),
            str(landing_count),
            str(funnel_count),
            str(assessment_count),
        ]
    )
    return DataSyncStamp(changed_at=changed_at, fingerprint=fingerprint)


@router.get(
    "/overview",
    response_model=OverviewStats,
    description=(
        "Returns live row counts. Weekly additions use each entity's persisted creation/assessment "
        "timestamp in the UTC calendar week beginning Monday 00:00, through as_of_utc. Funnel "
        "counts are exclusive current states per landing point; step four includes finalized rows."
    ),
)
async def overview(db: AsyncSession = Depends(get_db)):
    as_of = datetime.now(timezone.utc)
    week_start = (as_of - timedelta(days=as_of.weekday())).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    def total(model, *, timestamp_field=None):
        query = select(func.count(model.id))
        if timestamp_field is not None:
            query = query.where(timestamp_field >= week_start, timestamp_field <= as_of)
        return query.scalar_subquery()

    counters = (
        await db.execute(
            select(
                total(Signal).label("signals"),
                select(func.count(func.distinct(Signal.url_normalized)))
                .where(func.length(func.trim(Signal.url_normalized)) > 0)
                .scalar_subquery()
                .label("signal_sources"),
                select(func.count(Signal.id))
                .where(Signal.evidence_status_code == "pending_review")
                .scalar_subquery()
                .label("signals_pending_review"),
                select(func.count(Signal.id))
                .where(Signal.evidence_status_code == "retained")
                .scalar_subquery()
                .label("signals_retained"),
                select(func.count(Signal.id))
                .where(Signal.evidence_status_code == "fetching")
                .scalar_subquery()
                .label("signals_fetching"),
                select(func.count(Signal.id))
                .where(Signal.evidence_status_code == "fetch_failed")
                .scalar_subquery()
                .label("signals_fetch_failed"),
                select(func.count(Signal.id))
                .where(Signal.evidence_status_code == "archived")
                .scalar_subquery()
                .label("signals_archived"),
                select(func.count(DemandPoint.id))
                .where(DemandPoint.review_status == "pending")
                .scalar_subquery()
                .label("demand_points_pending_review"),
                select(func.count(CaptureJob.id))
                .where(CaptureJob.status.in_(("queued", "running", "awaiting_client")))
                .scalar_subquery()
                .label("capture_jobs_open"),
                select(func.count(CaptureJob.id))
                .where(CaptureJob.status == "failed")
                .scalar_subquery()
                .label("capture_jobs_failed"),
                select(func.count(Document.id))
                .where(Document.ingest_status == "failed")
                .scalar_subquery()
                .label("documents_failed_ingest"),
                total(TechTheme).label("tech_themes"),
                total(DemandPoint).label("demand_points"),
                total(VehicleFunction).label("vehicle_functions"),
                total(TechLandingPoint).label("landing_points"),
                select(func.count(DeploymentStandard.id))
                .where(
                    DeploymentStandard.requirement_text.is_not(None),
                    func.length(func.trim(DeploymentStandard.requirement_text)) > 0,
                )
                .scalar_subquery()
                .label("substantive_standards"),
                select(func.count(StrategicAssessment.id))
                .where(StrategicAssessment.is_current.is_(True))
                .scalar_subquery()
                .label("funnel_pool"),
                total(Signal, timestamp_field=Signal.created_at).label("weekly_signals"),
                total(TechTheme, timestamp_field=TechTheme.created_at).label("weekly_tech_themes"),
                total(DemandPoint, timestamp_field=DemandPoint.created_at).label("weekly_demand_points"),
                total(VehicleFunction, timestamp_field=VehicleFunction.created_at).label("weekly_vehicle_functions"),
                total(TechLandingPoint, timestamp_field=TechLandingPoint.created_at).label("weekly_landing_points"),
                total(StrategicAssessment, timestamp_field=StrategicAssessment.assessed_at).label(
                    "weekly_strategic_assessments"
                ),
                total(Document, timestamp_field=Document.created_at).label("weekly_documents"),
            )
        )
    ).one()

    # Use the same pure state resolver as GET/PATCH /strategy/.../funnel so
    # overview buckets cannot drift from the sequential funnel contract.
    has_boundary_evidence = exists(
        select(DeploymentStandard.id).where(
            DeploymentStandard.tech_landing_point_id == TechLandingPoint.id,
            DeploymentStandard.requirement_text.is_not(None),
            func.length(func.trim(DeploymentStandard.requirement_text)) > 0,
        )
    )
    funnel_rows = (
        await db.execute(
            select(
                TechLandingPoint.id,
                StrategicFunnel,
                StrategicAssessment,
                has_boundary_evidence.label("pool_eligible"),
            )
            .outerjoin(
                StrategicFunnel,
                StrategicFunnel.tech_landing_point_id == TechLandingPoint.id,
            )
            .outerjoin(
                StrategicAssessment,
                and_(
                    StrategicAssessment.tech_landing_point_id == TechLandingPoint.id,
                    StrategicAssessment.is_current.is_(True),
                ),
            )
        )
    ).all()

    stage_counts = {
        "industry_scan": 0,
        "tier1_adaptation": 0,
        "scoring": 0,
        "classification": 0,
        "rejected": 0,
        "pool_entry_blocked": 0,
    }
    for _lp_id, funnel, current_assessment, pool_eligible in funnel_rows:
        step = _current_step(funnel, bool(pool_eligible), current_assessment)
        if step in stage_counts:
            stage_counts[step] += 1
        elif step in {"ready_to_finalize", "complete"}:
            stage_counts["classification"] += 1

    latest_import = (
        await db.execute(
            select(PanoramaImportBatch).order_by(PanoramaImportBatch.created_at.desc()).limit(1)
        )
    ).scalar_one_or_none()
    panorama_import = await _batch_out(db, latest_import) if latest_import is not None else None

    return OverviewStats(
        signals=counters.signals,
        signal_sources=counters.signal_sources,
        signals_retained=counters.signals_retained,
        signals_pending_review=counters.signals_pending_review,
        signals_fetching=counters.signals_fetching,
        signals_fetch_failed=counters.signals_fetch_failed,
        signals_archived=counters.signals_archived,
        demand_points_pending_review=counters.demand_points_pending_review,
        capture_jobs_open=counters.capture_jobs_open,
        capture_jobs_failed=counters.capture_jobs_failed,
        documents_failed_ingest=counters.documents_failed_ingest,
        tech_themes=counters.tech_themes,
        demand_points=counters.demand_points,
        vehicle_functions=counters.vehicle_functions,
        landing_points=counters.landing_points,
        substantive_standards=counters.substantive_standards,
        funnel_pool=counters.funnel_pool,
        weekly_window_start_utc=week_start,
        as_of_utc=as_of,
        weekly_new=OverviewWeeklyNew(
            signals=counters.weekly_signals,
            tech_themes=counters.weekly_tech_themes,
            demand_points=counters.weekly_demand_points,
            vehicle_functions=counters.weekly_vehicle_functions,
            landing_points=counters.weekly_landing_points,
            strategic_assessments=counters.weekly_strategic_assessments,
            documents=counters.weekly_documents,
        ),
        strategy_funnel=OverviewStrategyFunnelCounts(**stage_counts),
        panorama_import=panorama_import,
    )
