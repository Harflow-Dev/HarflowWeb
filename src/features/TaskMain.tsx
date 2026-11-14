import type { ReactNode } from 'react'
import { Icon, TaskChangesPane, TaskPage } from '../components'
import { TaskLoadingPage } from '../components/skeleton'
import type { SidebarData, TaskObservation } from '../model'
import {
  type TaskCommandChrome,
  type TaskScreenState,
  type TaskStatusBadge,
  taskStatusView,
} from '../presentation'

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
  const knownTitle = resolveKnownTitle(state, sidebar)
  const title = knownTitle ?? 'Task'
  const ready =
    state.load.kind === 'ready' ? state.load.observation : null
  const usesEvents = ready?.detailsPane === 'events'
  const usesChanges = ready?.detailsPane === 'changes'
  const showPane = state.changesPaneOpen
  const showToggle = usesEvents || usesChanges || showPane
  const readyMeta = ready
    ? taskStatusView(ready, state.commandChrome).meta
    : null

  const topbar = (
    <div className="hd-topbar">
      <span className="hd-topbar__title">{title}</span>
      {ready ? (
        <StatusBadge
          observation={ready}
          commandChrome={state.commandChrome}
        />
      ) : null}
      {ready && readyMeta !== null ? (
        <span className="hd-topbar__meta">{readyMeta}</span>
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

  if (state.load.kind === 'loading') {
    return <TaskLoadingPage knownTitle={knownTitle} />
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
            {state.load.message}
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
          commandChrome={state.commandChrome}
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
          commandChrome={state.commandChrome}
          onUnavailable={onUnavailable}
        />,
      )}
      {showPane && usesChanges ? (
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

function badgeClassName(badge: TaskStatusBadge): string {
  if (badge.tone === 'neutral') {
    return 'hd-badge hd-m05-badge--neutral'
  }
  if (badge.tone === 'warning') {
    return 'hd-badge hd-badge--warning'
  }
  return `hd-badge hd-badge--${badge.tone}`
}

function StatusBadge({
  observation,
  commandChrome,
}: {
  readonly observation: TaskObservation
  readonly commandChrome: TaskCommandChrome
}) {
  const { badge } = taskStatusView(observation, commandChrome)
  return (
    <span className={badgeClassName(badge)}>
      <BadgeGlyph glyph={badge.glyph} />
      {badge.label}
    </span>
  )
}

function BadgeGlyph({
  glyph,
}: {
  readonly glyph: TaskStatusBadge['glyph']
}) {
  if (glyph === 'spin') {
    return <span className="hd-badge__spin" aria-hidden="true" />
  }
  if (glyph === 'queued') {
    return (
      <span className="hd-glyph hd-glyph--queued" aria-hidden="true" />
    )
  }
  if (glyph === 'none') return null
  return <Icon name={glyph} />
}

/** The ready title, else the mapped sidebar row title, else null. */
function resolveKnownTitle(
  state: TaskScreenState,
  sidebar: SidebarData | null,
): string | null {
  if (state.load.kind === 'ready') {
    return state.load.observation.title
  }
  if (!state.selectedTaskId || !sidebar) return null
  const rows = [...sidebar.running, ...sidebar.recent]
  const match = rows.find((row) => row.mappedTaskId === state.selectedTaskId)
  return match?.title ?? null
}