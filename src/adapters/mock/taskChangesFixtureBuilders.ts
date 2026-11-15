import type {
  TaskChangesCommittedScope,
  TaskChangesContent,
  TaskChangesEntryRef,
  TaskChangesObservation,
  TaskChangesReportedConflict,
  TaskChangesRepository,
  TaskChangesRow,
  TaskChangesRowStatus,
  TaskChangesScopeId,
  TaskChangesWorkingTreeScope,
  TaskId,
} from '../../model'

/** Verbatim engine attribution — duplicated from presentation for the mock layer. */
export const DEFAULT_ATTRIBUTION =
  'Observed repository differences; not evidence of task authorship.'

/**
 * Observation instant of every fixture: today at 10:42 local time, so the
 * pane's "Today 10:42" provenance line holds whenever the mock runs.
 */
function todayAt(hours: number, minutes: number): string {
  const at = new Date()
  at.setHours(hours, minutes, 0, 0)
  return at.toISOString()
}

export const OBSERVED_AT = todayAt(10, 42)

export const QUEUE_PY_PATH = 'harflow_web/delivery/queue.py'
export const CONFIG_PY_PATH = 'harflow_web/config.py'
export const TEST_QUEUE_PATH = 'tests/test_delivery_queue.py'
export const HARFLOW_WEB_ROOT = '~/Code/Harflow/HarflowWeb'
export const HARFLOW_MCP_ROOT = '~/Code/Harflow/HarflowMCP'

export function entryOf(
  repositoryRoot: string,
  scope: TaskChangesScopeId,
  path: string,
): TaskChangesEntryRef {
  return { repositoryRoot, scope, path, pathBytesB64: null }
}

export const QUEUE_ENTRY = entryOf(
  HARFLOW_WEB_ROOT,
  'committed_range',
  QUEUE_PY_PATH,
)
export const CONFIG_ENTRY = entryOf(
  HARFLOW_WEB_ROOT,
  'committed_range',
  CONFIG_PY_PATH,
)
export const TEST_ENTRY = entryOf(
  HARFLOW_WEB_ROOT,
  'committed_range',
  TEST_QUEUE_PATH,
)
export const SAME_PATH_WORKING = entryOf(
  HARFLOW_WEB_ROOT,
  'working_tree',
  QUEUE_PY_PATH,
)
export const BIG_MODULE_ENTRY = entryOf(
  HARFLOW_MCP_ROOT,
  'committed_range',
  'src/big_module.py',
)

export function contentAvailable(bytes = 0): TaskChangesContent {
  return { state: 'available', reason: null, bytes }
}

export function contentState(
  state: TaskChangesContent['state'],
  reason: string | null,
  bytes: number | null = null,
): TaskChangesContent {
  return { state, reason, bytes }
}

/** Standard base64 of a byte string (each char code is one byte). */
export function bytesB64(raw: string): string {
  return btoa(raw)
}

export function row(args: {
  readonly path?: string
  readonly pathBytesB64?: string
  readonly status: TaskChangesRowStatus
  readonly additions?: number | null
  readonly deletions?: number | null
  readonly content?: TaskChangesContent
  readonly pathTruncated?: boolean
}): TaskChangesRow {
  const content = args.content ?? contentAvailable()
  return {
    path: args.path ?? null,
    pathBytesB64: args.pathBytesB64 ?? null,
    pathTruncated: args.pathTruncated ?? false,
    oldPath: null,
    status: args.status,
    additions: args.additions === undefined ? 0 : args.additions,
    deletions: args.deletions === undefined ? 0 : args.deletions,
    binary: content.state === 'binary',
    content,
  }
}

type ScopeArgs = {
  readonly state?: TaskChangesCommittedScope['state']
  readonly reason?: string | null
  readonly rows?: readonly TaskChangesRow[]
  readonly rowCount?: number
  readonly rowsTruncated?: boolean
}

export function committedScope(args: ScopeArgs = {}): TaskChangesCommittedScope {
  const rows = args.rows ?? []
  return {
    state: args.state ?? 'available',
    reason: args.reason ?? null,
    observedAt: OBSERVED_AT,
    rowCount: args.rowCount ?? rows.length,
    rowsTruncated: args.rowsTruncated ?? false,
    rows,
  }
}

export function workingScope(
  args: ScopeArgs & {
    readonly unmergedUnknown?: boolean
    readonly reportedConflicts?: readonly TaskChangesReportedConflict[]
    readonly countsAndPatchSeparate?: boolean
  } = {},
): TaskChangesWorkingTreeScope {
  return {
    ...committedScope(args),
    unmergedUnknown: args.unmergedUnknown ?? false,
    reportedConflicts: {
      names: args.reportedConflicts ?? [],
      truncated: false,
    },
    countsAndPatchSeparate: args.countsAndPatchSeparate ?? false,
  }
}

export function repoBase(args: {
  readonly repositoryRoot: string
  readonly worktree?: string | null
  readonly baselineDirty?: boolean | 'unknown'
  readonly state?: TaskChangesRepository['state']
  readonly reason?: string | null
  readonly committed?: TaskChangesCommittedScope | null
  readonly working?: TaskChangesWorkingTreeScope | null
  readonly baseCommit?: string | null
  readonly headCommit?: string | null
}): TaskChangesRepository {
  return {
    repositoryRoot: args.repositoryRoot,
    state: args.state ?? 'available',
    reason: args.reason ?? null,
    attribution: DEFAULT_ATTRIBUTION,
    baseCommit: args.baseCommit === undefined ? 'a4f91c2' : args.baseCommit,
    baseProvenance: 'dispatch',
    headCommit: args.headCommit === undefined ? '7be02d9' : args.headCommit,
    worktree:
      args.worktree === undefined
        ? '~/Code/Harflow/HarflowWeb'
        : args.worktree,
    gitCommonDir: `${args.repositoryRoot}/.git`,
    observedAt: OBSERVED_AT,
    fieldsTruncated: false,
    baselineDirty: args.baselineDirty ?? false,
    scopes: {
      committed_range: args.committed ?? null,
      working_tree: args.working ?? null,
    },
  }
}

export function observation(args: {
  readonly taskId: TaskId
  readonly repositories: readonly TaskChangesRepository[]
  readonly captureState?: TaskChangesObservation['capture']['state']
  readonly captureReason?: string | null
  readonly hasMore?: boolean
}): TaskChangesObservation {
  return {
    taskId: args.taskId,
    capture: {
      state: args.captureState ?? 'available',
      reason: args.captureReason ?? null,
    },
    observedAt: OBSERVED_AT,
    repositories: args.repositories,
    hasMore: args.hasMore ?? false,
    nextCursor: null,
    text: null,
  }
}
