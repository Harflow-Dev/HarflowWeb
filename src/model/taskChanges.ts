import type { TaskId } from './ids'

/**
 * Recorded repository change observation for a task.
 * Fixture evidence only — not proof of agent authorship, patch validity,
 * or independently verified working-tree state. Independent of task success.
 */

export type DiffLineKind = 'context' | 'add' | 'del' | 'hunk'

/** Literal line text without a leading diff sign; sign comes from kind. */
export type DiffLine = {
  readonly kind: DiffLineKind
  readonly text: string
}

export type ChangedFileRow = {
  /** Stable identity within the task; equals the repository-relative path. */
  readonly path: string
  readonly additions: number
  readonly deletions: number
}

/**
 * Diff body for the selected file.
 * `empty` is a recorded observation of no lines — distinct from `unavailable`.
 */
export type DiffContent =
  | { readonly kind: 'lines'; readonly lines: readonly DiffLine[] }
  | { readonly kind: 'empty' }
  | { readonly kind: 'unavailable'; readonly message: string }

export type TaskChangesObservation = {
  readonly taskId: TaskId
  readonly selectedPath: string
  readonly files: readonly ChangedFileRow[]
  readonly diff: DiffContent
}

export type TaskChangesLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable'; readonly message: string }
  | { readonly kind: 'ready'; readonly observation: TaskChangesObservation }

/** Query key for a changes observation — task plus optional selected path. */
export type TaskChangesQuery = {
  readonly taskId: TaskId
  /** Null selects the fixture default (first file when present). */
  readonly selectedPath: string | null
}
