/**
 * Deterministic task-changes fixtures from HarflowDesign 6e31cd7
 * m05-proposal CHANGES map (G-DIFF). Mock-only — not Git.
 */
import {
  taskChangesEntriesEqual,
  type TaskChangesEntryRef,
  type TaskChangesLoad,
  type TaskChangesObservation,
  type TaskChangesQuery,
  type TaskId,
} from '../../model'
import { RETRY_BUDGET_DONE_TASK_ID } from './taskFixtures'
import {
  TASK_EVENTS_EMPTY_ID,
  TASK_EVENTS_ERROR_ID,
  TASK_EVENTS_LOADING_ID,
  TASK_EVENTS_PAGE_ERROR_ID,
  TASK_EVENTS_PAGE_ID,
  TASK_EVENTS_POPULATED_ID,
} from './taskEventsFixtureIds'
import {
  BIG_MODULE_ENTRY,
  CONFIG_ENTRY,
  contentAvailable,
  QUEUE_ENTRY,
  SAME_PATH_WORKING,
} from './taskChangesFixtureBuilders'
import {
  parseDiffLines,
  textObservation,
} from './taskChangesFixtureSamples'
import {
  errorDoc,
  incompleteDoc,
  multiDoc,
  multiLimitedDoc,
  noRepositoryDoc,
  notCapturedDoc,
  rowStatesDoc,
  runningCaptureDoc,
  samePathDoc,
  singleDoc,
  unmergedDoc,
  zeroDoc,
} from './taskChangesFixtureDocs'
import {
  TASK_CHANGES_ERROR_ID,
  TASK_CHANGES_INCOMPLETE_ID,
  TASK_CHANGES_LOADING_ID,
  TASK_CHANGES_MULTI_ID,
  TASK_CHANGES_MULTI_LIMITED_ID,
  TASK_CHANGES_NOT_CAPTURED_ID,
  TASK_CHANGES_NO_REPOSITORY_ID,
  TASK_CHANGES_ROW_STATES_ID,
  TASK_CHANGES_RUNNING_ID,
  TASK_CHANGES_SAME_PATH_ID,
  TASK_CHANGES_SINGLE_ID,
  TASK_CHANGES_TEXT_ID,
  TASK_CHANGES_TURN_1_ID,
  TASK_CHANGES_TURN_2_ID,
  TASK_CHANGES_TURNS_ID,
  TASK_CHANGES_UNMERGED_ID,
  TASK_CHANGES_ZERO_ID,
} from './taskChangesFixtureIds'
import {
  bigModuleText,
  queueText,
  samePathWorkingText,
  turn1Doc,
  turn2ConfigText,
  turn2Doc,
} from './taskChangesFixtureText'

export {
  CONFIG_PY_PATH,
  QUEUE_PY_PATH,
  TEST_QUEUE_PATH,
} from './taskChangesFixtureBuilders'
export {
  TASK_CHANGES_ERROR_ID,
  TASK_CHANGES_INCOMPLETE_ID,
  TASK_CHANGES_LOADING_ID,
  TASK_CHANGES_MULTI_ID,
  TASK_CHANGES_MULTI_LIMITED_ID,
  TASK_CHANGES_NOT_CAPTURED_ID,
  TASK_CHANGES_NO_REPOSITORY_ID,
  TASK_CHANGES_ROW_STATES_ID,
  TASK_CHANGES_RUNNING_ID,
  TASK_CHANGES_SAME_PATH_ID,
  TASK_CHANGES_SINGLE_ID,
  TASK_CHANGES_TEXT_ID,
  TASK_CHANGES_TURN_1_ID,
  TASK_CHANGES_TURN_2_ID,
  TASK_CHANGES_TURNS_ID,
  TASK_CHANGES_UNMERGED_ID,
  TASK_CHANGES_ZERO_ID,
} from './taskChangesFixtureIds'

type DocBuilder = (taskId: TaskId) => TaskChangesObservation

const DOCS: ReadonlyMap<string, DocBuilder> = new Map([
  [TASK_CHANGES_SINGLE_ID, singleDoc],
  [RETRY_BUDGET_DONE_TASK_ID, singleDoc],
  [TASK_CHANGES_MULTI_ID, multiDoc],
  [TASK_CHANGES_MULTI_LIMITED_ID, multiLimitedDoc],
  [TASK_CHANGES_SAME_PATH_ID, samePathDoc],
  [TASK_CHANGES_ROW_STATES_ID, rowStatesDoc],
  [TASK_CHANGES_INCOMPLETE_ID, incompleteDoc],
  [TASK_CHANGES_NOT_CAPTURED_ID, notCapturedDoc],
  [TASK_CHANGES_UNMERGED_ID, unmergedDoc],
  [TASK_CHANGES_RUNNING_ID, runningCaptureDoc],
  [TASK_CHANGES_ZERO_ID, zeroDoc],
  [TASK_CHANGES_NO_REPOSITORY_ID, noRepositoryDoc],
  [TASK_CHANGES_TEXT_ID, singleDoc],
  [TASK_CHANGES_LOADING_ID, singleDoc],
  [TASK_CHANGES_ERROR_ID, errorDoc],
  [TASK_CHANGES_TURNS_ID, singleDoc],
  [TASK_CHANGES_TURN_2_ID, turn2Doc],
  [TASK_CHANGES_TURN_1_ID, turn1Doc],
  // Events preview scenarios share the design's default Changes specimen count.
  [TASK_EVENTS_POPULATED_ID, singleDoc],
  [TASK_EVENTS_PAGE_ID, singleDoc],
  [TASK_EVENTS_PAGE_ERROR_ID, singleDoc],
  [TASK_EVENTS_ERROR_ID, singleDoc],
  [TASK_EVENTS_LOADING_ID, runningCaptureDoc],
  [TASK_EVENTS_EMPTY_ID, runningCaptureDoc],
])

/** Text is attached only for an entry the query names; the list is never defaulted. */
function withSelection(
  doc: TaskChangesObservation,
  entry: TaskChangesEntryRef | null,
): TaskChangesObservation {
  if (entry === null) return doc
  return { ...doc, text: textForEntry(doc.taskId, entry) }
}

function textForEntry(
  taskId: TaskId,
  entry: TaskChangesEntryRef,
): TaskChangesObservation['text'] {
  if (entryEquals(entry, QUEUE_ENTRY)) return queueText()
  if (entryEquals(entry, SAME_PATH_WORKING)) return samePathWorkingText()
  if (entryEquals(entry, BIG_MODULE_ENTRY)) return bigModuleText()
  if (entryEquals(entry, CONFIG_ENTRY)) {
    return taskId === TASK_CHANGES_TURN_2_ID
      ? turn2ConfigText()
      : configNoteText()
  }
  return null
}

function configNoteText(): NonNullable<TaskChangesObservation['text']> {
  return textObservation({
    entry: CONFIG_ENTRY,
    status: 'modified',
    additions: 2,
    deletions: 0,
    content: contentAvailable(120),
    returnedBytes: 120,
    lines: parseDiffLines([
      '@@ -12,4 +12,6 @@ RETRY defaults',
      ' DELIVERY_RETRY_BUDGET = 5',
      '+NOTE = "<script>alert(\'x\')</script> — café"',
      '+LABEL = "日本語 retry budget"',
    ]),
  })
}

function entryEquals(a: TaskChangesEntryRef, b: TaskChangesEntryRef): boolean {
  return taskChangesEntriesEqual(a, b)
}

function resolveTaskId(query: TaskChangesQuery): TaskId {
  return query.turnTaskId ?? query.taskId
}

export function taskChangesLoadFor(query: TaskChangesQuery): TaskChangesLoad {
  const taskId = resolveTaskId(query)
  const builder = DOCS.get(taskId)
  if (!builder) {
    return {
      kind: 'unavailable',
      message: `No mock changes are mapped for task ${taskId}.`,
    }
  }
  const doc = withSelection(builder(taskId), query.selectedEntry)
  return { kind: 'ready', observation: { ...doc, taskId } }
}

export { emptyDiffChangesLoad, unavailableDiffChangesLoad } from './taskChangesFixtureLoads'

export function retryBudgetChangesObservation(
  selectedEntry: TaskChangesEntryRef | null = null,
): TaskChangesObservation {
  const load = taskChangesLoadFor({
    taskId: RETRY_BUDGET_DONE_TASK_ID,
    selectedEntry,
    turnTaskId: null,
  })
  if (load.kind !== 'ready') {
    throw new Error('retry budget changes fixture missing')
  }
  return load.observation
}

export { pendingCaptureDoc } from './taskChangesFixtureDocs'
export { WEB_COMMITTED_ROWS } from './taskChangesFixtureSamples'
export {
  HARFLOW_WEB_ROOT,
  HARFLOW_MCP_ROOT,
  BIG_MODULE_ENTRY,
  QUEUE_ENTRY,
  CONFIG_ENTRY,
  TEST_ENTRY,
  SAME_PATH_WORKING,
} from './taskChangesFixtureBuilders'
export { textSpecimenPanels, turnsMembers } from './taskChangesFixtureText'
