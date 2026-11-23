"""Pydantic-backed cache for vision figure captions.

The same image often appears in duplicate captures and repeated documents.
Cache on the image bytes + requested model + prompt revision so a prompt or
model change cannot serve a stale caption. Files live under OBJECT_DIR so every
worker on the host shares them; failures are best-effort and never block ingest.
"""

from __future__ import annotations

import hashlib
import os
from pathlib import Path

from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.services.llm_prompts import PROMPT_REVISION


class CachedCaption(BaseModel):
    caption: str = Field(min_length=1, max_length=300)
    requested_model: str
    served_model: str = ""
    prompt_revision: str


def cache_root(directory: Path | None = None) -> Path:
    return directory or Path(get_settings().object_dir) / "caption-cache"


def _cache_path(data: bytes, model: str, directory: Path | None = None) -> Path:
    image_sha = hashlib.sha256(data).hexdigest()
    key = hashlib.sha256(
        f"{image_sha}\0{model}\0{PROMPT_REVISION}".encode("utf-8")
    ).hexdigest()
    return cache_root(directory) / key[:2] / f"{key}.json"


def load_caption(
    data: bytes, model: str, *, directory: Path | None = None
) -> CachedCaption | None:
    path = _cache_path(data, model, directory)
    try:
        entry = CachedCaption.model_validate_json(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    return entry if entry.prompt_revision == PROMPT_REVISION else None


def store_caption(
    data: bytes,
    model: str,
    caption: str,
    *,
    served_model: str = "",
    directory: Path | None = None,
) -> None:
    entry = CachedCaption(
        caption=caption,
        requested_model=model,
        served_model=served_model,
        prompt_revision=PROMPT_REVISION,
    )
    path = _cache_path(data, model, directory)
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = path.with_suffix(".tmp")
        tmp.write_text(entry.model_dump_json(), encoding="utf-8")
        os.replace(tmp, path)
    except OSError:
        pass
