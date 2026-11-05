/**
 * Deterministic recorded-change fixtures from HarflowDesign
 * 3643d083… v2/scripts/screens-task.js task/done Changes pane.
 * Mock-only — not Git, not filesystem, not a public ctl diff protocol.
 * Counts and lines are recorded repository observations, not authorship proof.
 */
import type {
  ChangedFileRow,
  DiffContent,
  DiffLine,
  TaskChangesLoad,
  TaskChangesObservation,
  TaskChangesQuery,
  TaskId,
} from '../../model'
import { RETRY_BUDGET_DONE_TASK_ID } from './taskFixtures'

export const QUEUE_PY_PATH = 'harflow_web/delivery/queue.py'
export const CONFIG_PY_PATH = 'harflow_web/config.py'
export const TEST_QUEUE_PATH = 'tests/test_delivery_queue.py'
/** Extra fixture path used only in unit tests for empty vs unavailable. */
export const EMPTY_DIFF_PATH = 'docs/empty_change_marker.txt'
export const UNAVAILABLE_DIFF_PATH = 'docs/missing_recorded_diff.txt'

const RETRY_BUDGET_FILES: readonly ChangedFileRow[] = [
  { path: QUEUE_PY_PATH, additions: 24, deletions: 3 },
  { path: CONFIG_PY_PATH, additions: 2, deletions: 0 },
  { path: TEST_QUEUE_PATH, additions: 31, deletions: 0 },
]

function queuePyDiff(): readonly DiffLine[] {
  return [
    { kind: 'hunk', text: '@@ -41,9 +41,18 @@ class DeliveryQueue' },
    { kind: 'context', text: '    def next_attempt(self, target):' },
    { kind: 'del', text: '        return self._attempts[target] + 1' },
    { kind: 'add', text: '        window = self._window(target)' },
    {
      kind: 'add',
      text: '        if len(window) >= self.retry_budget:',
    },
    { kind: 'add', text: '            self._mark_exhausted(target)' },
    { kind: 'add', text: '            return None' },
    { kind: 'add', text: '        window.append(self._clock())' },
    { kind: 'add', text: '        return len(window)' },
    { kind: 'context', text: '    def _on_failure(self, delivery):' },
    { kind: 'del', text: '        self._requeue(delivery)' },
    {
      kind: 'add',
      text: '        if self.next_attempt(delivery.target):',
    },
    { kind: 'add', text: '            self._requeue(delivery)' },
  ]
}

/** Literal HTML-like and Unicode text — must render as text, never HTML. */
function configPyDiff(): readonly DiffLine[] {
  return [
    { kind: 'hunk', text: '@@ -12,4 +12,6 @@ RETRY defaults' },
    {
      kind: 'context',
      text: 'DELIVERY_RETRY_BUDGET = 5',
    },
    {
      kind: 'add',
      text: 'NOTE = "<script>alert(\'x\')</script> — café"',
    },
    {
      kind: 'add',
      text: 'LABEL = "日本語 retry budget"',
    },
  ]
}

function testQueueDiff(): readonly DiffLine[] {
  return [
    {
      kind: 'hunk',
      text: '@@ -1,3 +1,10 @@ tests for retry budget',
    },
    { kind: 'context', text: 'import pytest' },
    {
      kind: 'add',
      text: 'def test_budget_exhausts_after_five():',
    },
    {
      kind: 'add',
      text: '    assert queue.next_attempt("t") is None',
    },
  ]
}

const DIFF_BY_PATH: ReadonlyMap<string, DiffContent> = new Map([
  [QUEUE_PY_PATH, { kind: 'lines', lines: queuePyDiff() }],
  [CONFIG_PY_PATH, { kind: 'lines', lines: configPyDiff() }],
  [TEST_QUEUE_PATH, { kind: 'lines', lines: testQueueDiff() }],
  [EMPTY_DIFF_PATH, { kind: 'empty' }],
  [
    UNAVAILABLE_DIFF_PATH,
    {
      kind: 'unavailable',
      message: 'No recorded diff is mapped for this path.',
    },
  ],
])

function resolvePath(
  selectedPath: string | null,
  files: readonly ChangedFileRow[],
): string | null {
  if (selectedPath !== null) return selectedPath
  return files[0]?.path ?? null
}

function observationFor(
  taskId: TaskId,
  selectedPath: string,
  files: readonly ChangedFileRow[],
): TaskChangesObservation {
  const mapped = DIFF_BY_PATH.get(selectedPath)
  const diff: DiffContent =
    mapped ??
    ({
      kind: 'unavailable',
      message: `No recorded diff is mapped for ${selectedPath}.`,
    } as const)
  return {
    taskId,
    selectedPath,
    files,
    diff,
  }
}

export function taskChangesLoadFor(query: TaskChangesQuery): TaskChangesLoad {
  if (query.taskId !== RETRY_BUDGET_DONE_TASK_ID) {
    return {
      kind: 'unavailable',
      message: `No mock changes are mapped for task ${query.taskId}.`,
    }
  }
  const files = RETRY_BUDGET_FILES
  const path = resolvePath(query.selectedPath, files)
  if (path === null) {
    return {
      kind: 'unavailable',
      message: `No mock changes are mapped for task ${query.taskId}.`,
    }
  }
  return {
    kind: 'ready',
    observation: observationFor(query.taskId, path, files),
  }
}

/** Test helper: ready observation with an empty recorded diff. */
export function emptyDiffChangesLoad(taskId: TaskId): TaskChangesLoad {
  return {
    kind: 'ready',
    observation: {
      taskId,
      selectedPath: EMPTY_DIFF_PATH,
      files: [
        ...RETRY_BUDGET_FILES,
        { path: EMPTY_DIFF_PATH, additions: 0, deletions: 0 },
      ],
      diff: { kind: 'empty' },
    },
  }
}

/** Test helper: ready observation whose selected diff is unavailable. */
export function unavailableDiffChangesLoad(taskId: TaskId): TaskChangesLoad {
  return {
    kind: 'ready',
    observation: {
      taskId,
      selectedPath: UNAVAILABLE_DIFF_PATH,
      files: RETRY_BUDGET_FILES,
      diff: {
        kind: 'unavailable',
        message: 'No recorded diff is mapped for this path.',
      },
    },
  }
}

export function retryBudgetChangesObservation(
  selectedPath: string | null = null,
): TaskChangesObservation {
  const path = resolvePath(selectedPath, RETRY_BUDGET_FILES)!
  return observationFor(RETRY_BUDGET_DONE_TASK_ID, path, RETRY_BUDGET_FILES)
}
