import type { ReactNode } from 'react'
import { Icon, TaskChangesPane, TaskPage } from '../components'
import type { SidebarData, TaskObservation } from '../model'
import type { TaskScreenState } from '../presentation'

type Props = {
  readonly state: TaskScreenState
  readonly sidebar: SidebarData | null
  readonly onUnavailable: (label: string) => void
  readonly onToggleChangesPane: (open: boolean) => void
  readonly onSelectChangedFile: (path: string) => void
}

/**
 * Slim task chrome. Loading/unavailable never keep the prior task's
 * transcript under the newly selected identity. Opening the right pane
 * must not remount the transcript column (scroll position preserved).
 */
export function TaskMain({
  state,
  sidebar,
  onUnavailable,
  onToggleChangesPane,
  onSelectChangedFile,
}: Props) {
  const title = resolveTitle(state, sidebar)
  const ready =
    state.load.kind === 'ready' ? state.load.observation : null
  const usesEvents =
    ready?.transcript !== null && ready?.transcript !== undefined
  const showPane = state.changesPaneOpen
  const showToggle =
    usesEvents || ready?.status === 'completed' || showPane

  const topbar = (
    <div className="hd-topbar">
      <span className="hd-topbar__title">{title}</span>
      {ready ? <StatusBadge observation={ready} /> : null}
      {ready ? (
        <span className="hd-topbar__meta">{ready.headerMeta}</span>
      ) : null}
      <span className="hd-topbar__spacer" />
      {showToggle ? (
        <button
          type="button"
          className="hd-btn hd-btn--icon hd-btn--sm"
          aria-label="Toggle right pane"
          aria-pressed={showPane}
          onClick={() => onToggleChangesPane(!showPane)}
        >
          <Icon name="panel-right" />
        </button>
      ) : null}
    </div>
  )

  function withTopbar(column: ReactNode): ReactNode {
    return (
      <div style={columnStyle}>
        {topbar}
        {column}
      </div>
    )
  }

  if (state.load.kind !== 'ready') {
    return (
      <div style={columnStyle}>
        {topbar}
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
      </div>
    )
  }

  if (usesEvents) {
    return (
      <div
        className={showPane ? 'hd-split' : undefined}
        style={showPane ? undefined : columnStyle}
      >
        <TaskPage
          observation={state.load.observation}
          eventsPaneOpen={showPane}
          columnWrapper={withTopbar}
          onUnavailable={onUnavailable}
        />
      </div>
    )
  }

  return (
    <div
      className={showPane ? 'hd-split' : undefined}
      style={showPane ? undefined : columnStyle}
    >
      {withTopbar(
        <TaskPage
          observation={state.load.observation}
          onUnavailable={onUnavailable}
        />,
      )}
      {showPane ? (
        <TaskChangesPane
          load={state.changesLoad}
          files={state.changesFiles}
          selectedPath={state.selectedChangePath}
          onSelectFile={onSelectChangedFile}
          onUnavailable={onUnavailable}
        />
      ) : null}
    </div>
  )
}

const columnStyle = {
  flex: '1 1 auto',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
} as const

function StatusBadge({
  observation,
}: {
  readonly observation: TaskObservation
}) {
  if (observation.status === 'failed') {
    return (
      <span className="hd-badge hd-badge--failed">
        <Icon name="x" />
        {observation.statusBadge}
      </span>
    )
  }
  if (observation.status === 'completed') {
    return (
      <span className="hd-badge hd-badge--done">
        <Icon name="check" />
        {observation.statusBadge}
      </span>
    )
  }
  return (
    <span className="hd-badge hd-badge--running">
      <span className="hd-badge__spin" aria-hidden="true" />
      {observation.statusBadge}
    </span>
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
