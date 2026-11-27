"""Compatibility entry point; implementation lives in app.domains.skills.eval."""
from __future__ import annotations

from app.domains.skills.eval import evaluate_gold_set, main  # noqa: F401


if __name__ == "__main__":
    main()
