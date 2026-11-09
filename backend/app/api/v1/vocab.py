from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.core.identity import OperatorIdentity, get_operator_identity
from app.models.models import RefCode, SignalTag, Vocab
from app.schemas.schemas import RefCodeOut, VocabCreate, VocabOut, VocabUsageOut
from app.services.tagging import get_or_create_vocab

router = APIRouter(tags=["vocab"])


@router.get("/ref-codes", response_model=list[RefCodeOut])
async def list_ref_codes(domain: str | None = None, db: AsyncSession = Depends(get_db)):
    q = select(RefCode).order_by(RefCode.domain, RefCode.code)
    if domain:
        q = q.where(RefCode.domain == domain)
    return (await db.execute(q)).scalars().all()


@router.get("/vocab", response_model=list[VocabOut])
async def list_vocab(kind: str | None = None, db: AsyncSession = Depends(get_db)):
    q = select(Vocab).order_by(Vocab.created_at.desc())
    if kind:
        q = q.where(Vocab.kind == kind)
    return (await db.execute(q)).scalars().all()


@router.post("/vocab", response_model=VocabOut, status_code=201)
async def create_vocab(
    payload: VocabCreate,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    if payload.kind in {"recommendation_level", "target_domain"} and actor.role not in {
        "taxonomy_admin",
        "platform_admin",
    }:
        raise HTTPException(403, "只有词表管理员可以维护域和功能卡片词表")
    v = await get_or_create_vocab(db, payload.kind, payload.name)
    await db.commit()
    return v


@router.get("/vocab/usage", response_model=list[VocabUsageOut])
async def vocab_usage(kind: str = "tech_tag", db: AsyncSession = Depends(get_db)):
    """标签频次（图2-3 左侧）。"""
    q = (
        select(Vocab.id, Vocab.kind, Vocab.name, func.count(SignalTag.signal_id).label("frequency"))
        .outerjoin(SignalTag, SignalTag.vocab_id == Vocab.id)
        .where(Vocab.kind == kind)
        .group_by(Vocab.id, Vocab.kind, Vocab.name)
        .order_by(func.count(SignalTag.signal_id).desc())
    )
    rows = (await db.execute(q)).all()
    return [
        {"id": r.id, "kind": r.kind, "name": r.name, "frequency": r.frequency} for r in rows
    ]
