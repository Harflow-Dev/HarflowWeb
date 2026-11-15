/**
 * Deterministic task-changes fixtures from HarflowDesign 6e31cd7
 * m05-proposal CHANGES map (G-DIFF). Mock-only — not Git.
 */
import type {
  TaskChangesEntryRef,
  TaskChangesLoad,
  TaskChangesObservation,
  TaskChangesQuery,
  TaskId,
} from '../../model'
import { RETRY_BUDGET_DONE_TASK_ID } from './taskFixtures'
import {
  BIG_MODULE_ENTRY,
  CONFIG_ENTRY,
  contentAvailable,
  parseDiffLines,
  QUEUE_ENTRY,
  SAME_PATH_WORKING,
  TEST_ENTRY,
} from './taskChangesFixtureBuilders'
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
  configChunkText,
  queueText,
  samePathWorkingText,
  testRefusalText,
  textSpecimenDoc,
  turn1Doc,
  turn2Doc,
  turnsDoc,
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
  [TASK_CHANGES_TEXT_ID, textSpecimenDoc],
  [TASK_CHANGES_LOADING_ID, singleDoc],
  [TASK_CHANGES_ERROR_ID, errorDoc],
  [TASK_CHANGES_TURNS_ID, turnsDoc],
  [TASK_CHANGES_TURN_2_ID, turn2Doc],
  [TASK_CHANGES_TURN_1_ID, turn1Doc],
])

function withSelection(
  doc: TaskChangesObservation,
  entry: TaskChangesEntryRef | null,
): TaskChangesObservation {
  if (entry === null) {
    if (doc.selectedEntry === null) return doc
    return attachTextForEntry(doc, doc.selectedEntry)
  }
  return attachTextForEntry(doc, entry)
}

function attachTextForEntry(
  doc: TaskChangesObservation,
  entry: TaskChangesEntryRef,
): TaskChangesObservation {
  const texted = textSpecimenSelection(doc, entry)
  if (texted) return texted
  if (entryEquals(entry, QUEUE_ENTRY)) {
    return { ...doc, selectedEntry: entry, text: queueText() }
  }
  if (entryEquals(entry, SAME_PATH_WORKING)) {
    return { ...doc, selectedEntry: entry, text: samePathWorkingText() }
  }
  if (entryEquals(entry, BIG_MODULE_ENTRY)) {
    return { ...doc, selectedEntry: entry, text: bigModuleText() }
  }
  if (entryEquals(entry, CONFIG_ENTRY) && doc.taskId === TASK_CHANGES_TURN_2_ID) {
    return { ...doc, selectedEntry: entry }
  }
  if (entryEquals(entry, CONFIG_ENTRY)) {
    return { ...doc, selectedEntry: entry, text: configNoteText() }
  }
  return { ...doc, selectedEntry: entry, text: null }
}

function textSpecimenSelection(
  doc: TaskChangesObservation,
  entry: TaskChangesEntryRef,
): TaskChangesObservation | null {
  if (doc.taskId !== TASK_CHANGES_TEXT_ID) return null
  if (entryEquals(entry, QUEUE_ENTRY)) {
    return { ...doc, selectedEntry: entry, text: null }
  }
  if (entryEquals(entry, CONFIG_ENTRY)) {
    return { ...doc, selectedEntry: entry, text: configChunkText() }
  }
  if (entryEquals(entry, TEST_ENTRY)) {
    return { ...doc, selectedEntry: entry, text: testRefusalText() }
  }
  return null
}

function configNoteText(): NonNullable<TaskChangesObservation['text']> {
  return {
    entry: CONFIG_ENTRY,
    status: 'modified',
    additions: 2,
    deletions: 0,
    content: contentAvailable(120),
    offset: 0,
    returnedBytes: 120,
    totalBytes: 120,
    hasMore: false,
    nextCursor: null,
    lines: parseDiffLines([
      '@@ -12,4 +12,6 @@ RETRY defaults',
      ' DELIVERY_RETRY_BUDGET = 5',
      '+NOTE = "<script>alert(\'x\')</script> — café"',
      '+LABEL = "日本語 retry budget"',
    ]),
    refusal: null,
  }
}

function entryEquals(a: TaskChangesEntryRef, b: TaskChangesEntryRef): boolean {
  return (
    a.repositoryRoot === b.repositoryRoot &&
    a.scope === b.scope &&
    a.path === b.path
  )
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
export {
  WEB_COMMITTED_ROWS,
  HARFLOW_WEB_ROOT,
  HARFLOW_MCP_ROOT,
  QUEUE_ENTRY,
  CONFIG_ENTRY,
  TEST_ENTRY,
  SAME_PATH_WORKING,
} from './taskChangesFixtureBuilders'
