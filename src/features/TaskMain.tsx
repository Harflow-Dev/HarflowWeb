import { TaskPage } from '../components'
import type { SidebarData } from '../model'
import type { TaskScreenState } from '../presentation'

type Props = {
  readonly state: TaskScreenState
  readonly sidebar: SidebarData | null
  readonly onUnavailable: (label: string) => void
}

/**
 * Slim running-task chrome. Loading/unavailable never keep the prior task's
 * transcript under the newly selected identity.
 */
export function TaskMain({ state, sidebar, onUnavailable }: Props) {
  const title = resolveTitle(state, sidebar)
  const ready =
    state.load.kind === 'ready' ? state.load.observation : null

  return (
    <div
      style={{
        flex: '1 1 auto',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <div className="hd-topbar">
        <span className="hd-topbar__title">{title}</span>
        {ready ? (
          <>
            <span className="hd-badge hd-badge--running">
              <span className="hd-badge__spin" aria-hidden="true" />
              {ready.runningBadge}
            </span>
            <span className="hd-topbar__meta">{ready.headerMeta}</span>
          </>
        ) : null}
        <span className="hd-topbar__spacer" />
      </div>
      <TaskBody state={state} onUnavailable={onUnavailable} />
    </div>
  )
}

function TaskBody({
  state,
  onUnavailable,
}: {
  readonly state: TaskScreenState
  readonly onUnavailable: (label: string) => void
}) {
  if (state.load.kind === 'ready') {
    return (
      <TaskPage
        observation={state.load.observation}
        onUnavailable={onUnavailable}
      />
    )
  }
  return (
    <div className="hd-scroll">
      <p
        className="caption hd-faint"
        role="status"
        style={{ padding: 'var(--space-5) var(--space-6)' }}
      >
        {state.load.kind === 'loading'
          ? 'Loading task… (proposal — not a design-approved specimen)'
          : state.load.message}
      </p>
    </div>
  )
}

function resolveTitle(
  state: TaskScreenState,
  sidebar: SidebarData | null,
): string {
  if (state.load.kind === 'ready') {
    return state.load.observation.title
  }
  if (!state.selectedTaskId || !sidebar) {
    return 'Task'
  }
  const rows = [...sidebar.running, ...sidebar.recent]
  const match = rows.find((row) => row.mappedTaskId === state.selectedTaskId)
  return match?.title ?? 'Task'
}
