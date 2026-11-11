#!/usr/bin/env bash
# Run backend pytest in slices to shorten feedback and avoid eea_test lock fights.
# Full integration still needs exclusive DB access (one db session at a time).
set -euo pipefail
cd "$(dirname "$0")/.."

PYTEST=(uv run pytest -q)

usage() {
  cat <<'EOF'
Usage: ./scripts/pytest_slices.sh <slice> [extra pytest args...]

Slices:
  unit          -m no_db          Fast checks: no lock, no PostgreSQL
  integration   -m db             All eea_test API tests (default full suite)
  openapi       OpenAPI path snapshot only
  capture       Capture / jobs / URL list
  agent         Agent workflow + pydantic wiring
  documents     Document ingest & signals from docs
  llm           LLM tags, gateway, usage (mostly mocked)
  contracts     import-linter + OpenAPI snapshot

Lock (integration only):
  EEA_PYTEST_LOCK=fail   (default) exit immediately if another session holds eea_test
  EEA_PYTEST_LOCK=block    wait for the lock
  EEA_PYTEST_LOCK=skip     no cross-process lock (unsafe with parallel TRUNCATE)

Examples:
  ./scripts/pytest_slices.sh unit
  ./scripts/pytest_slices.sh capture --tb=short
  OPENAPI_UPDATE_SNAPSHOT=1 ./scripts/pytest_slices.sh openapi
EOF
}

slice="${1:-}"
shift || true

case "$slice" in
  unit)
    exec "${PYTEST[@]}" -m no_db "$@"
    ;;
  integration|db|full)
    exec "${PYTEST[@]}" -m db "$@"
    ;;
  openapi)
    exec "${PYTEST[@]}" tests/test_openapi_snapshot.py "$@"
    ;;
  capture)
    exec "${PYTEST[@]}" \
      tests/test_capture.py \
      tests/test_capture_unified.py \
      tests/test_capture_jobs.py \
      tests/test_capture_extension_upload.py \
      tests/test_url_list_capture.py \
      "$@"
    ;;
  agent)
    exec "${PYTEST[@]}" \
      tests/test_agent_workflow.py \
      tests/test_pydantic_ai_wiring.py \
      "$@"
    ;;
  documents)
    exec "${PYTEST[@]}" \
      tests/test_documents_raw.py \
      tests/test_document_ingest.py \
      tests/test_document_signals.py \
      tests/test_doc_pdf_preview.py \
      "$@"
    ;;
  llm)
    exec "${PYTEST[@]}" \
      tests/test_llm_tags.py \
      tests/test_llm_gateway_models.py \
      tests/test_llm_usage.py \
      tests/test_llm_status.py \
      tests/test_tech_tag_pipeline.py \
      "$@"
    ;;
  contracts)
    uv run lint-imports
    exec "${PYTEST[@]}" tests/test_openapi_snapshot.py "$@"
    ;;
  -h|--help|help|"")
    usage
    exit 0
    ;;
  *)
    echo "Unknown slice: $slice" >&2
    usage
    exit 1
    ;;
esac
