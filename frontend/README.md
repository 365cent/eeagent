# EEA 前瞻技术扫描平台 — Frontend

Next.js 16 + Ant Design 6 + Ant Design Pro Layout. UI is **antd-only** (no Tailwind/shadcn).

## Run

```bash
pnpm install
pnpm dev
```

Production check: `pnpm build`

## Add a page (5 steps)

1. Register the view key in [`config/routes.ts`](config/routes.ts) (`PRIMARY_VIEW_KEYS` or `UTILITY_VIEW_KEYS`).
2. Add menu metadata in [`config/menu.tsx`](config/menu.tsx) or [`config/utility-pages.tsx`](config/utility-pages.tsx).
3. Implement the screen under [`views/<name>/`](views/) (export from `index.ts`).
4. Wire the view in [`views/dashboard/workspace.tsx`](views/dashboard/workspace.tsx) (`activeMenu === '…'` branch).
5. Run `pnpm build` and `pnpm antd:lint` on touched paths.

## Layout

- Shell: [`components/layout/platform-layout.tsx`](components/layout/platform-layout.tsx) (ProLayout, dark sider menu).
- Theme tokens: [`config/platform-theme.ts`](config/platform-theme.ts).
- Providers: [`components/providers/app-providers.tsx`](components/providers/app-providers.tsx).

## Agent / UI changes

See [`AGENTS.md`](AGENTS.md) and [`.agents/skills/ant-design/SKILL.md`](../.agents/skills/ant-design/SKILL.md).
