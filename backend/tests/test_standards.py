"""Deployment standards: the phase × constraint-type grid, explicit blank
cells and the no-fabrication rule (REQ-STD-01/02/03,
std-empty-cell-representation, SCHEMA-STD-GRID)."""

import asyncio

import pytest

from tests.support import (
    create_confirmed_demand,
    create_function,
    create_landing_point,
    publish_function,
    put_standard,
)

pytestmark = pytest.mark.anyio

PHASES = ["设计", "制造", "运营"]
CONSTRAINT_TYPES = ["工程化", "经济性", "安全合规"]


async def _lp(client):
    demand = await create_confirmed_demand(client)
    func = await create_function(client, demand["id"])
    await publish_function(client, func["id"])
    return await create_landing_point(client, func["id"])


def _cells(grid):
    return {(c["phase"], c["constraint_type"]): c for c in grid["cells"]}


async def test_full_3x3_grid_is_addressable(client):
    """REQ-STD-01: standards are registered by phase (设计/制造/运营) and
    constraint type (工程化/经济性/安全合规) — all enterable in phase one."""
    lp = await _lp(client)
    for phase in PHASES:
        for ct in CONSTRAINT_TYPES:
            await put_standard(client, lp["id"], phase, ct, f"{phase}-{ct} 的部署边界")
    grid = (await client.get(f"/api/v1/landing-points/{lp['id']}/standards")).json()
    assert len(grid["cells"]) == 9
    for phase in PHASES:
        for ct in CONSTRAINT_TYPES:
            assert _cells(grid)[(phase, ct)]["requirement_text"] == f"{phase}-{ct} 的部署边界"


async def test_invalid_phase_or_constraint_type_rejected(client):
    lp = await _lp(client)
    r = await client.put(
        f"/api/v1/landing-points/{lp['id']}/standards",
        json={"phase": "回收", "constraint_type": "工程化", "requirement_text": "x"},
    )
    assert r.status_code == 422
    r = await client.put(
        f"/api/v1/landing-points/{lp['id']}/standards",
        json={"phase": "设计", "constraint_type": "环保", "requirement_text": "x"},
    )
    assert r.status_code == 422
    grid = (await client.get(f"/api/v1/landing-points/{lp['id']}/standards")).json()
    assert grid["cells"] == []


async def test_cell_requires_explicit_text_or_null(client):
    lp = await _lp(client)
    response = await client.put(
        f"/api/v1/landing-points/{lp['id']}/standards",
        json={"phase": "运营", "constraint_type": "经济性"},
    )
    assert response.status_code == 422
    grid = (await client.get(f"/api/v1/landing-points/{lp['id']}/standards")).json()
    assert grid["cells"] == []


async def test_cell_is_upserted_in_place_never_duplicated(client):
    """SCHEMA-STD-GRID: at most one row per (phase, constraint_type)."""
    lp = await _lp(client)
    first = await put_standard(client, lp["id"], "设计", "工程化", "第一版边界")
    cell_id = _cells(first)[("设计", "工程化")]["id"]
    second = await put_standard(client, lp["id"], "设计", "工程化", "修订后的边界")
    assert _cells(second)[("设计", "工程化")]["id"] == cell_id
    assert _cells(second)[("设计", "工程化")]["requirement_text"] == "修订后的边界"
    assert len(second["cells"]) == 1


async def test_explicitly_blank_cell_is_present_with_null_text(client):
    """std-empty-cell-representation: an explicitly empty cell exists as a
    row with null text — distinguishable from a never-filled cell."""
    lp = await _lp(client)
    grid = await put_standard(client, lp["id"], "运营", "工程化", None)
    cells = _cells(grid)
    assert ("运营", "工程化") in cells  # row present, deliberately blank
    assert cells[("运营", "工程化")]["requirement_text"] is None
    assert ("设计", "工程化") not in cells  # never filled → no row


async def test_blank_cell_upsert_is_idempotent(client):
    lp = await _lp(client)
    first = await put_standard(client, lp["id"], "运营", "工程化", None)
    second = await put_standard(client, lp["id"], "运营", "工程化", None)
    assert _cells(first)[("运营", "工程化")]["id"] == _cells(second)[("运营", "工程化")]["id"]
    assert len(second["cells"]) == 1


async def test_concurrent_first_writes_to_one_cell_are_serialized(client):
    lp = await _lp(client)
    responses = await asyncio.gather(
        client.put(
            f"/api/v1/landing-points/{lp['id']}/standards",
            json={"phase": "制造", "constraint_type": "安全合规", "requirement_text": "甲"},
        ),
        client.put(
            f"/api/v1/landing-points/{lp['id']}/standards",
            json={"phase": "制造", "constraint_type": "安全合规", "requirement_text": "乙"},
        ),
    )
    assert [response.status_code for response in responses] == [200, 200]
    cells = _cells((await client.get(f"/api/v1/landing-points/{lp['id']}/standards")).json())
    assert len(cells) == 1
    assert cells[("制造", "安全合规")]["requirement_text"] in {"甲", "乙"}


async def test_null_put_on_filled_cell_keeps_the_row(client):
    """A filled cell set to null stays as an explicit blank — the row is
    never deleted, so 留空 remains distinguishable from 尚未填写."""
    lp = await _lp(client)
    await put_standard(client, lp["id"], "设计", "经济性", "成本边界")
    grid = await put_standard(client, lp["id"], "设计", "经济性", None)
    cells = _cells(grid)
    assert ("设计", "经济性") in cells
    assert cells[("设计", "经济性")]["requirement_text"] is None


async def test_standard_correction_records_before_after_actor_and_time(client):
    lp = await _lp(client)
    first = await put_standard(client, lp["id"], "设计", "工程化", "初版标准")
    standard_id = _cells(first)[("设计", "工程化")]["id"]
    await put_standard(client, lp["id"], "设计", "工程化", "修订标准")
    audit = (
        await client.get("/api/v1/audit", params={"entity_id": standard_id})
    ).json()
    assert len(audit) == 1
    assert audit[0]["old_value"] == "初版标准"
    assert audit[0]["new_value"] == "修订标准"
    assert audit[0]["operator_subject"] == "eea-test-actor"
    assert audit[0]["corrected_at"]


async def test_no_rows_are_fabricated_for_untouched_cells(client):
    """REQ-STD-02 / REQ-STD-03: the system never auto-writes entries to fill
    out the three phases or three constraint types — a technology being
    plausible generates no standard by itself."""
    lp = await _lp(client)
    await put_standard(client, lp["id"], "设计", "工程化", "满足AEC-Q100")
    await put_standard(client, lp["id"], "制造", "工程化", "完成保护功能验证")
    grid = (await client.get(f"/api/v1/landing-points/{lp['id']}/standards")).json()
    assert len(grid["cells"]) == 2
    assert {c["phase"] for c in grid["cells"]} == {"设计", "制造"}
    assert {c["constraint_type"] for c in grid["cells"]} == {"工程化"}


async def test_standards_on_unknown_landing_point_404(client):
    r = await client.get("/api/v1/landing-points/00000000-0000-0000-0000-000000000001/standards")
    assert r.status_code == 404
    r = await client.put(
        "/api/v1/landing-points/00000000-0000-0000-0000-000000000001/standards",
        json={"phase": "设计", "constraint_type": "工程化", "requirement_text": "x"},
    )
    assert r.status_code == 404
