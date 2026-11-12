# EEA implementation boundaries

The system remains a modular monolith deployed as separate API, worker and web processes. Public routes, including legacy spellings, remain stable. Root and subsystem TODOs continue to define delivery and acceptance order.

## Ownership and lifetime

- Backend HTTP routes adapt requests to business operations. Evidence creation and signal read projections live in the evidence domain; services and domains must not import API modules. The import-linter contracts are configured in `backend/pyproject.toml`.
- Each backend process owns its database engine and session factory; each request or unit of work gets its own `AsyncSession`. The API waits for its embedded worker to stop before disposal, and the standalone worker disposes its engine when it stops. The local object store retains its content-addressed, atomic-write behavior.
- The frontend provider owns its React Query client. Feature views own their page composition and query keys; search builds an index from its own query results instead of storing mutable search data in module globals.
- A capture-client application runtime owns an API client, browser session and public-download client for a configuration snapshot. Each batch owns its queue. API and public-download clients have separate trust and credential boundaries. Active work must stop before runtime replacement or disposal.
- A workbook import can prepare pending demand drafts but does not confirm reviews, publish functions, or create downstream landing points. The original workbook snapshot is retained. Historical candidates can be listed with `python -m app.services.panorama_review_report`; a marker is not proof of provenance, and operators must review decisions rather than automatically rewrite them.

## Remaining work

Backend signal and research-chain mutations still need a single application command boundary across all entry points, including consistent actor, audit, revision and transaction handling. Model gateway transports and providers still require an explicit reusable lifetime. Frontend evidence and topics, editor draft construction, mutation refresh policy and remaining workspace responsibilities need further separation. Client construction-boundary checks, Windows runtime validation, and Linux service/recovery validation remain open. Refer to BE-01/03/06/07/17, FE-01/13, CC-02/07 and OPS-04/06 for acceptance.
