import type { Appearance, NeedsYouBadge } from '../model'
import type { AppRoute } from '../presentation'
import { Icon } from './Icon'
import { NAV, isAppRoute } from './sidebarNavConfig'
import { ThemeToggle } from './ThemeToggle'

function needsYouVisible(
  badge: NeedsYouBadge,
): badge is Extract<NeedsYouBadge, { kind: 'count' | 'partial' }> {
  return badge.kind === 'count' || badge.kind === 'partial'
}

function needsYouRailName(badge: NeedsYouBadge): string {
  if (badge.kind === 'count') return `Needs you, ${badge.count} waiting`
  if (badge.kind === 'partial') {
    return `Needs you, ${badge.knownCount} known, coverage incomplete`
  }
  return 'Needs you'
}

function NeedsYouMarks({ badge }: { readonly badge: NeedsYouBadge }) {
  if (!needsYouVisible(badge)) return null
  const label = badge.kind === 'count' ? String(badge.count) : `${badge.knownCount}+`
  return (
    <>
      <span className="hd-dot" aria-hidden="true" />
      <span className="hd-nav-item__count">{label}</span>
      {badge.kind === 'partial' ? (
        <span className="hd-sr">coverage incomplete</span>
      ) : null}
    </>
  )
}

export function ExpandedNavItem({
  item,
  activeRoute,
  needsYou,
  onNavigate,
}: {
  item: (typeof NAV)[number]
  activeRoute: AppRoute
  needsYou: NeedsYouBadge
  onNavigate: (route: AppRoute) => void
}) {
  const active = isAppRoute(item.id) && item.id === activeRoute
  const body = (
    <>
      <Icon name={item.icon} />
      <span className="hd-nav-item__label">{item.label}</span>
      {item.id === 'needs-you' ? <NeedsYouMarks badge={needsYou} /> : null}
      {item.kbd ? <span className="hd-kbd">{item.kbd}</span> : null}
    </>
  )
  if (active) {
    return (
      <button
        type="button"
        className="hd-nav-item is-active"
        aria-current="page"
        onClick={() => onNavigate(item.id)}
      >
        {body}
      </button>
    )
  }
  if (!isAppRoute(item.id)) return null
  return (
    <button
      type="button"
      className="hd-nav-item"
      onClick={() => onNavigate(item.id)}
    >
      {body}
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
}: {
  appearance: Appearance
  activeRoute: AppRoute
  runningCount: number
  needsYou: NeedsYouBadge
  onCollapse: (collapsed: boolean) => void
  onAppearance: (appearance: Appearance) => void
  onNavigate: (route: AppRoute) => void
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
        if (!isAppRoute(item.id)) return null
        const route = item.id
        const active = route === activeRoute
        const name = item.id === 'needs-you' ? needsYouRailName(needsYou) : item.label
        return (
          <button
            key={item.id}
            type="button"
            className={active ? 'hd-rail-item is-active' : 'hd-rail-item'}
            aria-label={name}
            aria-current={active ? 'page' : undefined}
            title={name}
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
            {item.id === 'needs-you' && needsYouVisible(needsYou) ? (
              <span className="hd-dot" aria-hidden="true" />
            ) : null}
          </button>
        )
      })}
      <span className="hd-rail__spacer" />
      <ThemeToggle appearance={appearance} onChange={onAppearance} compact />
      <button
        type="button"
        className={
          activeRoute === 'settings' ? 'hd-rail-item is-active' : 'hd-rail-item'
        }
        aria-label="Settings"
        aria-current={activeRoute === 'settings' ? 'page' : undefined}
        title="Settings"
        onClick={() => onNavigate('settings')}
      >
        <Icon name="settings" />
      </button>
    </aside>
  )
}
