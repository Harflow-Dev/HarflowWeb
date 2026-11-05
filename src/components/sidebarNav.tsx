import type { Appearance } from '../model'
import type { AppRoute } from '../presentation'
import { Icon, type IconName } from './Icon'
import { ThemeToggle } from './ThemeToggle'

export type NavId = AppRoute | 'needs-you'

export const NAV: readonly {
  id: NavId
  label: string
  icon: IconName
  kbd?: string
}[] = [
  { id: 'new-task', label: 'New task', icon: 'plus', kbd: '⌘N' },
  { id: 'needs-you', label: 'Needs you', icon: 'hand' },
  { id: 'workflows', label: 'Workflows', icon: 'workflow' },
  { id: 'resources', label: 'Resources', icon: 'gauge' },
  { id: 'statistics', label: 'Statistics', icon: 'chart' },
]

export function isAppRoute(id: NavId): id is AppRoute {
  return (
    id === 'new-task' ||
    id === 'workflows' ||
    id === 'resources' ||
    id === 'statistics'
  )
}

export function ExpandedNavItem({
  item,
  activeRoute,
  needsYou,
  onNavigate,
  onUnavailable,
}: {
  item: (typeof NAV)[number]
  activeRoute: AppRoute
  needsYou: number
  onNavigate: (route: AppRoute) => void
  onUnavailable: (label: string) => void
}) {
  const active = isAppRoute(item.id) && item.id === activeRoute
  if (active) {
    return (
      <button type="button" className="hd-nav-item is-active" aria-current="page">
        <Icon name={item.icon} />
        <span className="hd-nav-item__label">{item.label}</span>
        {item.kbd ? <span className="hd-kbd">{item.kbd}</span> : null}
      </button>
    )
  }
  if (isAppRoute(item.id)) {
    return (
      <button
        type="button"
        className="hd-nav-item"
        onClick={() => onNavigate(item.id as AppRoute)}
      >
        <Icon name={item.icon} />
        <span className="hd-nav-item__label">{item.label}</span>
        {item.kbd ? <span className="hd-kbd">{item.kbd}</span> : null}
      </button>
    )
  }
  return (
    <button
      type="button"
      className="hd-nav-item"
      aria-label={`${item.label} (unavailable in this slice)`}
      title={`${item.label} — unavailable in this slice`}
      onClick={() => onUnavailable(item.label)}
    >
      <Icon name={item.icon} />
      {item.id === 'needs-you' && needsYou > 0 ? (
        <span className="hd-dot" aria-hidden="true" />
      ) : null}
      <span className="hd-nav-item__label" aria-hidden="true">
        {item.label}
      </span>
      {item.id === 'needs-you' && needsYou > 0 ? (
        <span className="hd-nav-item__count" aria-hidden="true">
          {needsYou}
        </span>
      ) : null}
    </button>
  )
}

export function CollapsedRail({
  appearance,
  activeRoute,
  runningCount,
  needsYou,
  onCollapse,
  onAppearance,
  onNavigate,
  onUnavailable,
}: {
  appearance: Appearance
  activeRoute: AppRoute
  runningCount: number
  needsYou: number
  onCollapse: (collapsed: boolean) => void
  onAppearance: (appearance: Appearance) => void
  onNavigate: (route: AppRoute) => void
  onUnavailable: (label: string) => void
}) {
  return (
    <aside className="hd-rail" aria-label="Sidebar">
      <div className="hd-rail__top">
        <button
          type="button"
          className="hd-rail-item"
          aria-label="Expand sidebar"
          title="Expand sidebar"
          onClick={() => onCollapse(false)}
        >
          <span className="hd-brand__mark" aria-hidden="true" />
        </button>
      </div>
      {NAV.map((item) => {
        if (isAppRoute(item.id)) {
          const route = item.id
          const active = route === activeRoute
          return (
            <button
              key={item.id}
              type="button"
              className={active ? 'hd-rail-item is-active' : 'hd-rail-item'}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              title={item.label}
              onClick={() => onNavigate(route)}
            >
              <Icon name={item.icon} />
              {item.id === 'new-task' && runningCount > 0 ? (
                <span
                  className="hd-rail-item__badge"
                  aria-label={`${runningCount} running`}
                >
                  {runningCount}
                </span>
              ) : null}
            </button>
          )
        }
        return (
          <button
            key={item.id}
            type="button"
            className="hd-rail-item"
            aria-label={`${item.label} (unavailable in this slice)`}
            title={`${item.label} — unavailable in this slice`}
            onClick={() => onUnavailable(item.label)}
          >
            <Icon name={item.icon} />
            {item.id === 'needs-you' && needsYou > 0 ? (
              <span className="hd-dot" aria-hidden="true" />
            ) : null}
          </button>
        )
      })}
      <span className="hd-rail__spacer" />
      <ThemeToggle appearance={appearance} onChange={onAppearance} compact />
      <button
        type="button"
        className="hd-rail-item"
        aria-label="Settings (unavailable in this slice)"
        title="Settings — unavailable in this slice"
        onClick={() => onUnavailable('Settings')}
      >
        <Icon name="settings" />
      </button>
    </aside>
  )
}
