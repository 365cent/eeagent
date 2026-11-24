"""Redundant-signal scan and cleanup (REQ-SIG: duplicate captures stay removable)."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import pytest

from app.services import signal_dedup
from app.services.signal_dedup import fingerprint, group_signals, keep_priority
from tests.support import create_signal

pytestmark = [pytest.mark.anyio, pytest.mark.db]


class _FakeVocab:
    def __init__(self, name: str) -> None:
        self.name = name


class _FakeTag:
    def __init__(self, name: str) -> None:
        self.vocab = _FakeVocab(name)


class _FakeSignal:
    """Minimal Signal stand-in so grouping rules are testable without a DB."""

    def __init__(
        self,
        *,
        title: str = "同一篇文章",
        url_normalized: str = "http://example.com/a",
        body_sha256: str | None = None,
        snapshot_html_object_key: str | None = None,
        tags: tuple[str, ...] = (),
        tech_theme_id: uuid.UUID | None = None,
        excerpt: str | None = None,
        evidence_status_code: str = "retained",
        created_at: datetime | None = None,
        publisher: str = "发布方",
        signal_type_code: str | None = "技术进展",
    ) -> None:
        self.id = uuid.uuid4()
        self.title = title
        self.url = url_normalized
        self.url_normalized = url_normalized
        self.body_sha256 = body_sha256
        self.snapshot_html_object_key = snapshot_html_object_key
        self.tags = [_FakeTag(name) for name in tags]
        self.tech_theme_id = tech_theme_id
        self.excerpt = excerpt
        self.evidence_status_code = evidence_status_code
        self.created_at = created_at or datetime(2026, 1, 1, tzinfo=timezone.utc)
        self.updated_at = self.created_at
        self.publisher = publisher
        self.signal_type_code = signal_type_code
        self.value_chain_stage_code = "创造端"
        self.channel_code = "web"
        self.published_at = None


def test_identical_copies_form_one_group_and_are_marked_interchangeable():
    first = _FakeSignal(tags=("eFuse",))
    second = _FakeSignal(tags=("eFuse",), created_at=first.created_at + timedelta(days=1))

    groups = group_signals([first, second])

    assert len(groups) == 1
    group = groups[0]
    assert group.kind == "url"
    assert group.identical is True
    assert group.different_fields == []
    assert group.survivor is first  # earlier capture wins the tie
    assert [member.keep for member in group.members] == [True, False]
    assert len(group.redundant) == 1


def test_differing_copies_report_the_exact_fields():
    first = _FakeSignal(tags=("eFuse",), excerpt="旧摘要")
    second = _FakeSignal(tags=("eFuse", "BMS"), excerpt="新摘要")

    group = group_signals([first, second])[0]

    assert group.identical is False
    assert set(group.different_fields) == {"tags", "excerpt"}
    assert set(group.values["excerpt"]) == {str(first.id), str(second.id)}
    assert group.values["excerpt"][str(second.id)] == "新摘要"


def test_title_suffix_from_repeated_capture_is_not_a_difference():
    first = _FakeSignal(title="蔚来 ET9 数字架构")
    second = _FakeSignal(title="蔚来 ET9 数字架构 (重复采集 #2)")

    group = group_signals([first, second])[0]

    assert group.different_fields == []
    assert group.identical is True


def test_keep_priority_prefers_archive_then_body_then_completeness():
    theme = uuid.uuid4()
    plain = _FakeSignal(tags=("a",))
    rich = _FakeSignal(tags=("a", "b"), tech_theme_id=theme, excerpt="摘要")
    with_body = _FakeSignal(body_sha256="a" * 64)
    with_archive = _FakeSignal(snapshot_html_object_key="signals/x.html")

    ordered = sorted([plain, rich, with_body, with_archive], key=keep_priority)

    assert ordered[0] is with_archive
    assert ordered[1] is with_body
    assert ordered[2] is rich
    assert ordered[3] is plain


def test_same_content_under_different_urls_is_a_suspected_duplicate():
    page = _FakeSignal(url_normalized="http://example.com/a", body_sha256="b" * 64)
    upload = _FakeSignal(
        url_normalized="eea://document/1", body_sha256="b" * 64, title="另一条标题"
    )

    groups = group_signals([page, upload])

    assert [group.kind for group in groups] == ["body"]
    assert groups[0].identical is False  # different URL/title: a human decides


def test_different_articles_sharing_a_bare_path_are_not_duplicates():
    """Baidu/CSDN keep article identity in ?id=, which url_normalized drops."""
    first = _FakeSignal(url_normalized="https://baijiahao.baidu.com/s?id=111")
    second = _FakeSignal(url_normalized="https://baijiahao.baidu.com/s?id=222")
    assert group_signals([first, second]) == []


def test_tracking_parameters_do_not_split_a_duplicate():
    plain = _FakeSignal(url_normalized="https://example.com/a/1")
    shared = _FakeSignal(url_normalized="https://example.com/a/1?from=timeline&utm_source=wx")
    groups = group_signals([plain, shared])
    assert len(groups) == 1
    assert {m.signal.id for m in groups[0].members} == {plain.id, shared.id}


def test_single_signals_are_not_groups():
    assert group_signals([_FakeSignal()]) == []
    assert group_signals([]) == []


def test_fingerprint_ignores_identity_and_timestamps():
    first = _FakeSignal()
    second = _FakeSignal(created_at=first.created_at + timedelta(days=3))
    assert fingerprint(first) == fingerprint(second)
    assert set(fingerprint(first)) == set(signal_dedup.COMPARED_FIELDS)


async def test_scan_and_cleanup_endpoints(client):
    url = "https://example.com/duplicate-article"
    keep = await create_signal(client, url=url, title="重复文章")
    copy = await create_signal(client, url=url, title="重复文章 (重复采集 #2)")

    scan = (await client.get("/api/v1/signals/duplicates")).json()
    groups = [g for g in scan["groups"] if any(m["id"] == copy["id"] for m in g["members"])]
    assert groups, scan
    group = groups[0]
    assert group["identical"] is True
    assert scan["redundant_signals"] >= 1

    keep_id = next(m["id"] for m in group["members"] if m["keep"])
    assert keep_id == keep["id"]

    result = (
        await client.post(
            "/api/v1/signals/duplicates/cleanup",
            json={"delete_ids": [copy["id"]], "reason": "测试清理"},
        )
    ).json()
    assert result["deleted"] == [copy["id"]]
    assert result["skipped"] == []
    assert (await client.get(f"/api/v1/signals/{copy['id']}")).status_code == 404
    assert (await client.get(f"/api/v1/signals/{keep['id']}")).status_code == 200


async def test_cleanup_never_deletes_the_last_copy_of_a_group(client):
    url = "https://example.com/only-copy"
    only = await create_signal(client, url=url, title="仅此一份")
    twin = await create_signal(client, url=url, title="仅此一份 (重复采集 #2)")

    result = (
        await client.post(
            "/api/v1/signals/duplicates/cleanup",
            json={"delete_ids": [only["id"], twin["id"]]},
        )
    ).json()

    assert result["deleted"] == []
    assert {row["id"] for row in result["skipped"]} == {only["id"], twin["id"]}
    assert all("至少保留一份" in row["reason"] for row in result["skipped"])
    assert (await client.get(f"/api/v1/signals/{only['id']}")).status_code == 200


async def test_cleanup_skips_signals_that_are_not_duplicates(client):
    single = await create_signal(client, url="https://example.com/unique", title="唯一信号")

    result = (
        await client.post(
            "/api/v1/signals/duplicates/cleanup", json={"delete_ids": [single["id"]]}
        )
    ).json()

    assert result["deleted"] == []
    assert result["skipped"][0]["reason"].startswith("不在任何重复组内")
    assert (await client.get(f"/api/v1/signals/{single['id']}")).status_code == 200


async def test_cleanup_writes_an_audit_record(client):
    url = "https://example.com/audited-duplicate"
    await create_signal(client, url=url, title="留痕文章")
    copy = await create_signal(client, url=url, title="留痕文章 (重复采集 #2)")

    await client.post(
        "/api/v1/signals/duplicates/cleanup",
        json={"delete_ids": [copy["id"]], "reason": "同源重复"},
    )
    audit = (
        await client.get("/api/v1/audit", params={"entity_id": copy["id"]})
    ).json()
    rows = audit if isinstance(audit, list) else audit.get("items", [])
    assert any(row["field_name"] == "signal_record" for row in rows), audit
