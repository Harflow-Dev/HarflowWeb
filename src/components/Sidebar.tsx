import type { Appearance, SidebarData } from '../model'
import { Glyph } from './Glyph'
import { Icon } from './Icon'
import { ThemeToggle } from './ThemeToggle'

type Props = {
  readonly collapsed: boolean
  readonly appearance: Appearance
  readonly sidebar: SidebarData | null
  readonly onCollapse: (collapsed: boolean) => void
  readonly onAppearance: (appearance: Appearance) => void
  readonly onUnavailable: (label: string) => void
}

const NAV = [
  { id: 'new-task', label: 'New task', icon: 'plus' as const, active: true, kbd: '⌘N' },
  { id: 'needs-you', label: 'Needs you', icon: 'hand' as const, active: false },
  { id: 'workflows', label: 'Workflows', icon: 'workflow' as const, active: false },
  { id: 'resources', label: 'Resources', icon: 'gauge' as const, active: false },
  { id: 'statistics', label: 'Statistics', icon: 'chart' as const, active: false },
]

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
  sidebar,
  onCollapse,
  onAppearance,
  onUnavailable,
}: Props) {
  const runningCount = sidebar?.running.length ?? 0
  const needsYou = sidebar?.needsYouCount ?? 0

  if (collapsed) {
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
          className="hd-rail-item is-active"
          aria-label="New task"
          title="New task"
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
        {NAV.filter((n) => n.id !== 'new-task' && n.id !== 'needs-you').map((item) => (
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
        {NAV.map((item) =>
          item.active ? (
            <button key={item.id} type="button" className="hd-nav-item is-active">
              <Icon name={item.icon} />
              <span className="hd-nav-item__label">{item.label}</span>
              {item.kbd ? <span className="hd-kbd">{item.kbd}</span> : null}
            </button>
          ) : (
            <button
              key={item.id}
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
          ),
        )}
      </nav>
      <section className="hd-section" aria-label="Running">
        <div className="hd-section__head">
          Running{' '}
          {runningCount > 0 ? (
            <span className="hd-section__count">{runningCount}</span>
          ) : null}
        </div>
        <div className="hd-section__list">
          {(sidebar?.running ?? []).map((row) => (
            <button
              key={row.id}
              type="button"
              className="hd-task-row"
              title="Unavailable in this slice"
              onClick={() => onUnavailable(row.title)}
            >
              <Glyph glyph={row.glyph} label={glyphLabel(row.glyph)} />
              <span className="hd-task-row__title">{row.title}</span>
              <span className="hd-task-row__meta">{row.meta}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="hd-section hd-section--fill" aria-label="Recent work">
        <div className="hd-section__head">Recent work</div>
        <div className="hd-section__list">
          {(sidebar?.recent ?? []).map((row) => (
            <button
              key={row.id}
              type="button"
              className="hd-task-row hd-task-row--done"
              title="Unavailable in this slice"
              onClick={() => onUnavailable(row.title)}
            >
              <Glyph glyph={row.glyph} label={glyphLabel(row.glyph)} />
              <span className="hd-task-row__title">{row.title}</span>
              <span className="hd-task-row__meta">{row.meta}</span>
            </button>
          ))}
          {sidebar?.coverageIncomplete ? (
            <div className="hd-sidebar__more" role="status">
              Incomplete coverage
            </div>
          ) : null}
        </div>
      </section>
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
