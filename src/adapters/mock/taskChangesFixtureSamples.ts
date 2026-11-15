import type {
  DiffLine,
  TaskChangesEntryRef,
  TaskChangesContent,
  TaskChangesRowStatus,
  TaskChangesRow,
  TaskChangesTextObservation,
} from '../../model'
import { OBSERVED_AT, contentState, row } from './taskChangesFixtureBuilders'

/** Text-mode chunk with the contract's bookkeeping filled in. */
export function textObservation(args: {
  readonly entry: TaskChangesEntryRef
  readonly status: TaskChangesRowStatus
  readonly additions: number | null
  readonly deletions: number | null
  readonly content: TaskChangesContent
  readonly lines: readonly DiffLine[]
  readonly returnedBytes: number
  readonly totalBytes?: number
  readonly hasMore?: boolean
  readonly nextCursor?: string | null
  readonly refusal?: TaskChangesTextObservation['refusal']
}): TaskChangesTextObservation {
  return {
    entry: args.entry,
    status: args.status,
    additions: args.additions,
    deletions: args.deletions,
    binary: args.content.state === 'binary',
    content: args.content,
    observedAt: OBSERVED_AT,
    offset: 0,
    returnedBytes: args.returnedBytes,
    totalBytes: args.totalBytes ?? args.returnedBytes,
    hasMore: args.hasMore ?? false,
    nextCursor: args.nextCursor ?? null,
    lines: args.lines,
    refusal: args.refusal ?? null,
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
