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

function msg(partial: TaskMessage): TaskMessage {
  return partial
}

function queued(id: string, seq: number, text: string, extra?: Partial<TaskMessage>): TaskMessage {
  return msg({
    id,
    seq,
    status: 'queued',
    delivery: 'queue',
    queuedAt: '2026-10-15T00:00:01+00:00',
    text,
    target: { kind: 'task', taskId: asTaskId('task-message-host') },
    ...extra,
  })
}

function runningBase(
  taskId: TaskId,
  messages: readonly TaskMessage[],
  messagingV1 = true,
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
    messagingV1,
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
    messagingV1: true,
    messages,
  }
}

export function messageQueuedObservation(): TaskObservation {
  return runningBase(MESSAGE_QUEUED_TASK_ID, [
    queued('a', 1, MSG_FIRST),
    queued('b', 2, MSG_SECOND),
  ])
}

export function messageDeliveringObservation(): TaskObservation {
  return runningBase(MESSAGE_DELIVERING_TASK_ID, [
    msg({
      id: 'a',
      seq: 1,
      status: 'delivering',
      delivery: 'queue',
      queuedAt: '2026-10-15T00:00:01+00:00',
      text: MSG_FIRST,
      target: { kind: 'task', taskId: MESSAGE_DELIVERING_TASK_ID },
    }),
  ])
}

export function messageDeliveredObservation(): TaskObservation {
  return runningBase(MESSAGE_DELIVERED_TASK_ID, [
    msg({
      id: 'a',
      seq: 1,
      status: 'delivered',
      delivery: 'queue',
      target: { kind: 'task', taskId: MESSAGE_DELIVERED_TASK_ID },
    }),
  ])
}

export function messageCancelledObservation(): TaskObservation {
  return runningBase(MESSAGE_CANCELLED_TASK_ID, [
    queued('b', 2, MSG_SECOND),
    msg({
      id: 'a',
      seq: 1,
      status: 'cancelled',
      delivery: 'queue',
      target: { kind: 'task', taskId: MESSAGE_CANCELLED_TASK_ID },
    }),
  ])
}

export function messageSendNowRefusedObservation(): TaskObservation {
  return runningBase(MESSAGE_SEND_NOW_REFUSED_TASK_ID, [
    queued('a', 1, MSG_FIRST, {
      delivery: 'now',
      refusal: {
        code: 'interrupt_unsupported',
        message:
          'Message stays queued: safe interruption is unsupported.',
      },
    }),
  ])
}

export function messageUncertainObservation(): TaskObservation {
  return runningBase(MESSAGE_UNCERTAIN_TASK_ID, [
    msg({
      id: 'a',
      seq: 1,
      status: 'delivering',
      delivery: 'queue',
      queuedAt: '2026-10-15T00:00:01+00:00',
      text: MSG_FIRST,
      reason: 'Delivery is uncertain; inspect the continuation before resending',
      target: { kind: 'task', taskId: MESSAGE_UNCERTAIN_TASK_ID },
    }),
  ])
}

export function messageUnsupportedObservation(): TaskObservation {
  return runningBase(MESSAGE_UNSUPPORTED_TASK_ID, [], false)
}

export function messageQueuedSettledObservation(): TaskObservation {
  return failedBase(MESSAGE_QUEUED_SETTLED_TASK_ID, [
    queued('a', 1, MSG_FIRST, {
      target: { kind: 'task', taskId: MESSAGE_QUEUED_SETTLED_TASK_ID },
    }),
    queued('b', 2, MSG_SECOND, {
      target: { kind: 'task', taskId: MESSAGE_QUEUED_SETTLED_TASK_ID },
    }),
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
