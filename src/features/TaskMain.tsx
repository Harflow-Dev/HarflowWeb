import {
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react'
import { TaskPage } from '../components'
import { TaskLoadingPage } from '../components/skeleton'
import { TaskChangesHost } from './TaskChangesHost'
import { TaskMainTopbar } from './TaskMainTopbar'
import { usePaneLayoutMode } from './usePaneLayoutMode'
import { useTaskPaneOverlay } from './useTaskPaneOverlay'
import type {
  SidebarData,
  TaskChangesEntryRef,
  TaskId,
} from '../model'
import {
  type TaskDialogOpener,
  type TaskScreenState,
} from '../presentation'
import type { EventsFactsRevealId } from '../presentation/taskTopbarChips'
import { focusDialogOpener } from './taskOverflowActions'

type Props = {
  readonly state: TaskScreenState
  readonly sidebar: SidebarData | null
  readonly mainRef: RefObject<HTMLElement | null>
  readonly onUnavailable: (label: string) => void
  readonly onAnnounce: (message: string) => void
  readonly onToggleChangesPane: (open: boolean) => void
  readonly onSelectChangedEntry: (entry: TaskChangesEntryRef) => void
  readonly onSelectChangesTurn: (taskId: TaskId) => void
  readonly onToggleChangesRepo: (root: string, expanded: boolean) => void
  readonly onSelectPaneTab: (tab: 'changes' | 'events') => void
  readonly onRevealEventsFacts: (group: EventsFactsRevealId) => void
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
  mainRef,
  onUnavailable,
  onAnnounce,
  onToggleChangesPane,
  onSelectChangedEntry,
  onSelectChangesTurn,
  onToggleChangesRepo,
  onSelectPaneTab,
  onRevealEventsFacts,
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
  const showPane = state.changesPaneOpen
  const layoutMode = usePaneLayoutMode(mainRef)
  const overlay = showPane && layoutMode === 'overlay'
  const moreRef = useRef<HTMLButtonElement>(null)
  const paneToggleRef = useRef<HTMLButtonElement>(null)
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

  useEffect(() => {
    if (state.load.kind === 'loading') return
    if (focusTitleFor.current !== state.selectedTaskId) return
    focusTitleFor.current = null
    titleRef.current?.focus()
  }, [state.load.kind, state.selectedTaskId])

  useTaskPaneOverlay({
    overlay,
    showPane,
    eventsFactsReveal: state.eventsFactsReveal,
    paneToggleRef,
    onToggleChangesPane,
  })

  const topbar = (
    <TaskMainTopbar
      title={title}
      state={state}
      ready={ready}
      showPane={showPane}
      titleRef={titleRef}
      paneToggleRef={paneToggleRef}
      moreRef={moreRef}
      onToggleChangesPane={onToggleChangesPane}
      onRevealEventsFacts={onRevealEventsFacts}
      onToggleOverflowMenu={onToggleOverflowMenu}
      onCloseOverflowMenu={onCloseOverflowMenu}
      onOpenDialog={onOpenDialog}
      onOpenParentTask={onOpenParentTask}
      onAnnounce={onAnnounce}
      focusTitleFor={focusTitleFor}
    />
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
    return (
      <TaskLoadingPage
        knownTitle={knownTitle}
        paneOpen={showPane}
        onTogglePane={onToggleChangesPane}
      />
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
            {state.load.message}
          </p>
        </div>
      </div>
    )
  }

  const bodyClass = showPane
    ? `hd-m05-body hd-m05-body--${layoutMode}`
    : 'hd-m05-body hd-m05-body--nopane'
  const pane = showPane && !usesEvents ? (
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
  ) : null

  const pageProps = {
    observation: state.load.observation,
    commandChrome: state.commandChrome,
    onUnavailable,
    onStop: () => onOpenDialog('stop', 'composer-stop'),
    onBannerStop: () => onOpenDialog('stop', 'banner-stop'),
    composerStopRef,
    bannerStopRef,
  } as const

  return (
    <div className={bodyClass} style={bodyStyle}>
      <div
        className="hd-m05-column"
        style={columnStyle}
        {...(overlay ? { inert: true } : {})}
      >
        {usesEvents ? (
          <TaskPage
            {...pageProps}
            eventsPaneOpen={showPane}
            columnWrapper={withTopbar}
          />
        ) : (
          withTopbar(<TaskPage {...pageProps} />)
        )}
      </div>
      {pane}
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

const bodyStyle = {
  flex: '1 1 auto',
  minHeight: 0,
  minWidth: 0,
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
