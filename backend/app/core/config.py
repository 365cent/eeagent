import re
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent


def model_chain(raw: str | None) -> list[str]:
    """Model ids from one config value, in order.

    ``CHAT_MODEL`` / ``VISION_MODEL`` accept a comma-separated list so one
    capability can fall back across the models the gateway really serves:
    ``Qwen3.8-27B,Qwen3.6-35B``. Order is the retry order; duplicates drop.
    """
    chain: list[str] = []
    for part in (raw or "").split(","):
        model = part.strip()
        if model and model not in chain:
            chain.append(model)
    return chain


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="", env_file=".env", extra="ignore")

    app_name: str = "EEA Backend"
    app_env: Literal["development", "test", "production"] = "development"
    dev_operator_subject: str = "local-development-user"
    dev_operator_role: Literal["researcher", "taxonomy_admin", "platform_admin"] = "researcher"
    trusted_proxy_ips: str = ""
    capture_server_fetch_enabled: bool = False
    capture_worker_poll_seconds: float = Field(default=1.0, gt=0)
    capture_worker_lease_seconds: int = Field(default=900, ge=60)
    capture_worker_max_attempts: int = Field(default=3, ge=1)
    capture_client_wait_seconds: int = Field(default=1800, ge=60)
    capture_client_max_claims: int = Field(default=3, ge=1)
    capture_client_claim_window_seconds: int = Field(default=600, ge=60)
    capture_client_max_claims_per_window: int = Field(default=60, ge=1)
    capture_client_dist_dir: str = ""
    capture_job_retention_days: int = Field(default=30, ge=1)
    db_host: str = "127.0.0.1"
    db_port: int = 54329
    db_user: str = "eea"
    db_password: str = "eea"
    db_name: str = "eea"
    api_port: int = 8000
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    cors_origin_regex: str = (
        r"^https?://(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}"
        r"|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}):\d+$"
    )
    # Extra origins allowed to embed the captured HTML replay in an iframe
    # (CSP frame-ancestors). CORS_ORIGINS is always allowed; add comma-separated
    # origins here when the intranet web host differs from a CORS origin.
    archive_frame_ancestors: str = ""
    object_dir: str = str(BACKEND_ROOT / ".pg" / "objects")

    # Primary gateway settings: one URL/key/model per capability.
    chat_base_url: str = ""
    chat_api_key: str = ""
    chat_model: str = ""
    embedding_base_url: str = ""
    embedding_api_key: str = ""
    rerank_base_url: str = ""
    rerank_api_key: str = ""
    embedding_model: str = "Qwen3-Embedding-8B"
    rerank_model: str = "Qwen3-Reranker-8B"
    vision_model: str = ""


    # Document upload (POST /documents/raw) and MarkItDown ingest caps (MiB-based).
    doc_raw_upload_max_bytes: int = 120 * 1024 * 1024
    doc_ingest_max_bytes: int = 120 * 1024 * 1024

    # Vision-caption budget per document (app/services/doc_ingest.py). Cap is
    # configurable: a large deck can hold far more document-body figures than 8
    # (2026-10-29 会议 S1-4: QCC 样例 95 张内嵌图，8 张上限只覆盖零头).
    max_figures: int = 16
    # Retries (beyond the first attempt) for a vision call that returns empty.
    vision_caption_retry: int = 2
    # Output ceiling for one caption. Reasoning-only vision ids (Qwen3.6-35B)
    # need room for their reasoning or they return finish_reason=length with an
    # empty body at 128 tokens; the caption itself stays one short sentence.
    vision_caption_max_tokens: int = Field(default=1024, ge=64, le=4096)
    # Hard cap on vision model resolve + caption batch so xlsx/pptx ingest
    # cannot wedgie the capture worker when the gateway is slow or unreachable.
    doc_ingest_vision_timeout_seconds: float = Field(default=120.0, gt=0)
    agent_patch_ttl_hours: int = Field(default=24, ge=1, le=168)
    # Hedged chat: defaults assume a slow, queue-heavy intranet model farm (long
    # TTFT tail). Hedge near p95, not median, to avoid doubling load. Override
    # via env only when ops has measured different percentiles for your gateway.
    chat_hedge_delay_seconds: float = Field(default=4.0, ge=0.2, le=60.0)
    chat_hedge_max_models: int = Field(default=4, ge=1, le=8)
    # First-token race for streaming agent; big reasoning models may cold-start.
    chat_first_token_timeout_seconds: float = Field(default=90.0, ge=3.0, le=300.0)
    # Reasoning-only ids must surface answer text within this peek or lose the race.
    chat_answer_peek_seconds: float = Field(default=6.0, ge=0.5, le=60.0)
    # One non-streaming completion (studio, drafts); studio mindmaps often >60s.
    chat_request_total_timeout_seconds: float = Field(default=180.0, ge=5.0, le=600.0)
    chat_attempt_budget_floor: int = Field(default=30, ge=1, le=200)
    chat_model_speed_ttl_seconds: float = Field(default=1800.0, ge=60.0, le=86400.0)
    vision_retry_base_delay_seconds: float = Field(default=1.5, ge=0.1, le=30.0)
    # Extra attempts per chat model after a transient failure (429/5xx/timeout),
    # still bounded by CHAT_REQUEST_TOTAL_TIMEOUT_SECONDS. 0 = one attempt each.
    chat_model_retries: int = Field(default=2, ge=0, le=5)
    # Hard ceiling for one agent turn so the chat never sits in 'thinking' forever.
    agent_turn_timeout_seconds: float = Field(default=90.0, ge=10.0, le=600.0)
    agent_rag_chunk_size: int = Field(default=900, ge=200, le=4000)

    # LaunchDarkly server-side SDK (Test/Production SDK key from environment settings).
    launchdarkly_sdk_key: str = ""
    skills_dir: str = ""
    capture_bearer_tokens: str = Field(
        default="",
        description="Comma-separated subject:token pairs for capture client Bearer auth",
    )

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def sync_database_url(self) -> str:
        return self.database_url

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def archive_frame_ancestor_policy(self) -> str:
        """CSP ``frame-ancestors`` value for the archive replay iframe.

        The workspace runs on :3000 while this API answers on :8000, so a plain
        ``X-Frame-Options: SAMEORIGIN`` makes the browser refuse the embed. Only
        the configured web origins may frame the replay - never a wildcard,
        because the archived page is untrusted third-party HTML.
        """
        extra = [o.strip() for o in self.archive_frame_ancestors.split(",") if o.strip()]
        return " ".join(dict.fromkeys(["'self'", *self.origins, *extra]))

    def allows_web_origin(self, origin: str | None) -> bool:
        """True when ``origin`` is a web origin allowed to call this API (CORS).

        Shared with the archive replay: the workspace reaches the API from
        ``http://<host>:3000`` while the API answers on ``:8000``, and CSP cannot
        express LAN IP ranges, so the pane names its origin and this allow-list
        decides whether ``frame-ancestors`` may include it.
        """
        candidate = (origin or "").strip()
        if not candidate or len(candidate) > 200:
            return False
        if candidate in self.origins:
            return True
        return re.fullmatch(self.cors_origin_regex, candidate) is not None

    def archive_frame_ancestors_for(self, requested_origin: str | None = None) -> str:
        """``frame-ancestors`` value, adding a validated requesting web origin."""
        sources = self.archive_frame_ancestor_policy.split()
        candidate = (requested_origin or "").strip()
        if candidate and candidate not in sources and self.allows_web_origin(candidate):
            sources.append(candidate)
        return " ".join(sources)

    @property
    def chat_base_url_normalized(self) -> str:
        return self.chat_base_url.strip().rstrip("/")

    @property
    def chat_api_key_value(self) -> str:
        return self.chat_api_key.strip()

    @property
    def chat_model_value(self) -> str:
        return self.chat_model.strip()

    @property
    def chat_model_chain(self) -> list[str]:
        """CHAT_MODEL as an ordered list; empty means auto-resolve."""
        return model_chain(self.chat_model)

    @property
    def vision_model_chain(self) -> list[str]:
        """VISION_MODEL as an ordered list: first model, then its fallbacks."""
        return model_chain(self.vision_model)

    @property
    def embedding_api_key_value(self) -> str:
        return self.embedding_api_key.strip()

    @property
    def rerank_api_key_value(self) -> str:
        return self.rerank_api_key.strip()

    @property
    def embedding_url(self) -> str:
        base = self.embedding_base_url.strip().rstrip("/")
        return f"{base}/embeddings" if base else ""

    @property
    def rerank_url(self) -> str:
        base = self.rerank_base_url.strip().rstrip("/")
        return f"{base}/rerank" if base else ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
