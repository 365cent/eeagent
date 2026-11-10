"""Schema-level acceptance checks against the dedicated test database
(SCHEMA-PROPOSAL-BASIS, SCHEMA-ASSESSMENT-VERSION, SCHEMA-VOCAB).

These run against eea_test after the migrations — the same migrations that
build the live schema — and verify constraints the API alone cannot prove
(partial unique index, generated column, exact table/view inventory).
"""

import psycopg
import pytest

from tests.conftest import SETTINGS
from tests.support import (
    create_confirmed_demand,
    create_function,
    create_landing_point,
    publish_function,
)

pytestmark = pytest.mark.anyio

DSN = (
    f"host={SETTINGS.db_host} port={SETTINGS.db_port} "
    f"user={SETTINGS.db_user} password={SETTINGS.db_password} "
    f"dbname={SETTINGS.db_name}"
)

EXPECTED_TABLES = {
    "eea_ref_code",
    "eea_vocab",
    "eea_tech_theme",
    "eea_demand_point",
    "eea_signal",
    "eea_signal_tag",
    "eea_correction_audit",
    "eea_document",
    "eea_document_chunk",
    "eea_document_figure",
    "eea_access_log",
    "eea_capture_job",
    "eea_vehicle_function",
    "eea_tech_landing_point",
    "eea_deployment_standard",
    "eea_strategic_assessment",
    "eea_strategic_funnel",
    "eea_agent_session",
    "eea_agent_run",
    "eea_agent_message",
    "eea_agent_event",
    "eea_agent_patch",
    "eea_agent_memory",
    "eea_panorama_import_batch",
    "eea_panorama_import_url",
}

EXPECTED_VIEWS = {"eea_v_tech_theme_metrics", "eea_v_tech_theme_display_tags"}


def _sync():
    return psycopg.connect(DSN)


def test_migration_creates_exactly_the_enumerated_tables_and_views():
    """Schema inventory includes the original 11 tables, raw documents,
    access history and the durable capture queue, plus the two views."""
    with _sync() as conn:
        rows = conn.execute(
            "SELECT table_name, table_type FROM information_schema.tables "
            "WHERE table_schema = 'public'"
        ).fetchall()
    tables = {name for name, kind in rows if kind == "BASE TABLE"}
    views = {name for name, kind in rows if kind == "VIEW"}
    assert {t for t in tables if t.startswith("eea_")} == EXPECTED_TABLES
    assert views == EXPECTED_VIEWS
    assert tables - EXPECTED_TABLES == {"alembic_version"}


async def test_two_current_assessments_for_one_landing_point_are_impossible(client):
    """SCHEMA-ASSESSMENT-VERSION: the partial unique index enforces exactly
    one is_current row per landing point."""
    demand = await create_confirmed_demand(client)
    func = await create_function(client, demand["id"])
    await publish_function(client, func["id"])
    lp = await create_landing_point(client, func["id"])

    # raw SQL must supply the id: the ORM's uuid default is Python-side
    insert_sql = (
        "INSERT INTO eea_strategic_assessment "
        "(id, tech_landing_point_id, version, funnel_step, score_business, score_maturity, "
        "score_moat, score_supply_chain, score_feasibility, classification, is_current) "
        "VALUES (gen_random_uuid(), %s, %s, 4, 4, 4, 3, 4, 5, '前瞻布局', true)"
    )
    with _sync() as conn:
        with conn.transaction():
            conn.execute(insert_sql, (lp["id"], 1))
        with pytest.raises(psycopg.errors.UniqueViolation):
            with conn.transaction():
                conn.execute(insert_sql, (lp["id"], 2))


async def test_score_total_is_generated_not_writable(client):
    """SCHEMA-ASSESSMENT-VERSION: score_total is a GENERATED ALWAYS … STORED
    column — direct writes are rejected (SQLSTATE 428C9, generated_always_violation)."""
    demand = await create_confirmed_demand(client)
    func = await create_function(client, demand["id"])
    await publish_function(client, func["id"])
    lp = await create_landing_point(client, func["id"])

    insert_sql = (
        "INSERT INTO eea_strategic_assessment "
        "(id, tech_landing_point_id, version, funnel_step, score_business, score_maturity, "
        "score_moat, score_supply_chain, score_feasibility, classification, is_current) "
        "VALUES (gen_random_uuid(), %s, 1, 4, 4, 4, 3, 4, 5, '前瞻布局', true) RETURNING score_total"
    )
    with _sync() as conn:
        with conn.transaction():
            total = conn.execute(insert_sql, (lp["id"],)).fetchone()[0]
            assert total == 20  # generated as the stored sum of the five
        with pytest.raises(psycopg.Error) as excinfo:
            with conn.transaction():
                conn.execute(
                    "UPDATE eea_strategic_assessment SET score_total = 99 "
                    "WHERE tech_landing_point_id = %s",
                    (lp["id"],),
                )
        assert excinfo.value.sqlstate == "428C9"  # generated_always_violation


async def test_vocab_kind_name_unique_enforced():
    """SCHEMA-VOCAB: UNIQUE (kind, name) is enforced at the storage level."""
    with _sync() as conn:
        with conn.transaction():
            conn.execute(
                "INSERT INTO eea_vocab (id, kind, name) "
                "VALUES (gen_random_uuid(), 'tech_tag', '唯一性探针')"
            )
        with pytest.raises(psycopg.errors.UniqueViolation):
            with conn.transaction():
                conn.execute(
                    "INSERT INTO eea_vocab (id, kind, name) "
                    "VALUES (gen_random_uuid(), 'tech_tag', '唯一性探针')"
                )


async def test_signal_tag_composite_pk_rejects_duplicate_rows(client):
    """SCHEMA-SIGNAL-TAG: PRIMARY KEY (signal_id, vocab_id) makes duplicate
    (signal, tag) pairs impossible at the storage level."""
    from tests.support import create_signal, set_signal_tags

    sig = await create_signal(client)
    await set_signal_tags(client, sig["id"], ["主键探针"])
    with _sync() as conn:
        vocab_id = conn.execute(
            "SELECT id FROM eea_vocab WHERE kind = 'tech_tag' AND name = '主键探针'"
        ).fetchone()[0]
        with pytest.raises(psycopg.errors.UniqueViolation):
            with conn.transaction():
                conn.execute(
                    "INSERT INTO eea_signal_tag (signal_id, vocab_id) VALUES (%s, %s)",
                    (sig["id"], vocab_id),
                )


async def test_document_sha256_unique_rejects_duplicate_rows():
    """B2 raw documents are content-addressed: UNIQUE (sha256) makes a second
    row for the same bytes impossible at the storage level — the API's
    duplicate upload path relies on this constraint as the backstop."""
    # uploaded_by is supplied explicitly: the model carries a client-side ORM
    # default only, so the fresh test DB (created by 0001 create_all from the
    # models) has no server-side default for the column.
    insert_sql = (
        "INSERT INTO eea_document (id, sha256, mime, size, object_key, uploaded_by) "
        "VALUES (gen_random_uuid(), %s, 'application/pdf', 3, 'documents/探针.bin', 'local-admin')"
    )
    digest = "a" * 64
    with _sync() as conn:
        with conn.transaction():
            conn.execute(insert_sql, (digest,))
        with pytest.raises(psycopg.errors.UniqueViolation):
            with conn.transaction():
                conn.execute(insert_sql, (digest,))
