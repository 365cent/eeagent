import pytest
from sqlalchemy import func, select

from app.db.base import SessionLocal
from app.models.models import (
    DemandPoint,
    Signal,
    TechLandingPoint,
    TechTheme,
    VehicleFunction,
    Vocab,
)
from app.seed import SEED_DOMAINS, seed

pytestmark = pytest.mark.anyio


async def test_seed_initializes_vocabularies_without_synthetic_business_records():
    async with SessionLocal() as db:
        await seed(db)
        await seed(db)
        domain_names = set(
            (
                await db.execute(
                    select(Vocab.name).where(Vocab.kind == "domain")
                )
            ).scalars()
        )
        assert set(SEED_DOMAINS) <= domain_names
        for model in (Signal, TechTheme, DemandPoint, VehicleFunction, TechLandingPoint):
            count = (await db.execute(select(func.count()).select_from(model))).scalar_one()
            assert count == 0, model.__tablename__
