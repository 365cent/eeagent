"""Caption cache: keyed on image bytes, requested model and prompt revision."""

from app.platform.caption_cache import load_caption, store_caption
from app.platform.llm_prompts import PROMPT_REVISION


def test_roundtrip_returns_the_stored_caption(tmp_path):
    data = b"PNG-bytes" + b"x" * 40
    store_caption(data, "qwen-a", "an architecture diagram", served_model="qwen-a-served", directory=tmp_path)
    cached = load_caption(data, "qwen-a", directory=tmp_path)
    assert cached is not None
    assert cached.caption == "an architecture diagram"
    assert cached.served_model == "qwen-a-served"
    assert cached.prompt_revision == PROMPT_REVISION


def test_other_model_is_a_miss(tmp_path):
    data = b"PNG-bytes" + b"y" * 40
    store_caption(data, "qwen-a", "a caption", directory=tmp_path)
    assert load_caption(data, "qwen-b", directory=tmp_path) is None


def test_other_image_bytes_are_a_miss(tmp_path):
    store_caption(b"image-one", "qwen-a", "a caption", directory=tmp_path)
    assert load_caption(b"image-two", "qwen-a", directory=tmp_path) is None


def test_stale_prompt_revision_is_a_miss(tmp_path):
    data = b"PNG-bytes" + b"z" * 40
    store_caption(data, "qwen-a", "stale caption", directory=tmp_path)
    hits = list(tmp_path.rglob("*.json"))
    assert hits
    hits[0].write_text(
        hits[0].read_text(encoding="utf-8").replace(PROMPT_REVISION, "0"),
        encoding="utf-8",
    )
    assert load_caption(data, "qwen-a", directory=tmp_path) is None


def test_corrupt_entry_is_a_miss(tmp_path):
    data = b"PNG-bytes" + b"w" * 40
    store_caption(data, "qwen-a", "a caption", directory=tmp_path)
    next(tmp_path.rglob("*.json")).write_text("{not json", encoding="utf-8")
    assert load_caption(data, "qwen-a", directory=tmp_path) is None

