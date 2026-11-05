import type { Appearance, SidebarData } from '../model'
import type { AppRoute } from '../presentation'
import { Glyph } from './Glyph'
import { Icon, type IconName } from './Icon'
import { ThemeToggle } from './ThemeToggle'

type Props = {
  readonly collapsed: boolean
  readonly appearance: Appearance
  readonly activeRoute: AppRoute
  readonly sidebar: SidebarData | null
  readonly onCollapse: (collapsed: boolean) => void
  readonly onAppearance: (appearance: Appearance) => void
  readonly onNavigate: (route: AppRoute) => void
  readonly onUnavailable: (label: string) => void
}

type NavId = AppRoute | 'needs-you' | 'resources' | 'statistics'

const NAV: readonly {
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

function isAppRoute(id: NavId): id is AppRoute {
  return id === 'new-task' || id === 'workflows'
}

function glyphLabel(glyph: SidebarData['running'][number]['glyph']): string {
  switch (glyph) {
    case 'running':
      return 'Running'
    case 'parallel':
      return 'Parallel group, running'
    case 'attention':
      return 'Needs you'
    case 'done':
      return 'Done'
    case 'failed':
      return 'Failed'
    case 'cancelled':
      return 'Cancelled'
    case 'workflow':
      return 'Workflow'
    default:
      return 'Task'
  }
}

export function Sidebar({
  collapsed,
  appearance,
  activeRoute,
  sidebar,
  onCollapse,
  onAppearance,
  onNavigate,
  onUnavailable,
}: Props) {
  const runningCount = sidebar?.running.length ?? 0
  const needsYou = sidebar?.needsYouCount ?? 0

  if (collapsed) {
    return (
      <CollapsedRail
        appearance={appearance}
        activeRoute={activeRoute}
        runningCount={runningCount}
        needsYou={needsYou}
        onCollapse={onCollapse}
        onAppearance={onAppearance}
        onNavigate={onNavigate}
        onUnavailable={onUnavailable}
      />
    )
  }

  return (
    <aside className="hd-sidebar" aria-label="Sidebar">
      <div className="hd-sidebar__top">
        <span className="hd-brand">
          <span className="hd-brand__mark" aria-hidden="true" />
          Harflow
        </span>
        <button
          type="button"
          className="hd-btn hd-btn--icon hd-btn--sm"
          aria-label="Collapse sidebar"
          onClick={() => onCollapse(true)}
        >
          <Icon name="sidebar" />
        </button>
      </div>
      <nav className="hd-nav" aria-label="Main">
        {NAV.map((item) => (
          <ExpandedNavItem
            key={item.id}
            item={item}
            activeRoute={activeRoute}
            needsYou={needsYou}
            onNavigate={onNavigate}
            onUnavailable={onUnavailable}
          />
        ))}
      </nav>
      <TaskSection
        label="Running"
        count={runningCount}
        rows={sidebar?.running ?? []}
        onUnavailable={onUnavailable}
      />
      <TaskSection
        label="Recent work"
        rows={sidebar?.recent ?? []}
        done
        coverageIncomplete={sidebar?.coverageIncomplete ?? false}
        fill
        onUnavailable={onUnavailable}
      />
      <div className="hd-sidebar__foot">
        <button
          type="button"
          className="hd-nav-item"
          style={{ flex: 1 }}
          aria-label="Settings (unavailable in this slice)"
          title="Settings — unavailable in this slice"
          onClick={() => onUnavailable('Settings')}
        >
          <Icon name="settings" />
          <span className="hd-nav-item__label" aria-hidden="true">
            Settings
          </span>
        </button>
        <ThemeToggle appearance={appearance} onChange={onAppearance} />
      </div>
    </aside>
  )
}

function ExpandedNavItem({
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

function CollapsedRail({
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
      <button
        type="button"
        className={
          activeRoute === 'new-task' ? 'hd-rail-item is-active' : 'hd-rail-item'
        }
        aria-label="New task"
        aria-current={activeRoute === 'new-task' ? 'page' : undefined}
        title="New task"
        onClick={() => onNavigate('new-task')}
      >
        <Icon name="plus" />
        {runningCount > 0 ? (
          <span className="hd-rail-item__badge" aria-label={`${runningCount} running`}>
            {runningCount}
          </span>
        ) : null}
      </button>
      <button
        type="button"
        className="hd-rail-item"
        aria-label="Needs you (unavailable in this slice)"
        title="Needs you — unavailable in this slice"
        onClick={() => onUnavailable('Needs you')}
      >
        <Icon name="hand" />
        {needsYou > 0 ? <span className="hd-dot" aria-hidden="true" /> : null}
      </button>
      <button
        type="button"
        className={
          activeRoute === 'workflows' ? 'hd-rail-item is-active' : 'hd-rail-item'
        }
        aria-label="Workflows"
        aria-current={activeRoute === 'workflows' ? 'page' : undefined}
        title="Workflows"
        onClick={() => onNavigate('workflows')}
      >
        <Icon name="workflow" />
      </button>
      {NAV.filter((n) => n.id === 'resources' || n.id === 'statistics').map((item) => (
        <button
          key={item.id}
          type="button"
          className="hd-rail-item"
          aria-label={`${item.label} (unavailable in this slice)`}
          title={`${item.label} — unavailable in this slice`}
          onClick={() => onUnavailable(item.label)}
        >
          <Icon name={item.icon} />
        </button>
      ))}
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

function TaskSection({
  label,
  count,
  rows,
  done = false,
  fill = false,
  coverageIncomplete = false,
  onUnavailable,
}: {
  label: string
  count?: number
  rows: SidebarData['running']
  done?: boolean
  fill?: boolean
  coverageIncomplete?: boolean
  onUnavailable: (label: string) => void
}) {
  return (
    <section
      className={fill ? 'hd-section hd-section--fill' : 'hd-section'}
      aria-label={label}
    >
      <div className="hd-section__head">
        {label}{' '}
        {count !== undefined && count > 0 ? (
          <span className="hd-section__count">{count}</span>
        ) : null}
      </div>
      <div className="hd-section__list">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            className={done ? 'hd-task-row hd-task-row--done' : 'hd-task-row'}
            title="Unavailable in this slice"
            onClick={() => onUnavailable(row.title)}
          >
            <Glyph glyph={row.glyph} label={glyphLabel(row.glyph)} />
            <span className="hd-task-row__title">{row.title}</span>
            <span className="hd-task-row__meta">{row.meta}</span>
          </button>
        ))}
        {coverageIncomplete ? (
          <div className="hd-sidebar__more" role="status">
            Incomplete coverage
          </div>
        ) : null}
      </div>
    </section>
  )
}
