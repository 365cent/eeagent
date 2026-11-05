import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.models.models import TechTheme
from app.schemas.schemas import ThemeCreate, ThemeDetail, ThemeMetrics, ThemeOut
from app.services.tagging import get_or_create_vocab  # noqa: F401 (shared helper)

router = APIRouter(prefix="/themes", tags=["themes"])


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
async def create_theme(payload: ThemeCreate, db: AsyncSession = Depends(get_db)):
    t = TechTheme(working_name=payload.working_name, value_chain_stage_code=payload.value_chain_stage_code)
    db.add(t)
    await db.commit()
    d = ThemeDetail.model_validate(t)
    d.metrics = await _metrics(db, t.id)
    d.display_tags = []
    return d


@router.get("/{theme_id}", response_model=ThemeDetail)
async def get_theme(theme_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    t = await db.get(TechTheme, theme_id)
    if t is None:
        raise HTTPException(404, "theme not found")
    d = ThemeDetail.model_validate(t)
    d.metrics = await _metrics(db, t.id)
    d.display_tags = await _display_tags(db, t.id)
    return d
