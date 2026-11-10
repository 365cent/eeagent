# Shell color scheme

The dashboard shell uses the **native CSS color scheme** model so light/dark behavior is predictable for design and engineering.

## Concepts

| Layer | Role |
| --- | --- |
| [`config/shell-surfaces.ts`](../config/shell-surfaces.ts) | Typed hex tokens for Ant Design and any TS logic |
| [`app/shell-color-scheme.css`](../app/shell-color-scheme.css) | `--eea-*` CSS variables, `color-scheme`, `prefers-color-scheme` |
| [`lib/shell-color-scheme.ts`](../lib/shell-color-scheme.ts) | Preference storage, resolve light/dark, sync `<html>` |
| [`hooks/use-shell-color-scheme.ts`](../hooks/use-shell-color-scheme.ts) | React hook for the workspace shell |
| [`config/platform-theme.ts`](../config/platform-theme.ts) | Ant Design algorithm + `colorBgLayout` from `shellSurfaces` |

**Preference** (`light` \| `dark` \| `system`) is stored in `localStorage` under `eea-color-scheme`. The header toggle switches **explicit** light ↔ dark (not system), which is easiest to regression-test.

**Resolved scheme** is always `light` or `dark`: used for `data-color-scheme` on `.app-shell`, legacy `.light-mode` / `.dark-mode` classes, and Ant Design `defaultAlgorithm` / `darkAlgorithm`.

## Styling new UI

1. Prefer semantic variables on `.app-shell` (they inherit into the main column):

   ```css
   .my-panel {
     background: var(--eea-surface-elevated);
     color: var(--eea-text-primary);
     border: 1px solid var(--eea-border-subtle);
   }
   ```

2. Style **project classes** in `globals.css` with Tailwind `@apply` and `var(--eea-*)`; avoid duplicating Ant Design typography, inputs, tables, or cards unless you have a verified gap.

3. Avoid new hard-coded `#fff` / `#0a0a0a` pairs unless Ant Design tokens cannot cover the case.

4. If you must branch in CSS, scope under `.app-shell[data-color-scheme='dark']` instead of inventing a third class name.

5. When changing palette values, update **`shell-surfaces.ts` and `shell-color-scheme.css` together**.

## Ant Design

Component colors come from `ConfigProvider` inside the main column (not the ProLayout sider). Do not add a second root `ConfigProvider` above `ProLayout` with the same `cssVar` key — the dark sider theme would overwrite main-surface variables.

## System preference

With preference `system`, appearance follows `prefers-color-scheme` until the user uses the toolbar toggle (which sets explicit `light` or `dark`).
