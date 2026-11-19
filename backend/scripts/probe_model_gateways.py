"""Probe CHAT / EMBEDDING / RERANK gateways from backend/.env (read-only)."""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.core.config import get_settings
from app.services import llm_gateway, semantic_api


async def main() -> int:
    s = get_settings()
    print("=== Config (backend/.env) ===")
    print("CHAT_BASE_URL:", s.chat_base_url_normalized or "(unset)")
    print("CHAT_API_KEY set:", bool(s.chat_api_key_value))
    print("CHAT_MODEL:", s.chat_model_value or "(empty → auto-probe)")
    print("EMBEDDING_URL:", s.embedding_url or "(unset)")
    print("EMBEDDING_API_KEY set:", bool(s.embedding_api_key_value))
    print("RERANK_URL:", s.rerank_url or "(unset)")
    print("RERANK_API_KEY set:", bool(s.rerank_api_key_value))
    print()
    print("llm_configured:", llm_gateway.llm_configured())
    print("rerank_configured:", semantic_api.rerank_configured())
    print("embedding_configured:", semantic_api.embedding_configured())
    exit_code = 0

    if llm_gateway.llm_configured():
        print("\n=== Chat gateway ===")
        try:
            models = await llm_gateway.list_models()
            print(f"GET /models OK ({len(models)} ids)")
            chat = llm_gateway.chat_candidates(models)
            print("chat-capable sample:", ", ".join(chat[:6]) or "(none)")
            model = await llm_gateway.resolve_chat_model()
            print("resolve_chat_model:", model)
            text, served = await llm_gateway.chat_completion(
                [{"role": "user", "content": "ping"}],
                max_tokens=8,
            )
            print("chat_completion OK, served_model:", served, "reply:", repr(text[:80]))
        except Exception as exc:
            exit_code = 1
            print("CHAT FAIL:", type(exc).__name__, str(exc)[:500])
    else:
        print("\nChat: skip (CHAT_BASE_URL unset or still .env.example placeholder)")

    if semantic_api.rerank_configured():
        print("\n=== Rerank ===")
        try:
            scores = await semantic_api.rerank("电池管理系统", ["BMS", "座椅加热", "车载网络"])
            print("rerank OK:", scores)
        except Exception as exc:
            exit_code = 1
            print("RERANK FAIL:", type(exc).__name__, str(exc)[:500])
    else:
        print("\nRerank: skip (URL or API key missing)")

    if semantic_api.embedding_configured():
        print("\n=== Embedding ===")
        try:
            vecs = await semantic_api.create_embeddings(["probe"])
            print("embedding OK, dimension:", len(vecs[0]) if vecs else 0)
        except Exception as exc:
            exit_code = 1
            print("EMBEDDING FAIL:", type(exc).__name__, str(exc)[:500])
    else:
        print("\nEmbedding: skip (URL or API key missing)")

    return exit_code


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))