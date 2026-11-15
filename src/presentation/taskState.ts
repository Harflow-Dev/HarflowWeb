import type {
  TaskChangesEntryRef,
  TaskChangesLoad,
  TaskChangesObservation,
  TaskChangesTextObservation,
  TaskEventsLoad,
  TaskEventsObservation,
  TaskEventsRecord,
  TaskId,
  TaskLoad,
} from '../model'
import type { TaskCommandChrome } from './taskStatusTypes'

export type { TaskCommandChrome } from './taskStatusTypes'

/** Which confirmation dialog is open (presentation chrome only). */
export type TaskDialogKind = 'stop' | 'takeover'

/** Control that opened the dialog; used to restore focus on close. */
export type TaskDialogOpener = 'more' | 'composer-stop' | 'banner-stop'

/** One turn of a continuation chain; each turn is its own supervised task. */
export type TaskChangesTurnMember = {
  readonly taskId: TaskId
  readonly turnIndex: number
  readonly turnCount: number
  readonly current: boolean
}

/** One panel of the seeded stacked text-mode specimen (chrome, not observation). */
export type TaskChangesTextPanel =
  | { readonly kind: 'loading'; readonly entry: TaskChangesEntryRef }
  | { readonly kind: 'chunk'; readonly text: TaskChangesTextObservation }
  | { readonly kind: 'refusal'; readonly entry: TaskChangesEntryRef }

export type TaskScreenState = {
  readonly selectedTaskId: TaskId | null
  readonly load: TaskLoad
  /**
   * Presentation-only command lifecycle (Stop acknowledged, Continue launch).
   * Cleared whenever task observation identity resets.
   */
  readonly commandChrome: TaskCommandChrome
  /** Overflow More-actions menu open (presentation chrome). */
  readonly overflowMenuOpen: boolean
  /**
   * Screen identity, seeded by composition: the approved transcript routes
   * draw no More anchor. Not an engine observation.
   */
  readonly overflowAnchorOmitted: boolean
  /** Stop or takeover confirmation dialog (presentation chrome). */
  readonly dialog: TaskDialogKind | null
  /** Which control opened the dialog; null when seeded without a trigger. */
  readonly dialogOpener: TaskDialogOpener | null
  /** Right pane open (the Changes pane; Events content is a later slice). */
  readonly changesPaneOpen: boolean
  /**
   * Entry used for the active changes observation query.
   * Null means the fixture default — distinct from resolved display selection.
   */
  readonly changesQueryEntry: TaskChangesEntryRef | null
  /** Resolved display selection (from last ready observation or explicit pick). */
  readonly selectedChangeEntry: TaskChangesEntryRef | null
  /**
   * Last known list document so rows stay mounted while a new text loads.
   * Cleared on pane close / task switch — never reused across identities.
   */
  readonly changesList: TaskChangesObservation | null
  readonly changesLoad: TaskChangesLoad
  /** Turn member whose capture is being read; null = opened task. */
  readonly changesTurnTaskId: TaskId | null
  /** Expanded repository roots (presentation chrome). */
  readonly expandedRepos: readonly string[]
  /** Turn lineage for the turn picker, seeded chrome; null draws no picker. */
  readonly changesTurns: readonly TaskChangesTurnMember[] | null
  /** Stacked text-mode specimen, seeded chrome; null draws the normal pane. */
  readonly changesTextPanels: readonly TaskChangesTextPanel[] | null
  /** Active pane tab; kept while the pane is closed within the same task. */
  readonly paneTab: 'changes' | 'events'
  /**
   * True once the tab is decided for this task: the pane was opened with the
   * task status known, or a tab was chosen explicitly (seed, click, chip).
   * Undecided: the first open lands on Events while the run is live and the
   * pane opened during load resolves when the status arrives.
   */
  readonly paneOpenedOnce: boolean
  /**
   * Facts group to expand when chips open Events; null keeps all collapsed.
   * Cleared when the pane closes.
   */
  readonly eventsFactsReveal: 'enforcement' | 'notices' | 'continuity' | null
  /**
   * Counts chip reveals for this task so a repeated click on the same chip
   * re-expands and refocuses a group the person collapsed.
   */
  readonly eventsFactsRevealSeq: number
  /**
   * Last known events document so records stay mounted while chrome updates.
   * Cleared on pane close / task switch — never reused across identities.
   */
  readonly eventsList: TaskEventsObservation | null
  readonly eventsLoad: TaskEventsLoad
  /** Older-page reads for the current Events observation. */
  readonly eventsEarlier: EventsEarlierState
}

/**
 * Older records read so far (ascending, shown above the newest page) and the
 * position the next read continues from. `error` keeps the records read.
 */
export type EventsEarlierState = {
  readonly status: 'idle' | 'loading' | 'loaded' | 'error'
  /**
   * Why the last read failed. `transient`: the read did not answer, the same
   * cursor can be read again. `cursor`: the engine refused the cursor
   * (expired or invalid); the contract says reload from the newest page, so
   * the same cursor is never offered again. Null unless `status` is `error`.
   */
  readonly failure: 'transient' | 'cursor' | null
  readonly records: readonly TaskEventsRecord[]
  /** Valid only once `status` is `loaded`. */
  readonly hasOlder: boolean
  readonly olderCursor: string | null
}

export const IDLE_EVENTS_EARLIER: EventsEarlierState = {
  status: 'idle',
  failure: null,
  records: [],
  hasOlder: false,
  olderCursor: null,
}

export function initialTaskState(): TaskScreenState {
  return {
    selectedTaskId: null,
    load: { kind: 'loading' },
    commandChrome: null,
    overflowMenuOpen: false,
    overflowAnchorOmitted: false,
    dialog: null,
    dialogOpener: null,
    changesPaneOpen: false,
    changesQueryEntry: null,
    selectedChangeEntry: null,
    changesList: null,
    changesLoad: { kind: 'loading' },
    changesTurnTaskId: null,
    expandedRepos: [],
    changesTurns: null,
    changesTextPanels: null,
    paneTab: 'changes',
    paneOpenedOnce: false,
    eventsFactsReveal: null,
    eventsFactsRevealSeq: 0,
    eventsList: null,
    eventsLoad: { kind: 'loading' },
    eventsEarlier: IDLE_EVENTS_EARLIER,
  }
}

/** Preview / session chrome for the overflow menu and confirmation dialogs. */
export type TaskOverflowChrome = {
  readonly overflowMenuOpen?: boolean
  readonly anchorOmitted?: boolean
  readonly dialog?: TaskDialogKind | null
  readonly dialogOpener?: TaskDialogOpener | null
}

/** Preview / session chrome for the Changes pane. */
export type TaskChangesChrome = {
  readonly selectedEntry?: TaskChangesEntryRef | null
  readonly turnTaskId?: TaskId | null
  readonly expandedRepos?: readonly string[]
  readonly turns?: readonly TaskChangesTurnMember[]
  readonly textPanels?: readonly TaskChangesTextPanel[]
}
