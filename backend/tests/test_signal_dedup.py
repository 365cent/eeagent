"""Redundant-signal scan and cleanup (REQ-SIG: duplicate captures stay removable)."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import pytest

from app.services import signal_dedup
from app.services.signal_dedup import fingerprint, group_signals, keep_priority
from app.services.tagging import normalize_url
from tests.support import create_signal

pytestmark = [pytest.mark.anyio, pytest.mark.db]


class _FakeVocab:
    def __init__(self, name: str) -> None:
        self.name = name


class _FakeTag:
    def __init__(self, name: str) -> None:
        self.vocab = _FakeVocab(name)


class _FakeSignal:
    """Minimal Signal stand-in so grouping rules are testable without a DB.

    Real rows keep the raw URL in ``url`` and a query-free key in
    ``url_normalized``; the fake does the same so grouping tests see the split.
    """

    def __init__(
        self,
        *,
        title: str = "同一篇文章",
        url: str | None = None,
        url_normalized: str | None = None,
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
        self.url = url if url is not None else (url_normalized or "http://example.com/a")
        self.url_normalized = (
            url_normalized if url_normalized is not None else normalize_url(self.url)
        )
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
    """Baidu keeps article identity in ?id=, which url_normalized drops.

    Regression guard for the old grouping key: it read url_normalized, so these
    two different articles were offered as deletable copies of each other.
    """
    first = _FakeSignal(url="https://baijiahao.baidu.com/s?id=111")
    second = _FakeSignal(url="https://baijiahao.baidu.com/s?id=222")

    assert first.url_normalized == second.url_normalized  # what the old key saw
    assert group_signals([first, second]) == []


def test_wechat_share_wrapper_does_not_split_the_same_article():
    plain = _FakeSignal(url="https://mp.weixin.qq.com/s?__biz=1&mid=2&idx=1&sn=abc")
    shared = _FakeSignal(
        url="https://mp.weixin.qq.com/s?__biz=1&mid=2&idx=1&sn=abc&from=timeline&scene=1",
        title="同一篇文章 (重复采集 #2)",
    )

    groups = group_signals([plain, shared])

    assert len(groups) == 1
    assert {m.signal.id for m in groups[0].members} == {plain.id, shared.id}
    assert groups[0].identical is True  # safe to delete without asking


def test_from_is_content_on_other_hosts_so_pages_stay_apart():
    """A list that pages by ?from= must not merge: deletion is permanent."""
    phone = _FakeSignal(url="https://example.com/models?from=phone", title="车型列表")
    laptop = _FakeSignal(url="https://example.com/models?from=laptop", title="车型列表")

    assert phone.url_normalized == laptop.url_normalized  # same path
    assert group_signals([phone, laptop]) == []


def test_re_capture_with_unknown_tracking_param_is_a_suspect_group():
    """?t= is not in the denylist, but the duplicate suffix proves a re-capture."""
    first = _FakeSignal(url="https://example.com/a/1?t=100")
    second = _FakeSignal(url="https://example.com/a/1?t=200", title="同一篇文章 (重复采集 #2)")

    groups = group_signals([first, second])

    assert [group.kind for group in groups] == ["url_suspect"]
    group = groups[0]
    assert group.identical is False  # a human picks the survivor
    assert "url" in group.different_fields  # the card has something to show
    assert set(group.values["url"]) == {str(first.id), str(second.id)}


def test_suspect_fallback_does_not_merge_never_re_captured_urls():
    """Without the duplicate suffix, same url_normalized is not evidence."""
    page_one = _FakeSignal(url="https://example.com/list?page=1", title="列表")
    page_two = _FakeSignal(url="https://example.com/list?page=2", title="列表")

    assert page_one.url_normalized == page_two.url_normalized
    assert group_signals([page_one, page_two]) == []


def test_suspect_fallback_does_not_split_a_real_url_group():
    same_key = _FakeSignal(url="https://example.com/a?t=1")
    same_key_copy = _FakeSignal(url="https://example.com/a?t=1", title="同一篇文章 (重复采集 #2)")
    third = _FakeSignal(url="https://example.com/a?t=2", title="同一篇文章 (重复采集 #3)")

    groups = group_signals([same_key, same_key_copy, third])

    assert [group.kind for group in groups] == ["url"]  # third has no partner left
    assert {m.signal.id for m in groups[0].members} == {same_key.id, same_key_copy.id}


def test_blank_query_value_stays_a_different_url():
    """``?id=`` is a parameter with an empty value, not the bare page."""
    bare = _FakeSignal(url="https://example.com/x")
    blank = _FakeSignal(url="https://example.com/x?id=")

    assert bare.url_normalized == blank.url_normalized  # what the old key saw
    assert group_signals([bare, blank]) == []


def test_utm_parameters_are_tracking_on_every_host():
    plain = _FakeSignal(url="https://example.com/a/1")
    tagged = _FakeSignal(url="https://example.com/a/1?utm_source=wx&utm_medium=share")

    groups = group_signals([plain, tagged])

    assert len(groups) == 1
    assert {m.signal.id for m in groups[0].members} == {plain.id, tagged.id}


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


async def test_scan_endpoint_serializes_a_suspect_group(client):
    """The API accepts url_suspect and keeps it out of the auto-delete path."""
    first = await create_signal(client, url="https://example.com/live?t=1", title="线上文章")
    second = await create_signal(
        client, url="https://example.com/live?t=2", title="线上文章 (重复采集 #2)"
    )

    scan = (await client.get("/api/v1/signals/duplicates")).json()
    group = next(
        candidate
        for candidate in scan["groups"]
        if any(member["id"] == second["id"] for member in candidate["members"])
    )

    assert group["kind"] == "url_suspect"
    assert group["identical"] is False
    assert "url" in group["different_fields"]
    assert {member["id"] for member in group["members"]} == {first["id"], second["id"]}


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
