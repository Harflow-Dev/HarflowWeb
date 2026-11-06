import type { Appearance, NeedsYouBadge, SidebarData, TaskId } from '../model'
import type { AppRoute } from '../presentation'
import { Icon } from './Icon'
import { CollapsedRail, ExpandedNavItem, NAV } from './sidebarNav'
import { TaskSection } from './sidebarSections'
import { ThemeToggle } from './ThemeToggle'

type Props = {
  readonly collapsed: boolean
  readonly appearance: Appearance
  readonly activeRoute: AppRoute
  readonly activeTaskId: TaskId | null
  readonly sidebar: SidebarData | null
  readonly needsYou: NeedsYouBadge
  readonly onCollapse: (collapsed: boolean) => void
  readonly onAppearance: (appearance: Appearance) => void
  readonly onNavigate: (route: AppRoute) => void
  readonly onOpenTask: (taskId: TaskId) => void
  readonly onUnavailable: (label: string) => void
}

export function Sidebar({
  collapsed,
  appearance,
  activeRoute,
  activeTaskId,
  sidebar,
  needsYou,
  onCollapse,
  onAppearance,
  onNavigate,
  onOpenTask,
  onUnavailable,
}: Props) {
  const runningCount = sidebar?.running.length ?? 0
  const taskActiveId = activeRoute === 'task' ? activeTaskId : null

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
          />
        ))}
      </nav>
      <TaskSection
        label="Running"
        count={runningCount}
        rows={sidebar?.running ?? []}
        activeTaskId={taskActiveId}
        onOpenTask={onOpenTask}
        onUnavailable={onUnavailable}
      />
      <TaskSection
        label="Recent work"
        rows={sidebar?.recent ?? []}
        done
        coverageIncomplete={sidebar?.coverageIncomplete ?? false}
        fill
        activeTaskId={taskActiveId}
        onOpenTask={onOpenTask}
        onUnavailable={onUnavailable}
      />
      <div className="hd-sidebar__foot">
        <button
          type="button"
          className={
            activeRoute === 'settings'
              ? 'hd-nav-item is-active'
              : 'hd-nav-item'
          }
          style={{ flex: 1 }}
          aria-current={activeRoute === 'settings' ? 'page' : undefined}
          onClick={() => onNavigate('settings')}
        >
          <Icon name="settings" />
          <span className="hd-nav-item__label">Settings</span>
        </button>
        <ThemeToggle appearance={appearance} onChange={onAppearance} />
      </div>
    </aside>
  )
}
