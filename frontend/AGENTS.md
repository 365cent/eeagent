# Frontend agent notes

- Stack: **antd 6** + **@ant-design/pro-components** (ProLayout). Shell: [`app/globals.css`](app/globals.css) (`@layer components` + Tailwind). Dashboard/view surfaces: [`app/dashboard.css`](app/dashboard.css) (imported by globals). Do not reintroduce `styles/shell.css`.
- Before changing antd components: `pnpm exec antd info <Component> --format json`.
- After UI edits: `pnpm antd:lint` (or `pnpm exec antd lint <path> --format json`).
- Theming: [`config/platform-theme.ts`](config/platform-theme.ts) tokens first; avoid new global `.ant-*` selectors in CSS.
- New routes: [`config/routes.ts`](config/routes.ts) is the registry; keep URL paths backward compatible (`singal` typo retained).
- Views live under [`views/`](views/); shell must not import view internals except via the workspace router.

Full skill: [`.agents/skills/ant-design/SKILL.md`](../.agents/skills/ant-design/SKILL.md).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
