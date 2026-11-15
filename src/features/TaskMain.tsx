import { useEffect, useRef, type ReactNode } from 'react'
import { Icon, TaskOverflowMenu, TaskPage } from '../components'
import { TaskLoadingPage } from '../components/skeleton'
import { TaskChangesHost } from './TaskChangesHost'
import type {
  SidebarData,
  TaskChangesEntryRef,
  TaskId,
} from '../model'
import {
  type TaskDialogOpener,
  type TaskScreenState,
  overflowMenuView,
  taskStatusView,
} from '../presentation'
import {
  focusDialogOpener,
  handleOverflowAction,
} from './taskOverflowActions'
import { TaskStatusBadge } from './TaskStatusBadge'

type Props = {
  readonly state: TaskScreenState
  readonly sidebar: SidebarData | null
  readonly onUnavailable: (label: string) => void
  readonly onAnnounce: (message: string) => void
  readonly onToggleChangesPane: (open: boolean) => void
  readonly onSelectChangedEntry: (entry: TaskChangesEntryRef) => void
  readonly onSelectChangesTurn: (taskId: TaskId) => void
  readonly onToggleChangesRepo: (root: string, expanded: boolean) => void
  readonly onSelectPaneTab: (tab: 'changes' | 'events') => void
  readonly onLoadEarlierEvents: () => void
  readonly onToggleOverflowMenu: () => void
  readonly onCloseOverflowMenu: () => void
  readonly onOpenDialog: (
    dialog: 'stop' | 'takeover',
    opener: TaskDialogOpener,
  ) => void
  readonly onOpenParentTask: (taskId: TaskId) => void
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
  onAnnounce,
  onToggleChangesPane,
  onSelectChangedEntry,
  onSelectChangesTurn,
  onToggleChangesRepo,
  onSelectPaneTab,
  onLoadEarlierEvents,
  onToggleOverflowMenu,
  onCloseOverflowMenu,
  onOpenDialog,
  onOpenParentTask,
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
  const overflowMenu =
    ready && !state.overflowAnchorOmitted
      ? overflowMenuView(ready, state.commandChrome)
      : null
  const moreRef = useRef<HTMLButtonElement>(null)
  const titleRef = useRef<HTMLSpanElement>(null)
  const focusTitleFor = useRef<TaskId | null>(null)
  const composerStopRef = useRef<HTMLButtonElement>(null)
  const bannerStopRef = useRef<HTMLButtonElement>(null)
  const wasDialog = useRef(false)
  const openerWhileOpen = useRef<TaskDialogOpener | null>(null)

  useEffect(() => {
    if (state.dialog !== null) {
      openerWhileOpen.current = state.dialogOpener
    }
    if (wasDialog.current && state.dialog === null) {
      const opener = openerWhileOpen.current
      queueMicrotask(() => {
        focusDialogOpener(opener, moreRef, composerStopRef, bannerStopRef)
      })
      openerWhileOpen.current = null
    }
    wasDialog.current = state.dialog !== null
  }, [state.dialog, state.dialogOpener])

  // After Open parent task, land on the parent's title once it has loaded.
  useEffect(() => {
    if (state.load.kind === 'loading') return
    if (focusTitleFor.current !== state.selectedTaskId) return
    focusTitleFor.current = null
    titleRef.current?.focus()
  }, [state.load.kind, state.selectedTaskId])

  const topbar = (
    <div className="hd-topbar">
      <span ref={titleRef} className="hd-topbar__title" tabIndex={-1}>
        {title}
      </span>
      {ready ? (
        <TaskStatusBadge
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
      {ready && overflowMenu ? (
        <TaskOverflowMenu
          menu={overflowMenu}
          open={state.overflowMenuOpen}
          moreRef={moreRef}
          onToggle={onToggleOverflowMenu}
          onClose={(focusTrigger) => {
            onCloseOverflowMenu()
            if (focusTrigger) moreRef.current?.focus()
          }}
          onAction={(id) =>
            handleOverflowAction(id, ready, {
              onOpenDialog,
              onOpenParentTask: (taskId) => {
                focusTitleFor.current = taskId
                onOpenParentTask(taskId)
              },
              onAnnounce,
            })
          }
        />
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
          onStop={() => onOpenDialog('stop', 'composer-stop')}
          onBannerStop={() => onOpenDialog('stop', 'banner-stop')}
          composerStopRef={composerStopRef}
          bannerStopRef={bannerStopRef}
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
          onStop={() => onOpenDialog('stop', 'composer-stop')}
          onBannerStop={() => onOpenDialog('stop', 'banner-stop')}
          composerStopRef={composerStopRef}
          bannerStopRef={bannerStopRef}
        />,
      )}
      {showPane && usesChanges ? (
        <TaskChangesHost
          state={state}
          onSelectEntry={onSelectChangedEntry}
          onSelectTurn={onSelectChangesTurn}
          onToggleRepo={onToggleChangesRepo}
          onClosePane={() => onToggleChangesPane(false)}
          onUnavailable={onUnavailable}
          onSelectTab={onSelectPaneTab}
          onLoadEarlier={onLoadEarlierEvents}
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
