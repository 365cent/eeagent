import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import OperatorIdentity, get_operator_identity
from app.db.base import get_db
from app.platform.launchdarkly import DEMAND_EXTRACTION, require_feature, track_workflow_success
from app.models.models import DemandPoint, Signal, TechTheme, ThemeClusterRun
from app.schemas.schemas import (
    ThemeClusterReport,
    ThemeClusterRunOut,
    ThemeCreate,
    ThemeDetail,
    ThemeMetrics,
    ThemeNameSuggestionIn,
    ThemeNameSuggestionOut,
    ThemeOut,
    ThemeUpdate,
)
from app.platform.audit import record_correction
from app.domains.tagging.clustering import build_theme_cluster_report
from app.services.cluster_runner import (
    READY,
    enqueue_cluster_run,
    latest_run,
    pending_run,
    ready_run,
    run_summary,
    spawn_cluster_job,
)
from app.domains.tagging.service import get_or_create_vocab  # noqa: F401 (shared helper)
from app.domains.theme.naming import suggest_theme_name

router = APIRouter(
    prefix="/themes",
    tags=["themes"],
    dependencies=[Depends(require_feature(DEMAND_EXTRACTION))],
)


async def _metrics(db: AsyncSession, theme_id: uuid.UUID) -> ThemeMetrics:
    row = (
        await db.execute(
            text(
                "SELECT signal_frequency, source_count FROM eea_v_tech_theme_metrics WHERE tech_theme_id = :tid"
            ),
            {"tid": theme_id},
        )
    ).one_or_none()
    return ThemeMetrics(
        theme_id=theme_id,
        signal_frequency=row.signal_frequency if row else 0,
        source_count=row.source_count if row else 0,
    )


async def _display_tags(db: AsyncSession, theme_id: uuid.UUID) -> list[str]:
    rows = (
        await db.execute(
            text(
                "SELECT tag_name FROM eea_v_tech_theme_display_tags WHERE tech_theme_id = :tid ORDER BY tag_hits DESC"
            ),
            {"tid": theme_id},
        )
    ).scalars().all()
    return list(rows)


@router.get("", response_model=list[ThemeDetail])
async def list_themes(db: AsyncSession = Depends(get_db)):
    """图2-3 主题表：不合并、不排序（REQ-DEM-02），按创建顺序返回。"""
    themes = (await db.execute(select(TechTheme).order_by(TechTheme.created_at))).scalars().all()
    out = []
    for t in themes:
        d = ThemeDetail.model_validate(t)
        d.metrics = await _metrics(db, t.id)
        d.display_tags = await _display_tags(db, t.id)
        out.append(d)
    return out


@router.post("", response_model=ThemeDetail, status_code=201)
async def create_theme(
    payload: ThemeCreate,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    t = TechTheme(working_name=payload.working_name, value_chain_stage_code=payload.value_chain_stage_code)
    db.add(t)
    await db.flush()
    await record_correction(
        db,
        "tech_theme",
        t.id,
        "created",
        None,
        {"working_name": t.working_name, "value_chain_stage_code": t.value_chain_stage_code},
        actor,
        reason="创建主题",
    )
    await db.commit()
    await db.refresh(t)
    track_workflow_success(DEMAND_EXTRACTION)
    d = ThemeDetail.model_validate(t)
    d.metrics = await _metrics(db, t.id)
    d.display_tags = []
    return d


@router.post("/name-suggestion", response_model=ThemeNameSuggestionOut)
async def theme_name_suggestion(payload: ThemeNameSuggestionIn, db: AsyncSession = Depends(get_db)):
    """Suggest a working name for the selected signals. Does not create a theme.

    Declared before ``/{theme_id}`` so the static path is not parsed as an id.
    """
    return await suggest_theme_name(db, payload.signal_ids)


@router.get("/cluster-report", response_model=ThemeClusterReport)
async def theme_cluster_report(db: AsyncSession = Depends(get_db)):
    """Snapshot of the background clustering report.

    Declared before ``/{theme_id}`` so the static path is not parsed as an id.
    A stored run is served as-is so a new signal never forces a request to wait
    for sklearn; the first request on a fresh install still computes once and
    stores the result, so the page is never empty.
    """
    stored = await ready_run(db)
    if stored is not None and isinstance(stored.payload, dict):
        report = ThemeClusterReport.model_validate(stored.payload)
        report.computed_at = stored.finished_at or stored.started_at or stored.requested_at
        report.run_id = stored.id
        report.pending = await pending_run(db) is not None
        return report

    report = await build_theme_cluster_report(db)
    now = datetime.now(timezone.utc)
    snapshot = ThemeClusterRun(
        trigger="bootstrap",
        status=READY,
        payload=report.model_dump(mode="json"),
        signal_count=report.sample_size,
        cluster_count=len(report.clusters),
        started_at=now,
        finished_at=now,
    )
    db.add(snapshot)
    await db.commit()
    await db.refresh(snapshot)
    report.computed_at = snapshot.finished_at
    report.run_id = snapshot.id
    return report


@router.post("/cluster-report/recompute", response_model=ThemeClusterRunOut)
async def recompute_theme_cluster_report(db: AsyncSession = Depends(get_db)):
    """Queue a fresh pass and start the background Python job right away."""
    await enqueue_cluster_run(db, trigger="manual")
    await db.commit()
    await spawn_cluster_job()
    return ThemeClusterRunOut(**run_summary(await latest_run(db)))


@router.get("/cluster-report/status", response_model=ThemeClusterRunOut)
async def theme_cluster_run_status(db: AsyncSession = Depends(get_db)):
    """Poll the newest pass; the page uses it to replace the graph when ready."""
    return ThemeClusterRunOut(**run_summary(await latest_run(db)))


@router.get("/{theme_id}", response_model=ThemeDetail)
async def get_theme(theme_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    t = await db.get(TechTheme, theme_id)
    if t is None:
        raise HTTPException(404, "theme not found")
    d = ThemeDetail.model_validate(t)
    d.metrics = await _metrics(db, t.id)
    d.display_tags = await _display_tags(db, t.id)
    return d


@router.patch("/{theme_id}", response_model=ThemeDetail)
async def update_theme(
    theme_id: uuid.UUID,
    payload: ThemeUpdate,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    """Edit theme working name or value-chain stage (REQ-DEM-02 manual naming)."""
    t = await db.get(TechTheme, theme_id)
    if t is None:
        raise HTTPException(404, "theme not found")
    old_name = t.working_name
    old_stage = t.value_chain_stage_code
    data = payload.model_dump(exclude_unset=True)
    if "working_name" in data:
        name = (data["working_name"] or "").strip()
        if not name:
            raise HTTPException(422, "工作名不能为空")
        if len(name) > 2000:
            raise HTTPException(422, "工作名过长")
        t.working_name = name
    if "value_chain_stage_code" in data:
        t.value_chain_stage_code = data["value_chain_stage_code"]
    if old_name != t.working_name:
        await record_correction(db, "tech_theme", t.id, "working_name", old_name, t.working_name, actor)
    if old_stage != t.value_chain_stage_code:
        await record_correction(db, "tech_theme", t.id, "value_chain_stage_code", old_stage, t.value_chain_stage_code, actor)
    await db.commit()
    await db.refresh(t)
    track_workflow_success(DEMAND_EXTRACTION)
    d = ThemeDetail.model_validate(t)
    d.metrics = await _metrics(db, t.id)
    d.display_tags = await _display_tags(db, t.id)
    return d


@router.delete("/{theme_id}", status_code=204)
async def delete_theme(
    theme_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    """Remove the theme index; member signals are unassigned (REQ-DEM-02 add/remove)."""
    t = await db.get(TechTheme, theme_id)
    if t is None:
        raise HTTPException(404, "theme not found")
    demand_ids = (
        await db.execute(
            select(DemandPoint.id)
            .where(DemandPoint.source_tech_theme_id == theme_id)
            .order_by(DemandPoint.created_at, DemandPoint.id)
        )
    ).scalars().all()
    if demand_ids:
        raise HTTPException(
            409,
            detail={
                "message": f"该主题仍关联 {len(demand_ids)} 个需求点，无法删除。请先调整需求点的来源主题。",
                "code": "theme_has_demands",
                "demand_ids": [str(item) for item in demand_ids],
            },
        )
    await record_correction(
        db,
        "tech_theme",
        t.id,
        "deleted",
        {"working_name": t.working_name, "value_chain_stage_code": t.value_chain_stage_code},
        None,
        actor,
        reason="删除主题",
    )
    await db.execute(update(Signal).where(Signal.tech_theme_id == theme_id).values(tech_theme_id=None))
    await db.delete(t)
    await db.commit()
    track_workflow_success(DEMAND_EXTRACTION)
