from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent


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
    object_dir: str = str(BACKEND_ROOT / ".pg" / "objects")

    llm_base_url: str = ""
    llm_api_key: str = ""
    llm_model: str = ""
    # iFlytek MaaS embedding/rerank (independent of llm_base_url chat proxy).
    maas_api_base_url: str = ""
    maas_api_key: str = ""
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
    # Hard cap on vision model resolve + caption batch so xlsx/pptx ingest
    # cannot wedgie the capture worker when the gateway is slow or unreachable.
    doc_ingest_vision_timeout_seconds: float = Field(default=120.0, gt=0)
    agent_patch_ttl_hours: int = Field(default=24, ge=1, le=168)
    agent_rag_chunk_size: int = Field(default=900, ge=200, le=4000)

    # LaunchDarkly server-side SDK (Test/Production SDK key from environment settings).
    launchdarkly_sdk_key: str = ""

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
    def llm_base_url_normalized(self) -> str:
        return self.llm_base_url.rstrip("/")

    @property
    def maas_api_base_normalized(self) -> str:
        return self.maas_api_base_url.strip().rstrip("/")

    @property
    def semantic_api_key(self) -> str:
        return self.maas_api_key.strip()

    @property
    def embedding_url(self) -> str:
        base = self.maas_api_base_normalized
        return f"{base}/embeddings" if base else ""

    @property
    def rerank_url(self) -> str:
        base = self.maas_api_base_normalized
        return f"{base}/rerank" if base else ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
