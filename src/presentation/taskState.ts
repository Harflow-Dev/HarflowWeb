import type {
  ChangedFileRow,
  TaskChangesLoad,
  TaskId,
  TaskLoad,
} from '../model'
import type { TaskCommandChrome } from './taskStatusTypes'

export type { TaskCommandChrome } from './taskStatusTypes'

export type TaskScreenState = {
  readonly selectedTaskId: TaskId | null
  readonly load: TaskLoad
  /**
   * Presentation-only command lifecycle (Stop acknowledged, Continue launch).
   * Cleared whenever task observation identity resets.
   */
  readonly commandChrome: TaskCommandChrome
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
    changesPaneOpen: false,
    changesQueryPath: null,
    selectedChangePath: null,
    changesFiles: null,
    changesLoad: { kind: 'loading' },
  }
}
