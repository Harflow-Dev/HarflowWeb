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

/**
 * One listing row. `path` is UTF-8; when the engine cannot give valid UTF-8 it
 * sends `pathBytesB64` instead and `path` is null. `oldPath` is always null
 * today (renames are off).
 */
export type TaskChangesRow = {
  readonly path: string | null
  readonly pathBytesB64: string | null
  readonly pathTruncated: boolean
  readonly oldPath: string | null
  readonly status: TaskChangesRowStatus
  readonly additions: number | null
  readonly deletions: number | null
  readonly binary: boolean
  readonly content: TaskChangesContent
}

/** One advisory conflict name from the agent's index (`path` or `path_bytes_b64`). */
export type TaskChangesReportedConflict = {
  readonly path: string | null
  readonly pathBytesB64: string | null
}

export type TaskChangesReportedConflicts = {
  readonly names: readonly TaskChangesReportedConflict[]
  readonly truncated: boolean
}

type TaskChangesScopeFacts = {
  readonly state: TaskChangesRepoState
  readonly reason: string | null
  /** ISO-8601 instant this scope was observed. */
  readonly observedAt: string
  readonly rowCount: number
  readonly rowsTruncated: boolean
  readonly rows: readonly TaskChangesRow[]
}

export type TaskChangesCommittedScope = TaskChangesScopeFacts

/**
 * Only the working-tree scope examines the agent's index, so the conflict
 * facts and the counts-versus-patch note exist on it alone.
 */
export type TaskChangesWorkingTreeScope = TaskChangesScopeFacts & {
  readonly unmergedUnknown: boolean
  readonly reportedConflicts: TaskChangesReportedConflicts
  readonly countsAndPatchSeparate: boolean
}

export type TaskChangesScope =
  | TaskChangesCommittedScope
  | TaskChangesWorkingTreeScope

export type TaskChangesBaselineDirty = boolean | 'unknown'

export type TaskChangesRepository = {
  readonly repositoryRoot: string
  readonly state: TaskChangesRepoState
  readonly reason: string | null
  readonly attribution: string
  readonly baseCommit: string | null
  readonly baseProvenance: string | null
  readonly headCommit: string | null
  readonly worktree: string | null
  readonly gitCommonDir: string | null
  /** ISO-8601 instant the repository was observed. */
  readonly observedAt: string | null
  /** True when the engine cut one of the string fields above. */
  readonly fieldsTruncated: boolean
  readonly baselineDirty: TaskChangesBaselineDirty
  readonly scopes: {
    readonly committed_range: TaskChangesCommittedScope | null
    readonly working_tree: TaskChangesWorkingTreeScope | null
  }
}

export type TaskChangesCapture = {
  readonly state: TaskChangesCaptureState
  readonly reason: string | null
}

/**
 * Stable selection identity within a list document: the path is UTF-8 text or
 * its raw bytes (`pathBytesB64`), exactly one of which is set.
 */
export type TaskChangesEntryRef = {
  readonly repositoryRoot: string
  readonly scope: TaskChangesScopeId
  readonly path: string | null
  readonly pathBytesB64: string | null
}

export function taskChangesEntryKey(entry: TaskChangesEntryRef | null): string {
  if (entry === null) return ''
  return `${entry.repositoryRoot}\0${entry.scope}\0${entry.path ?? ''}\0${entry.pathBytesB64 ?? ''}`
}

export function taskChangesEntriesEqual(
  a: TaskChangesEntryRef | null,
  b: TaskChangesEntryRef | null,
): boolean {
  return taskChangesEntryKey(a) === taskChangesEntryKey(b)
}

/** Entry identity for a listing row. */
export function taskChangesRowEntry(
  repositoryRoot: string,
  scope: TaskChangesScopeId,
  row: Pick<TaskChangesRow, 'path' | 'pathBytesB64'>,
): TaskChangesEntryRef {
  return {
    repositoryRoot,
    scope,
    path: row.path,
    pathBytesB64: row.pathBytesB64,
  }
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
  readonly binary: boolean
  readonly content: TaskChangesContent
  /** ISO-8601 instant of the stored capture this chunk reads. */
  readonly observedAt: string
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

/** One `task-changes.v1` list page plus the text of the entry being read. */
export type TaskChangesObservation = {
  readonly taskId: TaskId
  readonly capture: TaskChangesCapture
  /** ISO-8601 instant of the stored capture document. */
  readonly observedAt: string
  readonly repositories: readonly TaskChangesRepository[]
  readonly hasMore: boolean
  readonly nextCursor: string | null
  /** Text of the entry named by the query; null when none was asked for. */
  readonly text: TaskChangesTextObservation | null
}

export type TaskChangesLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable'; readonly message: string }
  | { readonly kind: 'ready'; readonly observation: TaskChangesObservation }

/** Query key for a changes observation — task, optional entry, optional turn. */
export type TaskChangesQuery = {
  readonly taskId: TaskId
  /** Entry whose text to read; null reads the list only. */
  readonly selectedEntry: TaskChangesEntryRef | null
  /** Null reads the opened task; otherwise that turn member's capture. */
  readonly turnTaskId: TaskId | null
}
