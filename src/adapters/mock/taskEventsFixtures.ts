/**
 * Stored events fixtures keyed by task id. Specimens follow Design 6e31cd7;
 * other tasks derive their history from the task fixture so Events agrees
 * with the task's status. Mock-only — not a public ctl events protocol.
 */
import {
  observedEngineStatus,
  type TaskEventsLoad,
  type TaskEventsObservation,
  type TaskEventsOlderLoad,
  type TaskEventsOlderQuery,
  type TaskEventsQuery,
  type TaskId,
} from '../../model'
import {
  TASK_EVENTS_EMPTY_ID,
  TASK_EVENTS_ERROR_ID,
  TASK_EVENTS_LOADING_ID,
  TASK_EVENTS_PAGE_ERROR_ID,
  TASK_EVENTS_PAGE_ID,
  TASK_EVENTS_POPULATED_ID,
} from './taskEventsFixtureIds'
import {
  TASK_PANE_RUNNING_OPEN_ID,
  TASK_TOPBAR_FACTS_ID,
} from './taskPaneTopbarFixtures'
import {
  ASSISTANT_DONE,
  ASSISTANT_START,
  genericRecords,
  STUB_FUTURE,
  TOOL_PASSED,
  TOOL_RESULT,
} from './taskEventsRecordFixtures'
import { taskLoadFor } from './taskFixtures'

export {
  TASK_EVENTS_EMPTY_ID,
  TASK_EVENTS_ERROR_ID,
  TASK_EVENTS_LOADING_ID,
  TASK_EVENTS_NOT_STARTED_ID,
  TASK_EVENTS_PAGE_ERROR_ID,
  TASK_EVENTS_PAGE_ID,
  TASK_EVENTS_POPULATED_ID,
} from './taskEventsFixtureIds'

function observation(
  taskId: TaskId,
  extra: Partial<TaskEventsObservation>,
): TaskEventsObservation {
  return {
    taskId,
    log: { state: 'final' },
    records: [],
    hasOlder: false,
    olderCursor: null,
    ...extra,
  }
}

const PAGE_CURSOR = (taskId: TaskId) => `older:${taskId}:41`

function pagedObservation(taskId: TaskId): TaskEventsObservation {
  return observation(taskId, {
    records: [ASSISTANT_DONE, TOOL_PASSED, STUB_FUTURE],
    hasOlder: true,
    olderCursor: PAGE_CURSOR(taskId),
  })
}

/** Design EVENTS.populated for a run still going: the log is open. */
function runningPopulated(taskId: TaskId): TaskEventsObservation {
  return observation(taskId, {
    log: { state: 'open' },
    toolCallsObserved: 2,
    records: [TOOL_RESULT],
    recoveredTranscript: true,
  })
}

const SPECIMENS: ReadonlyMap<string, TaskEventsObservation> = new Map([
  [TASK_PANE_RUNNING_OPEN_ID, runningPopulated(TASK_PANE_RUNNING_OPEN_ID)],
  [TASK_TOPBAR_FACTS_ID, runningPopulated(TASK_TOPBAR_FACTS_ID)],
  [
    TASK_EVENTS_POPULATED_ID,
    observation(TASK_EVENTS_POPULATED_ID, {
      toolCallsObserved: 2,
      records: [TOOL_RESULT],
      recoveredTranscript: true,
    }),
  ],
  [TASK_EVENTS_PAGE_ID, pagedObservation(TASK_EVENTS_PAGE_ID)],
  [TASK_EVENTS_PAGE_ERROR_ID, pagedObservation(TASK_EVENTS_PAGE_ERROR_ID)],
  [
    TASK_EVENTS_EMPTY_ID,
    observation(TASK_EVENTS_EMPTY_ID, { log: { state: 'open' } }),
  ],
  [
    TASK_EVENTS_ERROR_ID,
    observation(TASK_EVENTS_ERROR_ID, { log: { state: 'unavailable' } }),
  ],
  [
    TASK_EVENTS_LOADING_ID,
    observation(TASK_EVENTS_LOADING_ID, {
      log: { state: 'open' },
      toolCallsObserved: 2,
      records: [TOOL_RESULT],
    }),
  ],
])

/** The one older page: seq 40, reaching the beginning. */
function olderAnswer(taskId: TaskId): TaskEventsOlderLoad {
  if (taskId === TASK_EVENTS_PAGE_ERROR_ID) {
    return { kind: 'refused', code: 'event_cursor_expired' }
  }
  return {
    kind: 'ready',
    page: {
      taskId,
      records: [ASSISTANT_START],
      hasOlder: false,
      olderCursor: null,
    },
  }
}

export function taskEventsOlderLoadFor(
  query: TaskEventsOlderQuery,
): TaskEventsOlderLoad {
  if (!SPECIMENS.has(query.taskId) || !SPECIMENS.get(query.taskId)?.hasOlder) {
    return {
      kind: 'unavailable',
      message: `No older mock events are mapped for task ${query.taskId}.`,
    }
  }
  if (query.before !== PAGE_CURSOR(query.taskId)) {
    return { kind: 'refused', code: 'event_cursor_invalid' }
  }
  return olderAnswer(query.taskId)
}

/** Engine log state and history for a task without a specimen. */
function derivedObservation(taskId: TaskId): TaskEventsLoad {
  const load = taskLoadFor(taskId)
  if (load.kind !== 'ready') {
    return {
      kind: 'unavailable',
      message: `No mock events are mapped for task ${taskId}.`,
    }
  }
  const task = load.observation
  const status = observedEngineStatus(task.statusRead)
  if (task.statusRead.kind === 'unread') {
    return { kind: 'unavailable', message: 'The engine did not answer.' }
  }
  if (status === 'pending') {
    return {
      kind: 'refused',
      code: 'task_pending_launch',
      launchState: 'waiting_for_resources',
    }
  }
  const live = status === 'running'
  const lost = task.supervision === 'owner_lost'
  const unobserved = task.exitObserved === false
  const finished = live ? null : (status ?? 'unknown')
  const state = live
    ? lost
      ? 'incomplete'
      : 'open'
    : task.settling === true
      ? 'settling'
      : unobserved
        ? 'incomplete'
        : 'final'
  return {
    kind: 'ready',
    observation: observation(taskId, {
      log: { state },
      records: genericRecords(state === 'final' ? finished : null),
    }),
  }
}

export function taskEventsLoadFor(query: TaskEventsQuery): TaskEventsLoad {
  const specimen = SPECIMENS.get(query.taskId)
  if (specimen) return { kind: 'ready', observation: specimen }
  return derivedObservation(query.taskId)
}

export function populatedEventsObservation(): TaskEventsObservation {
  return SPECIMENS.get(TASK_EVENTS_POPULATED_ID)!
}

export function pageEventsObservation(): TaskEventsObservation {
  return SPECIMENS.get(TASK_EVENTS_PAGE_ID)!
}
