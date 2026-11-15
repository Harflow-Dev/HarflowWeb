import type { TaskId } from './ids'
import type {
  TaskChangesEntryRef,
  TaskChangesTextObservation,
} from './taskChanges'

/**
 * Specimen chrome for the Changes pane. These shapes are not `task-changes.v1`
 * observations: they describe how a preview scenario lays the pane out (the
 * turn lineage and the stacked text-mode specimen), composed from observed
 * facts. Display wording is derived in presentation.
 */

/** One turn of a continuation chain; each turn is its own supervised task. */
export type TaskChangesTurnMember = {
  readonly taskId: TaskId
  readonly turnIndex: number
  readonly turnCount: number
  readonly current: boolean
}

/** One panel of the stacked text-mode specimen. */
export type TaskChangesTextPanel =
  | { readonly kind: 'loading'; readonly entry: TaskChangesEntryRef }
  | { readonly kind: 'chunk'; readonly text: TaskChangesTextObservation }
  | { readonly kind: 'refusal'; readonly entry: TaskChangesEntryRef }
