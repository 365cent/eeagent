/**
 * Matches the dashboard shell dimensions so route loading does not jump to a centered spinner.
 */
export function AppRouteSkeleton() {
  return (
    <div className="app-shell light-mode app-route-skeleton" aria-busy="true" aria-label="正在加载工作台">
      <aside className="app-route-skeleton-sider" />
      <div className="app-route-skeleton-main">
        <header className="app-route-skeleton-topbar" />
        <div className="app-route-skeleton-content">
          <div className="skeleton-block skeleton-title" />
          <div className="skeleton-block skeleton-line short" />
          <div className="skeleton-metrics-row">
            <div className="skeleton-block skeleton-metric-tile" />
            <div className="skeleton-block skeleton-metric-tile" />
            <div className="skeleton-block skeleton-metric-tile" />
            <div className="skeleton-block skeleton-metric-tile" />
          </div>
          <div className="skeleton-block skeleton-panel" />
        </div>
      </div>
    </div>
  )
}
