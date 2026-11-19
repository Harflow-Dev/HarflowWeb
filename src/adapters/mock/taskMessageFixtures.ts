/**
 * Task-screen queued-message fixtures (Design 7de89a4 task/message-*).
 * Bubble texts and ids match screens-messages.js; ledger fields follow
 * messaging.v1 / ctl-messaging-* specimens.
 */
import { asTaskId, type TaskId, type TaskMessage, type TaskObservation } from '../../model'
import {
  failedConversation,
  runningConversation,
} from './taskConversationFixtures'
import { EDIT_REPO_ENFORCEMENT } from './taskEnforcementFixtures'
import {
  eventsReaderFailedTranscript,
  slotReleaseTranscript,
} from './mappedTaskTranscripts'

/** Design screens-messages.js fixture prose. */
export const MSG_FIRST =
  'Once the fix is in, run the whole slots suite one more time.'
export const MSG_SECOND = 'Then summarise what changed in two sentences.'

export const MESSAGE_QUEUED_TASK_ID = asTaskId('task-message-queued')
export const MESSAGE_DELIVERING_TASK_ID = asTaskId('task-message-delivering')
export const MESSAGE_DELIVERED_TASK_ID = asTaskId('task-message-delivered')
export const MESSAGE_CANCELLED_TASK_ID = asTaskId('task-message-cancelled')
export const MESSAGE_SEND_NOW_REFUSED_TASK_ID = asTaskId(
  'task-message-send-now-refused',
)
export const MESSAGE_UNCERTAIN_TASK_ID = asTaskId('task-message-uncertain')
export const MESSAGE_UNSUPPORTED_TASK_ID = asTaskId('task-message-unsupported')
export const MESSAGE_QUEUED_SETTLED_TASK_ID = asTaskId(
  'task-message-queued-settled',
)

const ACCESS_EDIT = 'edit_repo' as const
const REPO_MCP = {
  name: 'HarflowMCP',
  path: '~/Code/Harflow/HarflowMCP',
} as const

/** Retained terminal record: metadata only, no text. */
function retained(
  taskId: TaskId,
  id: string,
  seq: number,
  status: 'delivered' | 'cancelled',
): TaskMessage {
  return {
    id,
    seq,
    status,
    delivery: 'queue',
    target: { kind: 'task', taskId },
  }
}

function queued(
  taskId: TaskId,
  id: string,
  seq: number,
  text: string,
  delivery: TaskMessage['delivery'] = 'queue',
): TaskMessage {
  return {
    id,
    seq,
    status: 'queued',
    delivery,
    queuedAt: '2026-10-15T00:00:01+00:00',
    text,
    target: { kind: 'task', taskId },
  }
}

function runningBase(
  taskId: TaskId,
  messages: readonly TaskMessage[],
): TaskObservation {
  return {
    taskId,
    title: 'Fix flaky slot release test',
    headerMeta: 'Claude · Opus 5.5 · HarflowMCP',
    statusRead: { kind: 'observed', status: 'running' },
    elapsedSeconds: 252,
    conversation: runningConversation(),
    transcript: slotReleaseTranscript(),
    detailsPane: null,
    repository: REPO_MCP,
    accessLevel: ACCESS_EDIT,
    enforcement: EDIT_REPO_ENFORCEMENT,
    messages,
  }
}

function failedBase(
  taskId: TaskId,
  messages: readonly TaskMessage[],
): TaskObservation {
  return {
    taskId,
    title: 'Migrate events.jsonl reader',
    headerMeta: 'Claude · Opus 5.5 · HarflowMCP',
    statusRead: { kind: 'observed', status: 'failed' },
    elapsedSeconds: 468,
    exitObserved: true,
    conversation: failedConversation(),
    failure: {
      title: 'Task failed: the harness exited with code 1',
      intro: 'The last error was:',
      lastError:
        'json.decoder.JSONDecodeError: Unterminated string starting at: line 1 column 38',
    },
    transcript: eventsReaderFailedTranscript(),
    detailsPane: null,
    repository: REPO_MCP,
    accessLevel: ACCESS_EDIT,
    enforcement: EDIT_REPO_ENFORCEMENT,
    messages,
  }
}

export function messageQueuedObservation(): TaskObservation {
  return runningBase(MESSAGE_QUEUED_TASK_ID, [
    queued(MESSAGE_QUEUED_TASK_ID, 'a', 1, MSG_FIRST),
    queued(MESSAGE_QUEUED_TASK_ID, 'b', 2, MSG_SECOND),
  ])
}

/** Claimed by a dispatch; with a `reason` the delivery is uncertain. */
function delivering(
  taskId: TaskId,
  id: string,
  seq: number,
  reason?: string,
): TaskMessage {
  return {
    id,
    seq,
    status: 'delivering',
    delivery: 'queue',
    queuedAt: '2026-10-15T00:00:01+00:00',
    text: MSG_FIRST,
    ...(reason !== undefined ? { reason } : {}),
    target: { kind: 'task', taskId },
  }
}

export function messageDeliveringObservation(): TaskObservation {
  return runningBase(MESSAGE_DELIVERING_TASK_ID, [
    delivering(MESSAGE_DELIVERING_TASK_ID, 'a', 1),
  ])
}

/** The "Message delivered." outcome is seeded as session chrome, not read here. */
export function messageDeliveredObservation(): TaskObservation {
  return runningBase(MESSAGE_DELIVERED_TASK_ID, [
    retained(MESSAGE_DELIVERED_TASK_ID, 'a', 1, 'delivered'),
  ])
}

/** The "Queued message cancelled." outcome is seeded as session chrome. */
export function messageCancelledObservation(): TaskObservation {
  return runningBase(MESSAGE_CANCELLED_TASK_ID, [
    queued(MESSAGE_CANCELLED_TASK_ID, 'b', 2, MSG_SECOND),
    retained(MESSAGE_CANCELLED_TASK_ID, 'a', 1, 'cancelled'),
  ])
}

/**
 * The refusal belongs to the send acknowledgement (ctl-messaging-queued.json
 * `result.refusal`), so the scenario seeds it as session chrome; the ledger
 * record is a plain queued entry.
 */
export const SEND_NOW_REFUSAL = {
  code: 'interrupt_unsupported',
  message: 'Message stays queued: safe interruption is unsupported.',
} as const

export function messageSendNowRefusedObservation(): TaskObservation {
  return runningBase(MESSAGE_SEND_NOW_REFUSED_TASK_ID, [
    queued(MESSAGE_SEND_NOW_REFUSED_TASK_ID, 'a', 1, MSG_FIRST, 'now'),
  ])
}

export function messageUncertainObservation(): TaskObservation {
  return runningBase(MESSAGE_UNCERTAIN_TASK_ID, [
    delivering(
      MESSAGE_UNCERTAIN_TASK_ID,
      'a',
      1,
      'Delivery is uncertain; inspect the continuation before resending',
    ),
  ])
}

export function messageUnsupportedObservation(): TaskObservation {
  return runningBase(MESSAGE_UNSUPPORTED_TASK_ID, [])
}

export function messageQueuedSettledObservation(): TaskObservation {
  return failedBase(MESSAGE_QUEUED_SETTLED_TASK_ID, [
    queued(MESSAGE_QUEUED_SETTLED_TASK_ID, 'a', 1, MSG_FIRST),
    queued(MESSAGE_QUEUED_SETTLED_TASK_ID, 'b', 2, MSG_SECOND),
  ])
}

export const TASK_MESSAGES_BY_ID: ReadonlyMap<string, TaskObservation> = new Map(
  [
    messageQueuedObservation(),
    messageDeliveringObservation(),
    messageDeliveredObservation(),
    messageCancelledObservation(),
    messageSendNowRefusedObservation(),
    messageUncertainObservation(),
    messageUnsupportedObservation(),
    messageQueuedSettledObservation(),
  ].map((observation) => [observation.taskId, observation] as const),
)
