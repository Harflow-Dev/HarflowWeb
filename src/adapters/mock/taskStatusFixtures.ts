/**
 * M05 task-status state fixtures (Design 6e31cd7 screens-m05-proposal.js).
 * One TaskObservation per preview state; unique task ids for fencing tests.
 */
import {
  EDIT_REPO_ENFORCEMENT,
  UNRECORDED_ENFORCEMENT,
} from './taskEnforcementFixtures'
import { asTaskId } from '../../model'
import type { TaskObservation } from '../../model'
import {
  eventsReaderFailedTranscript,
  pendingEmptyTranscript,
  retryBudgetDoneTranscript,
  slotReleaseTranscript,
  stoppedTaskTranscript,
} from './mappedTaskTranscripts'
import {
  doneConversation,
  failedConversation,
  runningConversation,
  stoppedConversation,
} from './taskConversationFixtures'

const RUNNING_TITLE = 'Fix flaky slot release test'
const RUNNING_META = 'Claude · Opus 5.5 · HarflowMCP'
const STOPPED_TITLE = 'Trace composer keystroke lag'
const STOPPED_META = 'Codex · gpt-6-astra · HarflowMac'
const PENDING_TITLE = 'Run the nightly dependency audit'
const PENDING_META = 'Claude · Opus 5.5 · HarflowMCP'
const ACCESS_EDIT = 'edit_repo' as const
const REPO_MCP = {
  name: 'HarflowMCP',
  path: '~/Code/Harflow/HarflowMCP',
} as const
const REPO_WEB = {
  name: 'HarflowWeb',
  path: '~/Code/Harflow/HarflowWeb',
} as const
const REPO_MAC = {
  name: 'HarflowMac',
  path: '~/Code/Harflow/HarflowMac',
} as const

const FAILURE = {
  title: 'Task failed: the harness exited with code 1',
  intro: 'The last error was:',
  lastError:
    'json.decoder.JSONDecodeError: Unterminated string starting at: line 1 column 38',
} as const

/** Canonical ids shared with legacy task-running / task-failed scenarios. */
export const TASK_STATUS_RUNNING_STOP_ID = asTaskId('task-slot-release')
export const TASK_STATUS_FAILED_CONTINUE_ID = asTaskId('task-events-reader-failed')

export const TASK_STATUS_STOP_REQUESTED_ID = asTaskId('task-m05-stop-requested')
export const TASK_STATUS_CANCELLED_ID = asTaskId('task-m05-cancelled')
export const TASK_STATUS_TIMED_OUT_ID = asTaskId('task-m05-timed-out')
export const TASK_STATUS_SETTLING_ID = asTaskId('task-m05-settling')
export const TASK_STATUS_UNKNOWN_FAILED_ID = asTaskId('task-m05-unknown-failed')
export const TASK_STATUS_UNKNOWN_DONE_ID = asTaskId('task-m05-unknown-done')
export const TASK_STATUS_OWNER_LOST_ID = asTaskId('task-m05-owner-lost')
export const TASK_STATUS_UNVERIFIED_ID = asTaskId('task-m05-unverified')
export const TASK_STATUS_LAUNCH_UNKNOWN_ID = asTaskId('task-m05-launch-unknown')
export const TASK_STATUS_STATUS_UNAVAILABLE_ID = asTaskId(
  'task-m05-status-unavailable',
)
export const TASK_STATUS_PENDING_ID = asTaskId('task-m05-pending')
export const TASK_STATUS_TAKEN_OVER_ID = asTaskId('task-m05-taken-over')
export const TASK_STATUS_CONTINUE_STARTING_ID = asTaskId(
  'task-m05-continue-starting',
)
export const TASK_STATUS_CONTINUE_STARTED_ID = asTaskId('task-m05-continue-started')

export {
  TASK_OVERFLOW_PARENT_ID,
  TASK_OVERFLOW_STOP_LINEAGE_ID,
  TASK_OVERFLOW_SUBTASK_ID,
} from './taskOverflowFixtures'

/** All M05 status fixture ids (16 states; running-stop and failed-continue alias sidebar ids). */
export const TASK_STATUS_FIXTURE_IDS = [
  TASK_STATUS_RUNNING_STOP_ID,
  TASK_STATUS_STOP_REQUESTED_ID,
  TASK_STATUS_CANCELLED_ID,
  TASK_STATUS_TIMED_OUT_ID,
  TASK_STATUS_SETTLING_ID,
  TASK_STATUS_UNKNOWN_FAILED_ID,
  TASK_STATUS_UNKNOWN_DONE_ID,
  TASK_STATUS_OWNER_LOST_ID,
  TASK_STATUS_UNVERIFIED_ID,
  TASK_STATUS_LAUNCH_UNKNOWN_ID,
  TASK_STATUS_STATUS_UNAVAILABLE_ID,
  TASK_STATUS_PENDING_ID,
  TASK_STATUS_TAKEN_OVER_ID,
  TASK_STATUS_CONTINUE_STARTING_ID,
  TASK_STATUS_CONTINUE_STARTED_ID,
  TASK_STATUS_FAILED_CONTINUE_ID,
] as const

function runningObservation(
  taskId: ReturnType<typeof asTaskId>,
  extra?: Partial<TaskObservation>,
): TaskObservation {
  return {
    taskId,
    title: RUNNING_TITLE,
    headerMeta: RUNNING_META,
    statusRead: { kind: 'observed', status: 'running' },
    elapsedSeconds: 252,
    conversation: runningConversation(),
    transcript: slotReleaseTranscript(),
    detailsPane: null,
    repository: REPO_MCP,
    accessLevel: ACCESS_EDIT,
    enforcement: EDIT_REPO_ENFORCEMENT,
    ...extra,
  }
}

function stoppedObservation(
  taskId: ReturnType<typeof asTaskId>,
  extra: Partial<TaskObservation>,
): TaskObservation {
  return {
    taskId,
    title: STOPPED_TITLE,
    headerMeta: STOPPED_META,
    statusRead: { kind: 'observed', status: 'cancelled' },
    conversation: stoppedConversation(),
    transcript: stoppedTaskTranscript(),
    detailsPane: null,
    repository: REPO_MAC,
    accessLevel: ACCESS_EDIT,
    enforcement: EDIT_REPO_ENFORCEMENT,
    ...extra,
  }
}

/** The failed task without an exit explanation (timed out, launch states). */
function failedTaskBase(
  taskId: ReturnType<typeof asTaskId>,
  extra?: Partial<TaskObservation>,
): TaskObservation {
  return {
    taskId,
    title: 'Migrate events.jsonl reader',
    headerMeta: RUNNING_META,
    statusRead: { kind: 'observed', status: 'failed' },
    elapsedSeconds: 468,
    exitObserved: true,
    conversation: failedConversation(),
    transcript: eventsReaderFailedTranscript(),
    detailsPane: null,
    repository: REPO_MCP,
    accessLevel: ACCESS_EDIT,
    enforcement: EDIT_REPO_ENFORCEMENT,
    ...extra,
  }
}

function failedObservation(
  taskId: ReturnType<typeof asTaskId>,
  extra?: Partial<TaskObservation>,
): TaskObservation {
  return failedTaskBase(taskId, { failure: FAILURE, ...extra })
}

function retryBudgetBase(
  taskId: ReturnType<typeof asTaskId>,
  extra: Partial<TaskObservation>,
): TaskObservation {
  return {
    taskId,
    title: 'Add retry budget to delivery queue',
    headerMeta: 'Claude · Opus 5.5 · HarflowWeb',
    statusRead: { kind: 'observed', status: 'completed' },
    elapsedSeconds: 1264,
    exitObserved: true,
    conversation: doneConversation(),
    transcript: retryBudgetDoneTranscript(),
    detailsPane: null,
    repository: REPO_WEB,
    accessLevel: ACCESS_EDIT,
    enforcement: EDIT_REPO_ENFORCEMENT,
    ...extra,
  }
}

export function taskStatusObservations(): readonly TaskObservation[] {
  return [
    runningObservation(TASK_STATUS_RUNNING_STOP_ID),
    runningObservation(TASK_STATUS_STOP_REQUESTED_ID),
    stoppedObservation(TASK_STATUS_CANCELLED_ID, {
      statusRead: { kind: 'observed', status: 'cancelled' },
      elapsedSeconds: 271,
      enforcement: UNRECORDED_ENFORCEMENT,
    }),
    failedTaskBase(TASK_STATUS_TIMED_OUT_ID, {
      statusRead: { kind: 'observed', status: 'timed_out' },
      elapsedSeconds: 760,
    }),
    retryBudgetBase(TASK_STATUS_SETTLING_ID, { settling: true }),
    failedObservation(TASK_STATUS_UNKNOWN_FAILED_ID, { exitObserved: false }),
    retryBudgetBase(TASK_STATUS_UNKNOWN_DONE_ID, { exitObserved: false }),
    runningObservation(TASK_STATUS_OWNER_LOST_ID, {
      supervision: 'owner_lost',
    }),
    runningObservation(TASK_STATUS_UNVERIFIED_ID, {
      supervision: 'unverified',
    }),
    failedObservation(TASK_STATUS_LAUNCH_UNKNOWN_ID),
    stoppedObservation(TASK_STATUS_STATUS_UNAVAILABLE_ID, {
      statusRead: { kind: 'unread' },
    }),
    {
      taskId: TASK_STATUS_PENDING_ID,
      title: PENDING_TITLE,
      headerMeta: PENDING_META,
      statusRead: { kind: 'observed', status: 'pending' },
      launchWait: 'resources',
      transcript: pendingEmptyTranscript(),
      detailsPane: null,
      repository: REPO_MCP,
      accessLevel: ACCESS_EDIT,
    },
    stoppedObservation(TASK_STATUS_TAKEN_OVER_ID, {
      statusRead: { kind: 'observed', status: 'taken_over' },
      elapsedSeconds: 271,
    }),
    failedObservation(TASK_STATUS_CONTINUE_STARTING_ID),
    runningObservation(TASK_STATUS_CONTINUE_STARTED_ID, { turnCount: 2 }),
    failedObservation(TASK_STATUS_FAILED_CONTINUE_ID),
  ]
}

/** Entries merged into taskLoadFor (excludes duplicate sidebar ids already in taskFixtures). */
export const TASK_STATUS_BY_ID: ReadonlyMap<string, TaskObservation> = new Map(
  taskStatusObservations()
    .filter(
      (observation) =>
        observation.taskId !== TASK_STATUS_RUNNING_STOP_ID &&
        observation.taskId !== TASK_STATUS_FAILED_CONTINUE_ID,
    )
    .map((observation) => [observation.taskId, observation] as const),
)