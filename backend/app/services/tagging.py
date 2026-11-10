import hashlib
import logging
import re
from urllib.parse import urlparse, urlunparse

import jieba
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Vocab

STOP = {"的", "了", "在", "是", "和", "与", "将", "及", "对", "等", "中", "为", "从", "到", "a", "the"}

_MD_LINK = re.compile(r"\[([^\]]*)\]\([^)]*\)")
_MD_IMAGE = re.compile(r"!\[([^\]]*)\]\([^)]*\)")
_URL = re.compile(r"https?://\S+", re.IGNORECASE)
# Residual host/path tokens after URL stripping (markitdown nav chrome).
_BARE_HOST = re.compile(
    r"\b(?:www\.)?[a-z0-9][-a-z0-9]*\.(?:com|cn|net|org|html|io|co)(?:/\S*)?\b",
    re.IGNORECASE,
)
_URLISH_TOKEN = re.compile(
    r"^(?:https?|www\.?|com|cn|net|org|html|io|co|gov|edu|eet|tag)(?:\d+)?$",
    re.IGNORECASE,
)
# jieba noise on roman tokens / domains split into pieces
_ASCII_FRAGMENT = re.compile(r"^[a-z0-9]{2,12}$", re.IGNORECASE)

TAG_RECALL_LIMIT = 28
TAG_RERANK_POOL = 18
TAG_FINAL_DEFAULT = 6
TAG_FINAL_MAX = 9

logger = logging.getLogger(__name__)


def is_low_quality_tag(name: str) -> bool:
    name = name.strip()
    if not name or len(name) < 2:
        return True
    if _URLISH_TOKEN.match(name):
        return True
    if name.isascii() and _ASCII_FRAGMENT.match(name) and not any(c.isupper() for c in name):
        return True
    return False


def normalize_url(url: str) -> str:
    p = urlparse(url.strip())
    return urlunparse((p.scheme.lower(), p.netloc.lower(), p.path.rstrip("/"), "", "", ""))


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def text_for_tagging(title: str | None, body: str | None) -> str:
    """Build jieba/LLM input from markitdown body, not raw URLs in nav chrome.

    When ``body`` is present it alone drives tagging (title is still used for
    LLM prompts elsewhere). Markdown link targets and ``https://`` spans are
    stripped so jieba does not emit ``com`` / ``https`` tokens from site menus.
    """
    primary = (body or "").strip()
    if not primary:
        primary = (title or "").strip()
    if not primary:
        return ""
    text = _MD_IMAGE.sub(r"\1", primary)
    text = _MD_LINK.sub(r"\1", text)
    text = _URL.sub(" ", text)
    text = _BARE_HOST.sub(" ", text)
    text = re.sub(r"[#*_>`|]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def suggest_tags_from_snapshot(title: str | None, body: str | None, limit: int = 6) -> list[str]:
    return suggest_tags(text_for_tagging(title, body), limit=limit)


def suggest_tags(text: str, limit: int = 6) -> list[str]:
    """REQ-TAG-05: 高频汇总生成技术方向标签（初判，条数随内容调整）。"""
    if not text:
        return []
    words = [
        w.strip()
        for w in jieba.cut_for_search(text)
        if len(w.strip()) >= 2
        and w.strip() not in STOP
        and not is_low_quality_tag(w.strip())
    ]
    freq: dict[str, int] = {}
    for w in words:
        freq[w] = freq.get(w, 0) + 1
    ranked = sorted(freq.items(), key=lambda kv: (-kv[1], kv[0]))
    return [w for w, _ in ranked[:limit]]


async def suggest_tags_with_rerank(
    text: str,
    *,
    limit: int = 6,
    recall_limit: int = TAG_RECALL_LIMIT,
) -> tuple[list[str], str, float | None]:
    """Jieba recall then optional MaaS rerank (BE-04); falls back to frequency order."""
    candidates = suggest_tags(text, limit=recall_limit)
    if not candidates:
        return [], "jieba-frequency", None
    from app.services import semantic_api

    query = text.strip()[:1200]
    if not query or not semantic_api.semantic_configured():
        return candidates[:limit], "jieba-frequency", None
    try:
        scores = await semantic_api.rerank(query, candidates)
        ranked = sorted(scores, key=lambda row: -row[1])
        ordered = [candidates[i] for i, _ in ranked[:limit]]
        top_score = ranked[0][1] if ranked else None
        return ordered, "embedding-rerank", top_score
    except Exception as exc:
        logger.warning("rerank unavailable, using jieba order: %s", exc)
        return candidates[:limit], "jieba-frequency", None


async def suggest_tech_tags(
    title: str | None,
    body: str | None,
    *,
    final_limit: int = TAG_FINAL_DEFAULT,
    final_max: int = TAG_FINAL_MAX,
    rerank_pool: int = TAG_RERANK_POOL,
) -> tuple[list[str], str, float | None]:
    """REQ-TAG-05 pipeline: jieba recall → embedding rerank → LLM pick (≤ final_max)."""
    from app.services.llm import pick_tech_tags_from_candidates

    text = text_for_tagging(title, body)
    if not text:
        return [], "jieba-frequency", None

    reranked, source, top_score = await suggest_tags_with_rerank(
        text,
        limit=rerank_pool,
        recall_limit=TAG_RECALL_LIMIT,
    )
    if not reranked:
        return [], source, top_score

    pool = reranked[:rerank_pool]
    picked = await pick_tech_tags_from_candidates(
        title or "",
        text,
        pool,
        max_tags=min(final_max, len(pool)),
    )
    if picked:
        return picked[:final_limit], "llm-rerank-refine", top_score
    return reranked[:final_limit], source, top_score


async def get_or_create_vocab(db: AsyncSession, kind: str, name: str) -> Vocab:
    name = name.strip()
    obj = (await db.execute(select(Vocab).where(Vocab.kind == kind, Vocab.name == name))).scalar_one_or_none()
    if obj is None:
        # UNIQUE (kind, name) is the arbiter under concurrency: a racing create
        # that slipped past the select loses the INSERT ... ON CONFLICT DO
        # NOTHING and re-selects the winner's committed row instead of raising
        # IntegrityError (models.py UniqueConstraint("kind", "name")).
        stmt = (
            pg_insert(Vocab)
            .values(kind=kind, name=name)
            .on_conflict_do_nothing(index_elements=["kind", "name"])
            .returning(Vocab)
        )
        obj = (await db.execute(stmt)).scalar_one_or_none()
        if obj is None:
            obj = (
                (await db.execute(select(Vocab).where(Vocab.kind == kind, Vocab.name == name))).scalar_one()
            )
    return obj
