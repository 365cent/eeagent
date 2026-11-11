# Repository agent instructions

Read this file before making changes. The project root is the implementation and release coordination point.

## Project scope and authority

- The root [TODO.md](TODO.md) defines the remaining order through Linux intranet production. Use the subsystem TODO for task acceptance criteria. Keep task IDs stable while work remains; report completed IDs with evidence.
- [docs/REQUIREMENTS-TRACEABILITY.md](docs/REQUIREMENTS-TRACEABILITY.md) maps requirements to source documents, WBS packages, implementation tasks and acceptance IDs. The original eFuse Word and decided business rules are authoritative for business behavior. Do not invent missing methodology-book text, real signal sources, customer rules, or the fifth technical domain.
- Preserve the actual stack in the code: FastAPI/PostgreSQL, Next.js/React/antd, and a Windows Go capture client using Edge/Chrome. Production target is Linux intranet. Keep existing local uncommitted work; inspect the scoped diff before editing and build on it.
- API behavior, review gates, audit records and permissions belong on the server. Never treat mock data, nonempty JSON, a disabled button, IP address, or a caller-supplied role as proof of a business decision or identity.

## Change boundaries

- Make focused, reversible changes within the assigned subsystem. Do not reformat or regenerate unrelated files. Preserve public route spellings and legacy aliases, including `singal`.
- Backend schema changes must be additive Alembic revisions; do not rewrite published migrations. Keep production startup separate from the Windows portable PostgreSQL development bootstrap.
- Frontend changes must follow [frontend/AGENTS.md](frontend/AGENTS.md) and its Ant Design skill. Read the installed Next.js documentation before using a framework API. Keep existing route URLs and theme tokens.
- The Go client is the Windows user-side collector; do not add browser or public-web collection to the intranet server.
- Never commit secrets, real credentials, private source documents, or unlicensed third-party assets. Don't make external infrastructure or account changes.

## Development and validation

- The development machine is macOS. Use the project-specific Python, Node/pnpm and Go versions/lockfiles; do not claim a macOS check covers Linux service behavior or Windows GUI/browser behavior.
- Follow the root [README.md](README.md) for local setup on Windows, macOS, and Linux. Backend tests require an isolated local PostgreSQL service and use the dedicated `eea_test` database; verify the configured test connection before running anything destructive.
- Frontend changes follow the repository's `pnpm build` and `pnpm antd:lint` checks. The Go Windows UI cannot be built or browser-tested as a macOS deliverable; use portable Go unit checks on Mac and a Windows runner for the actual client.
- For a task, report which checks actually ran, their results, and any environment limitation. Do not describe a planned command or skipped platform check as passed.
- Keep source documents unchanged. Update plans and traceability when scope or acceptance changes; completed items leave the remaining-work TODO and retain evidence in the delivery record.
