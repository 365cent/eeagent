"""Read-only report of possible legacy panorama decisions needing review.

Run with the intended database configured: python -m app.services.panorama_review_report
The marker is heuristic, not proof of provenance or invalidity.
"""
from __future__ import annotations

import asyncio
import json

from sqlalchemy import Text, cast, select, text

from app.db.base import SessionLocal, engine
from app.models.models import DemandPoint, VehicleFunction


async def report() -> list[dict]:
    async with SessionLocal() as db:
        await db.execute(text("SET TRANSACTION READ ONLY"))
        rows = (
            await db.execute(
                select(DemandPoint.id, DemandPoint.review_status, VehicleFunction.id, VehicleFunction.published)
                .outerjoin(VehicleFunction, VehicleFunction.demand_point_id == DemandPoint.id)
                .where(cast(DemandPoint.derivation_trace, Text).contains("工作簿导入："))
                .order_by(DemandPoint.id, VehicleFunction.id)
            )
        ).all()
    return [
        {
            "demand_id": str(demand_id),
            "review_status": review_status,
            "function_id": str(function_id) if function_id else None,
            "function_published": published,
        }
        for demand_id, review_status, function_id, published in rows
    ]


async def _main() -> None:
    try:
        rows = await report()
        print(json.dumps({"note": "Candidates only; verify provenance and review history manually.", "records": rows}, ensure_ascii=False))
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(_main())
