import type { TaskId } from './ids'

/**
 * Observed task-changes facts (`task-changes.v1` listing / text shapes).
 * Fixture evidence only — not Git, not authorship proof, not a live worktree.
 * Field names follow the ctl contract where it names them.
 */

export type TaskChangesCaptureState =
  | 'available'
  | 'incomplete'
  | 'unavailable'
  | 'pending'
  | 'not_captured'

export type TaskChangesRepoState =
  | 'available'
  | 'incomplete'
  | 'unavailable'
  | 'not_captured'

export type TaskChangesScopeId = 'committed_range' | 'working_tree'

export type TaskChangesRowStatus =
  | 'added'
  | 'modified'
  | 'deleted'
  | 'typechange'
  | 'unmerged'
  | 'submodule'
  | 'untracked'
  | 'unknown'

export type TaskChangesContentState =
  | 'available'
  | 'truncated'
  | 'binary'
  | 'omitted_size'
  | 'not_captured'

/** Row content block — contract `content {state, reason, bytes}`. */
export type TaskChangesContent = {
  readonly state: TaskChangesContentState
  readonly reason: string | null
  readonly bytes: number | null
}

export type TaskChangesRow = {
  readonly path: string
  readonly pathTruncated: boolean
  readonly status: TaskChangesRowStatus
  readonly additions: number | null
  readonly deletions: number | null
  readonly content: TaskChangesContent
}

export type TaskChangesReportedConflict = {
  readonly path: string
}

export type TaskChangesScope = {
  readonly state: TaskChangesRepoState
  readonly reason: string | null
  readonly rowCount: number
  readonly rowsTruncated: boolean
  readonly unmergedUnknown: boolean
  readonly reportedConflicts: readonly TaskChangesReportedConflict[]
  readonly countsAndPatchSeparate: boolean
  readonly rows: readonly TaskChangesRow[]
}

export type TaskChangesBaselineDirty = boolean | 'unknown'

export type TaskChangesRepository = {
  readonly repositoryRoot: string
  /** Display name derived for UI; root remains the identity. */
  readonly name: string
  readonly state: TaskChangesRepoState
  readonly reason: string | null
  readonly attribution: string
  readonly baseCommit: string | null
  readonly baseProvenance: string | null
  readonly headCommit: string | null
  readonly worktree: string | null
  readonly observedAtLabel: string | null
  readonly baselineDirty: TaskChangesBaselineDirty
  readonly scopes: {
    readonly committed_range: TaskChangesScope | null
    readonly working_tree: TaskChangesScope | null
  }
}

export type TaskChangesCapture = {
  readonly state: TaskChangesCaptureState
  readonly reason: string | null
}

/** Stable selection identity within a list document. */
export type TaskChangesEntryRef = {
  readonly repositoryRoot: string
  readonly scope: TaskChangesScopeId
  readonly path: string
}

export type DiffLineKind = 'context' | 'add' | 'del' | 'hunk'

/** Literal line text without a leading diff sign; sign comes from kind. */
export type DiffLine = {
  readonly kind: DiffLineKind
  readonly text: string
}

export type TaskChangesTextObservation = {
  readonly entry: TaskChangesEntryRef
  readonly status: TaskChangesRowStatus
  readonly additions: number | null
  readonly deletions: number | null
  readonly content: TaskChangesContent
  readonly offset: number
  readonly returnedBytes: number
  readonly totalBytes: number
  readonly hasMore: boolean
  readonly nextCursor: string | null
  readonly lines: readonly DiffLine[]
  /**
   * Text-mode refusal after a successful list (selector/cursor).
   * Contract: changes_entry_not_found / changes_cursor_expired.
   */
  readonly refusal:
    | null
    | {
        readonly code: 'changes_entry_not_found' | 'changes_cursor_expired'
        readonly message: string
        readonly reload: 'first' | null
      }
}

/** Turn picker members — each turn is its own supervised task. */
export type TaskChangesTurnMember = {
  readonly taskId: TaskId
  readonly turnIndex: number
  readonly turnCount: number
  readonly current: boolean
}

/**
 * Stacked text-mode panels for the changes-text specimen (loading + chunk +
 * refusal drawn together). Ordinary selection uses `text` alone.
 */
export type TaskChangesTextPanel =
  | {
      readonly kind: 'loading'
      readonly entry: TaskChangesEntryRef
      readonly scopeLabel: string
    }
  | {
      readonly kind: 'chunk'
      readonly text: TaskChangesTextObservation
      readonly scopeLabel: string
      readonly moreLabel: string
    }
  | {
      readonly kind: 'refusal'
      readonly entry: TaskChangesEntryRef
      readonly scopeLabel: string
    }

export type TaskChangesObservation = {
  readonly taskId: TaskId
  readonly capture: TaskChangesCapture
  readonly repositories: readonly TaskChangesRepository[]
  readonly hasMore: boolean
  readonly selectedEntry: TaskChangesEntryRef | null
  readonly text: TaskChangesTextObservation | null
  /** Present when the screen offers a turn picker. */
  readonly turns: readonly TaskChangesTurnMember[] | null
  /** Design changes-text specimen panels; null for ordinary reads. */
  readonly textPanels: readonly TaskChangesTextPanel[] | null
}

export type TaskChangesLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable'; readonly message: string }
  | { readonly kind: 'ready'; readonly observation: TaskChangesObservation }

/** Query key for a changes observation — task, optional entry, optional turn. */
export type TaskChangesQuery = {
  readonly taskId: TaskId
  /** Null selects the fixture default entry when the document has one. */
  readonly selectedEntry: TaskChangesEntryRef | null
  /** Null reads the opened task; otherwise that turn member's capture. */
  readonly turnTaskId: TaskId | null
}

/** @deprecated Alias kept for transitional call sites during the G-DIFF rewrite. */
export type ChangedFileRow = {
  readonly path: string
  readonly additions: number
  readonly deletions: number
}

/** @deprecated Prefer TaskChangesTextObservation.lines. */
export type DiffContent =
  | { readonly kind: 'lines'; readonly lines: readonly DiffLine[] }
  | { readonly kind: 'empty' }
  | { readonly kind: 'unavailable'; readonly message: string }
