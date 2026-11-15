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
import { loadingPaneTab } from '../presentation/taskSessionPaneOpen'
import type { EventsFactsRevealId } from '../presentation/taskTopbarChips'
import { focusDialogOpener } from './taskOverflowActions'

type Props = {
  readonly state: TaskScreenState
  readonly sidebar: SidebarData | null
  /** The `.hd-main` element, measured for split versus overlay. */
  readonly mainElement: HTMLElement | null
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
 * Slim task chrome: one full-width bar, then a body holding the transcript
 * column and the pane (Design 40b8a19). Loading/unavailable never keep the
 * prior task's transcript under the newly selected identity. Opening the
 * pane must not remount the transcript column (scroll position preserved).
 * Only the column is inert while the overlay pane is open.
 */
export function TaskMain({
  state,
  sidebar,
  mainElement,
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
  const showPane = state.changesPaneOpen
  const layoutMode = usePaneLayoutMode(mainElement)
  const overlay = showPane && layoutMode === 'overlay'
  const moreRef = useRef<HTMLButtonElement>(null)
  const paneToggleRef = useRef<HTMLButtonElement>(null)
  const titleRef = useRef<HTMLSpanElement>(null)
  const focusTitleFor = useRef<TaskId | null>(null)
  const composerStopRef = useRef<HTMLButtonElement>(null)
  const bannerStopRef = useRef<HTMLButtonElement>(null)

  useDialogFocusReturn(state, moreRef, composerStopRef, bannerStopRef)

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
    eventsFactsRevealSeq: state.eventsFactsRevealSeq,
    taskId: state.selectedTaskId,
    // The facts group mounts once the Events body leaves its loading state.
    paneContent: `${state.paneTab}:${state.eventsLoad.kind}`,
    blocked: state.dialog !== null || state.overflowMenuOpen,
    paneToggleRef,
    onToggleChangesPane,
  })

  if (state.load.kind === 'loading') {
    return (
      <TaskLoadingPage
        knownTitle={knownTitle}
        paneOpen={showPane}
        paneMode={layoutMode}
        paneTab={loadingPaneTab(state, runningInListing(state, sidebar))}
        onTogglePane={onToggleChangesPane}
      />
    )
  }

  const topbar = (
    <TaskMainTopbar
      title={title}
      state={state}
      ready={ready}
      showPane={showPane}
      paneAvailable={ready !== null}
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
  if (state.load.kind !== 'ready') {
    return (
      <>
        {topbar}
        <div className="hd-m05-body hd-m05-body--nopane">
          <div className="hd-m05-column">
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
        </div>
      </>
    )
  }

  const bodyClass = showPane
    ? `hd-m05-body hd-m05-body--${layoutMode}`
    : 'hd-m05-body hd-m05-body--nopane'
  const changesPane =
    showPane && ready?.detailsPane !== 'events' ? (
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
  // The pane is a sibling of the column; only the column is inert in overlay.
  const shell = (column: ReactNode, eventsPane: ReactNode): ReactNode => (
    <div className={bodyClass}>
      <div className="hd-m05-column" {...(overlay ? { inert: true } : {})}>
        {column}
      </div>
      {eventsPane ?? changesPane}
    </div>
  )

  return (
    <>
      {topbar}
      <TaskPage
        observation={state.load.observation}
        commandChrome={state.commandChrome}
        eventsPaneOpen={showPane && ready?.detailsPane === 'events'}
        shell={shell}
        onClosePane={() => onToggleChangesPane(false)}
        onUnavailable={onUnavailable}
        onStop={() => onOpenDialog('stop', 'composer-stop')}
        onBannerStop={() => onOpenDialog('stop', 'banner-stop')}
        composerStopRef={composerStopRef}
        bannerStopRef={bannerStopRef}
      />
    </>
  )
}

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

/** Returns focus to the control that opened a task dialog once it closes. */
function useDialogFocusReturn(
  state: TaskScreenState,
  moreRef: RefObject<HTMLButtonElement | null>,
  composerStopRef: RefObject<HTMLButtonElement | null>,
  bannerStopRef: RefObject<HTMLButtonElement | null>,
): void {
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
  }, [state.dialog, state.dialogOpener, moreRef, composerStopRef, bannerStopRef])
}

/** The listing places this task under Running (see `loadingPaneTab`). */
function runningInListing(
  state: TaskScreenState,
  sidebar: SidebarData | null,
): boolean {
  return (
    sidebar?.running.some((row) => row.mappedTaskId === state.selectedTaskId) ??
    false
  )
}
