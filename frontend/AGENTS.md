# Frontend agent notes

- Stack: **antd 6** + **@ant-design/pro-components** (ProLayout). Shell: [`app/globals.css`](app/globals.css) (`@layer base` / `@layer components` + Tailwind `@apply` on **project** class names). Dashboard/view surfaces: [`app/dashboard.css`](app/dashboard.css) (imported by globals). Do not reintroduce `styles/shell.css`.
- Custom layout/styles: prefer `@apply` + `var(--eea-*)` on classes you own (`.platform-page-header`, `.metric-tile`, …). Do **not** add global `.ant-*` color/token overrides when ConfigProvider already matches — only keep ant selectors for ProLayout sider geometry or confirmed antd gaps.
- Before changing antd components: `pnpm exec antd info <Component> --format json`.
- After UI edits: `pnpm antd:lint` (or `pnpm exec antd lint <path> --format json`).
- Theming: native shell palette in [`app/shell-color-scheme.css`](app/shell-color-scheme.css) (`--eea-*`, `color-scheme`, `data-color-scheme`). Typed tokens: [`config/shell-surfaces.ts`](config/shell-surfaces.ts). Colleague guide: [`docs/SHELL-COLOR-SCHEME.md`](docs/SHELL-COLOR-SCHEME.md). Ant Design: [`config/platform-theme.ts`](config/platform-theme.ts). Avoid new global `.ant-*` selectors in CSS.
- New routes: [`config/routes.ts`](config/routes.ts) is the registry; keep URL paths backward compatible (`singal` typo retained).
- Views live under [`views/`](views/); shell must not import view internals except via the workspace router.

Full skill: [`node_modules/@ant-design/cli/skills/antd/SKILL.md`](node_modules/@ant-design/cli/skills/antd/SKILL.md) (installed with the locked frontend dependencies).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
