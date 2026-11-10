const viewPattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/

/** Map a URL view segment or query to a workspace view id (defaults to overview). */
export function resolveInitialView(view: string | undefined | null): string {
  const raw = (view ?? '').trim()
  return viewPattern.test(raw) ? raw : 'overview'
}
