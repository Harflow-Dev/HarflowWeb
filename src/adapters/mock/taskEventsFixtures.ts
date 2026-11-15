/**
 * Stored events fixtures — exact JSON from Design 6e31cd7 EVENTS map.
 * Mock-only presentation — not a public ctl events protocol.
 */
import type {
  TaskEventsLoad,
  TaskEventsObservation,
  TaskEventsQuery,
  TaskEventsRecord,
} from '../../model'
import {
  TASK_EVENTS_EMPTY_ID,
  TASK_EVENTS_ERROR_ID,
  TASK_EVENTS_LOADING_ID,
  TASK_EVENTS_NOT_STARTED_ID,
  TASK_EVENTS_PAGE_ERROR_ID,
  TASK_EVENTS_PAGE_ID,
  TASK_EVENTS_POPULATED_ID,
} from './taskEventsFixtureIds'

export {
  TASK_EVENTS_EMPTY_ID,
  TASK_EVENTS_ERROR_ID,
  TASK_EVENTS_LOADING_ID,
  TASK_EVENTS_NOT_STARTED_ID,
  TASK_EVENTS_PAGE_ERROR_ID,
  TASK_EVENTS_PAGE_ID,
  TASK_EVENTS_POPULATED_ID,
} from './taskEventsFixtureIds'

const ACTIVITY_CAPTION =
  'Observed in available captured history; this does not prove complete execution capture.'

const TOOL_RESULT: TaskEventsRecord = {
  title: 'Tool result · normalized record',
  json: `{
  "format": "harflow.event", "product": "harflow",
  "product_version": "0.0.11", "v": 1,
  "observed_at": "2026-10-14T17:46:40+00:00", "seq": 5,
  "kind": "tool_result", "call_id": "call-1",
  "is_error": false, "output": "Readme body"
}`,
}

const ASSISTANT_START: TaskEventsRecord = {
  title: 'Assistant text · normalized record',
  json: `{
  "format": "harflow.event", "product": "harflow",
  "product_version": "0.0.11", "v": 1,
  "observed_at": "2026-10-14T17:46:40+00:00", "seq": 40,
  "kind": "assistant_text", "text": "Starting."
}`,
}

const ASSISTANT_DONE: TaskEventsRecord = {
  title: 'Assistant text · normalized record',
  json: `{
  "format": "harflow.event", "product": "harflow",
  "product_version": "0.0.11", "v": 1,
  "observed_at": "2026-10-14T17:46:40+00:00", "seq": 41,
  "kind": "assistant_text", "text": "Done."
}`,
}

const TOOL_PASSED: TaskEventsRecord = {
  title: 'Tool result · normalized record',
  json: `{
  "format": "harflow.event", "product": "harflow",
  "product_version": "0.0.11", "v": 1,
  "observed_at": "2026-10-14T17:46:40+00:00", "seq": 42,
  "kind": "tool_result", "call_id": "call-9",
  "is_error": false, "output": "11 passed"
}`,
}

const STUB_FUTURE: TaskEventsRecord = {
  title: 'Unsupported record · public stub',
  json: `{
  "format": "harflow.event", "product": "harflow",
  "product_version": "0.0.11", "v": 1,
  "observed_at": "2026-10-14T17:46:40+00:00", "seq": 43,
  "kind": "future_kind", "truncated": true
}`,
}

function observation(
  taskId: TaskEventsObservation['taskId'],
  extra: Partial<TaskEventsObservation>,
): TaskEventsObservation {
  return {
    taskId,
    records: [],
    hasEarlier: false,
    earlierPage: [],
    logState: 'available',
    ...extra,
  }
}

const BY_ID: ReadonlyMap<string, TaskEventsObservation> = new Map([
  [
    TASK_EVENTS_POPULATED_ID,
    observation(TASK_EVENTS_POPULATED_ID, {
      activityFacts: {
        toolCallsObserved: 2,
        caption: ACTIVITY_CAPTION,
      },
      records: [TOOL_RESULT],
      recoveredTranscriptNote: true,
    }),
  ],
  [
    TASK_EVENTS_PAGE_ID,
    observation(TASK_EVENTS_PAGE_ID, {
      records: [ASSISTANT_DONE, TOOL_PASSED, STUB_FUTURE],
      hasEarlier: true,
      earlierPage: [ASSISTANT_START],
    }),
  ],
  [
    TASK_EVENTS_PAGE_ERROR_ID,
    observation(TASK_EVENTS_PAGE_ERROR_ID, {
      records: [ASSISTANT_DONE, TOOL_PASSED, STUB_FUTURE],
      hasEarlier: true,
      earlierPage: [ASSISTANT_START],
    }),
  ],
  [
    TASK_EVENTS_EMPTY_ID,
    observation(TASK_EVENTS_EMPTY_ID, { logState: 'empty' }),
  ],
  [
    TASK_EVENTS_ERROR_ID,
    observation(TASK_EVENTS_ERROR_ID, { logState: 'unavailable' }),
  ],
  [
    TASK_EVENTS_LOADING_ID,
    observation(TASK_EVENTS_LOADING_ID, {
      activityFacts: {
        toolCallsObserved: 2,
        caption: ACTIVITY_CAPTION,
      },
      records: [TOOL_RESULT],
    }),
  ],
  [
    TASK_EVENTS_NOT_STARTED_ID,
    observation(TASK_EVENTS_NOT_STARTED_ID, { logState: 'empty' }),
  ],
])

export function taskEventsLoadFor(query: TaskEventsQuery): TaskEventsLoad {
  const found = BY_ID.get(query.taskId)
  if (!found) {
    return {
      kind: 'unavailable',
      message: `No mock events are mapped for task ${query.taskId}.`,
    }
  }
  return { kind: 'ready', observation: found }
}

export function populatedEventsObservation(): TaskEventsObservation {
  return BY_ID.get(TASK_EVENTS_POPULATED_ID)!
}

export function pageEventsObservation(): TaskEventsObservation {
  return BY_ID.get(TASK_EVENTS_PAGE_ID)!
}
