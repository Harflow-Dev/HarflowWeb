import type {
  DiffLine,
  TaskChangesContent,
  TaskChangesEntryRef,
  TaskChangesObservation,
  TaskChangesRepository,
  TaskChangesRow,
  TaskChangesRowStatus,
  TaskChangesScope,
  TaskId,
} from '../../model'

/** Verbatim engine attribution — duplicated from presentation for the mock layer. */
export const DEFAULT_ATTRIBUTION =
  'Observed repository differences; not evidence of task authorship.'

export const QUEUE_PY_PATH = 'harflow_web/delivery/queue.py'
export const CONFIG_PY_PATH = 'harflow_web/config.py'
export const TEST_QUEUE_PATH = 'tests/test_delivery_queue.py'
export const HARFLOW_WEB_ROOT = '~/Code/Harflow/HarflowWeb'
export const HARFLOW_MCP_ROOT = '~/Code/Harflow/HarflowMCP'

export const QUEUE_ENTRY: TaskChangesEntryRef = {
  repositoryRoot: HARFLOW_WEB_ROOT,
  scope: 'committed_range',
  path: QUEUE_PY_PATH,
}

export const CONFIG_ENTRY: TaskChangesEntryRef = {
  repositoryRoot: HARFLOW_WEB_ROOT,
  scope: 'committed_range',
  path: CONFIG_PY_PATH,
}

export const TEST_ENTRY: TaskChangesEntryRef = {
  repositoryRoot: HARFLOW_WEB_ROOT,
  scope: 'committed_range',
  path: TEST_QUEUE_PATH,
}

export const SAME_PATH_WORKING: TaskChangesEntryRef = {
  repositoryRoot: HARFLOW_WEB_ROOT,
  scope: 'working_tree',
  path: QUEUE_PY_PATH,
}

export const BIG_MODULE_ENTRY: TaskChangesEntryRef = {
  repositoryRoot: HARFLOW_MCP_ROOT,
  scope: 'committed_range',
  path: 'src/big_module.py',
}

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

export function row(args: {
  readonly path: string
  readonly status: TaskChangesRowStatus
  readonly additions?: number | null
  readonly deletions?: number | null
  readonly content?: TaskChangesContent
  readonly pathTruncated?: boolean
}): TaskChangesRow {
  return {
    path: args.path,
    pathTruncated: args.pathTruncated ?? false,
    status: args.status,
    additions: args.additions === undefined ? 0 : args.additions,
    deletions: args.deletions === undefined ? 0 : args.deletions,
    content: args.content ?? contentAvailable(),
  }
}

export function scopeAvailable(args: {
  readonly rows: readonly TaskChangesRow[]
  readonly rowCount?: number
  readonly rowsTruncated?: boolean
  readonly unmergedUnknown?: boolean
  readonly countsAndPatchSeparate?: boolean
}): TaskChangesScope {
  return {
    state: 'available',
    reason: null,
    rowCount: args.rowCount ?? args.rows.length,
    rowsTruncated: args.rowsTruncated ?? false,
    unmergedUnknown: args.unmergedUnknown ?? false,
    reportedConflicts: [],
    countsAndPatchSeparate: args.countsAndPatchSeparate ?? false,
    rows: args.rows,
  }
}

export function scopeCustom(args: {
  readonly state: TaskChangesScope['state']
  readonly reason: string | null
  readonly rows?: readonly TaskChangesRow[]
  readonly rowCount?: number
  readonly rowsTruncated?: boolean
  readonly unmergedUnknown?: boolean
  readonly countsAndPatchSeparate?: boolean
}): TaskChangesScope {
  const rows = args.rows ?? []
  return {
    state: args.state,
    reason: args.reason,
    rowCount: args.rowCount ?? rows.length,
    rowsTruncated: args.rowsTruncated ?? false,
    unmergedUnknown: args.unmergedUnknown ?? false,
    reportedConflicts: [],
    countsAndPatchSeparate: args.countsAndPatchSeparate ?? false,
    rows,
  }
}

export function repoBase(args: {
  readonly name: string
  readonly repositoryRoot: string
  readonly worktree?: string | null
  readonly baselineDirty?: boolean | 'unknown'
  readonly state?: TaskChangesRepository['state']
  readonly reason?: string | null
  readonly committed?: TaskChangesScope | null
  readonly working?: TaskChangesScope | null
  readonly baseCommit?: string | null
  readonly headCommit?: string | null
  readonly observedAtLabel?: string | null
}): TaskChangesRepository {
  return {
    repositoryRoot: args.repositoryRoot,
    name: args.name,
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
    observedAtLabel:
      args.observedAtLabel === undefined ? 'Today 10:42' : args.observedAtLabel,
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
  readonly selectedEntry?: TaskChangesObservation['selectedEntry']
  readonly text?: TaskChangesObservation['text']
  readonly turns?: TaskChangesObservation['turns']
  readonly textPanels?: TaskChangesObservation['textPanels']
}): TaskChangesObservation {
  return {
    taskId: args.taskId,
    capture: {
      state: args.captureState ?? 'available',
      reason: args.captureReason ?? null,
    },
    repositories: args.repositories,
    hasMore: args.hasMore ?? false,
    selectedEntry: args.selectedEntry ?? null,
    text: args.text ?? null,
    turns: args.turns ?? null,
    textPanels: args.textPanels ?? null,
  }
}

export function parseDiffLines(raw: readonly string[]): readonly DiffLine[] {
  return raw.map((line) => {
    if (line.startsWith('@@')) return { kind: 'hunk' as const, text: line }
    if (line.startsWith('+')) {
      return { kind: 'add' as const, text: line.slice(1) }
    }
    if (line.startsWith('-')) {
      return { kind: 'del' as const, text: line.slice(1) }
    }
    const text = line.startsWith(' ') ? line.slice(1) : line
    return { kind: 'context' as const, text }
  })
}

export const QUEUE_DIFF_RAW = [
  '@@ -41,9 +41,18 @@ class DeliveryQueue',
  ' def next_attempt(self, target):',
  '-    return self._attempts[target] + 1',
  '+    window = self._window(target)',
  '+    if len(window) >= self.retry_budget:',
  '+        self._mark_exhausted(target)',
  '+        return None',
  '+    window.append(self._clock())',
  '+    return len(window)',
] as const

export const WEB_COMMITTED_ROWS: readonly TaskChangesRow[] = [
  row({
    path: 'harflow_web/delivery/queue.py',
    status: 'modified',
    additions: 24,
    deletions: 3,
  }),
  row({
    path: 'harflow_web/config.py',
    status: 'modified',
    additions: 2,
    deletions: 0,
  }),
  row({
    path: 'tests/test_delivery_queue.py',
    status: 'added',
    additions: 31,
    deletions: 0,
  }),
]

export const WEB_WORKING_NAME_ONLY = row({
  path: 'notes/retry-budget.md',
  status: 'untracked',
  additions: null,
  deletions: null,
  content: contentState('not_captured', 'untracked', null),
})
