import type {
  TaskChangesEntryRef,
  TaskChangesLoad,
  TaskChangesObservation,
  TaskChangesTextObservation,
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
