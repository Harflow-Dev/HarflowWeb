import type {
  ChangedFileRow,
  TaskChangesLoad,
  TaskId,
  TaskLoad,
} from '../model'
import type { TaskCommandChrome } from './taskStatusTypes'

export type { TaskCommandChrome } from './taskStatusTypes'

/** Which confirmation dialog is open (presentation chrome only). */
export type TaskDialogKind = 'stop' | 'takeover'

/** Control that opened the dialog; used to restore focus on close. */
export type TaskDialogOpener = 'more' | 'composer-stop' | 'banner-stop'

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
  /** Stop or takeover confirmation dialog (presentation chrome). */
  readonly dialog: TaskDialogKind | null
  /** Which control opened the dialog; null when seeded without a trigger. */
  readonly dialogOpener: TaskDialogOpener | null
  /** Right pane open — Changes only in this slice. */
  readonly changesPaneOpen: boolean
  /**
   * Path used for the active changes observation query.
   * Null means the fixture default — distinct from resolved display selection.
   */
  readonly changesQueryPath: string | null
  /** Resolved display selection (from last ready observation or explicit pick). */
  readonly selectedChangePath: string | null
  /**
   * Last known file rows so the list can stay mounted while a new diff loads.
   * Cleared on pane close / task switch — never reused across identities.
   */
  readonly changesFiles: readonly ChangedFileRow[] | null
  readonly changesLoad: TaskChangesLoad
}

export function initialTaskState(): TaskScreenState {
  return {
    selectedTaskId: null,
    load: { kind: 'loading' },
    commandChrome: null,
    overflowMenuOpen: false,
    dialog: null,
    dialogOpener: null,
    changesPaneOpen: false,
    changesQueryPath: null,
    selectedChangePath: null,
    changesFiles: null,
    changesLoad: { kind: 'loading' },
  }
}

/** Preview / session chrome for the overflow menu and confirmation dialogs. */
export type TaskOverflowChrome = {
  readonly overflowMenuOpen?: boolean
  readonly dialog?: TaskDialogKind | null
  readonly dialogOpener?: TaskDialogOpener | null
}
