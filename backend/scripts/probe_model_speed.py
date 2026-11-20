"""Measure chat-model throughput on the gateway from backend/.env (read-only).

One streaming request per chat-capable id: time to first token, total latency,
and completion tokens when the gateway reports usage. Nothing is written to the
database, the object store, or ``backend/.env``.

Usage from backend/:

    uv run python scripts/probe_model_speed.py
    uv run python scripts/probe_model_speed.py --limit 4 --timeout 20
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.platform.http import open_async_http_client
from app.services import llm_gateway

PROMPT = "用一句话说明汽车电子电气架构（EEA）是什么。"
SEMAPHORE = asyncio.Semaphore(2)


async def probe(model: str, base: str, timeout: float) -> dict:
    """One streaming completion; returns measurements, never raises."""
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": PROMPT}],
        "max_tokens": 64,
        "temperature": 0,
        "stream": True,
    }
    started = time.perf_counter()
    first_at: float | None = None
    parts: list[str] = []
    usage: dict | None = None
    try:
        async with SEMAPHORE, open_async_http_client(timeout=timeout) as client:
            async with client.stream(
                "POST",
                f"{base}/chat/completions",
                headers=llm_gateway._headers(),
                json=payload,
            ) as response:
                if response.status_code >= 400:
                    body = (await response.aread())[:160].decode("utf-8", "replace")
                    return {
                        "model": model,
                        "status": response.status_code,
                        "detail": body.replace("\n", " "),
                    }
                async for line in response.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    data = line[5:].strip()
                    if not data or data == "[DONE]":
                        continue
                    try:
                        chunk = json.loads(data)
                    except ValueError:
                        continue
                    if isinstance(chunk.get("usage"), dict):
                        usage = chunk["usage"]
                    for choice in chunk.get("choices") or []:
                        delta = (choice.get("delta") or {}).get("content")
                        if isinstance(delta, str) and delta:
                            if first_at is None:
                                first_at = time.perf_counter()
                            parts.append(delta)
    except Exception as exc:  # noqa: BLE001 - a probe failure is data, not a crash
        return {"model": model, "status": 0, "detail": f"{type(exc).__name__}: {exc}"[:160]}

    total_s = max(1e-3, time.perf_counter() - started)
    text = "".join(parts)
    tokens = 0
    if isinstance(usage, dict):
        for key in ("completion_tokens", "output_tokens"):
            value = usage.get(key)
            if isinstance(value, int) and value > 0:
                tokens = value
                break
    return {
        "model": model,
        "status": 200,
        "empty": not text.strip(),
        "ttft_ms": round((first_at - started) * 1000) if first_at else None,
        "total_ms": round(total_s * 1000),
        "tokens": tokens or None,
        "tps": round(tokens / total_s, 2) if tokens else None,
        "chars": len(text),
    }


async def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=0, help="probe only the first N chat ids")
    parser.add_argument("--timeout", type=float, default=25.0, help="per-request seconds")
    args = parser.parse_args()

    settings = llm_gateway.get_settings()
    base = settings.chat_base_url_normalized
    if not llm_gateway.llm_configured():
        print("CHAT_BASE_URL is unset or still the .env.example placeholder")
        return 1
    if not settings.chat_api_key_value:
        print("CHAT_API_KEY is empty")
        return 1

    models = await llm_gateway.list_models()
    candidates = llm_gateway.chat_candidates(models)
    if args.limit:
        candidates = candidates[: args.limit]
    print(f"gateway={base} chat candidates={len(candidates)} timeout={args.timeout}s\n")

    results = await asyncio.gather(*(probe(model, base, args.timeout) for model in candidates))
    ranked = sorted(
        results,
        key=lambda row: (0 if row.get("tps") else 1, -(row.get("tps") or 0), row["model"]),
    )
    header = f"{'model':<32} {'status':>6} {'ttft_ms':>8} {'total_ms':>9} {'tokens':>6} {'tps':>7}"
    print(header)
    print("-" * len(header))
    for row in ranked:
        print(
            f"{row['model']:<32} {row.get('status'):>6} "
            f"{str(row.get('ttft_ms') or '-'):>8} {str(row.get('total_ms') or '-'):>9} "
            f"{str(row.get('tokens') or '-'):>6} {str(row.get('tps') or '-'):>7}"
            + ("  EMPTY" if row.get("empty") else "")
            + (f"  {row.get('detail', '')}" if row.get("status") != 200 else "")
        )
    ok = [row for row in results if row.get("status") == 200 and not row.get("empty")]
    print(f"\nanswered: {len(ok)}/{len(candidates)}")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
