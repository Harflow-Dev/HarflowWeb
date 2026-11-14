import {
  asParallelGroupId,
  type ParallelGroupId,
  type ParallelGroupObservation,
  type ParallelGroupQueuedMessage,
} from '../../model'
import { PRELOAD_TASK_ID } from './taskFixtures'

/** Design 2153ab1 queued follow-up texts (states-parallel-lanes.js). */
const QUEUE_FIRST =
  'Once the fix is in, run the whole slots suite one more time.'
const QUEUE_SECOND = 'Then summarise what changed in two sentences.'
const QUEUE_UNCERTAIN_NOTE =
  'Delivery could not be confirmed. The message is not requeued.'

export const MESSAGES_QUEUED_PARALLEL_GROUP_ID = asParallelGroupId(
  'parallel-group-lane-messages-queued',
)
export const MESSAGE_DELIVERING_PARALLEL_GROUP_ID = asParallelGroupId(
  'parallel-group-lane-message-delivering',
)
export const MESSAGE_UNCERTAIN_PARALLEL_GROUP_ID = asParallelGroupId(
  'parallel-group-lane-message-uncertain',
)
export const MESSAGE_CANCELLED_PARALLEL_GROUP_ID = asParallelGroupId(
  'parallel-group-lane-message-cancelled',
)

type QueuedBuilder = (
  groupId: ParallelGroupId,
  messages: readonly ParallelGroupQueuedMessage[],
) => ParallelGroupObservation

function msg(
  partial: ParallelGroupQueuedMessage,
): ParallelGroupQueuedMessage {
  return partial
}

function twoQueued(build: QueuedBuilder): ParallelGroupObservation {
  return build(MESSAGES_QUEUED_PARALLEL_GROUP_ID, [
    msg({
      id: 'msg-queue-1',
      taskId: PRELOAD_TASK_ID,
      text: QUEUE_FIRST,
      delivery: 'queued',
      note: null,
    }),
    msg({
      id: 'msg-queue-2',
      taskId: PRELOAD_TASK_ID,
      text: QUEUE_SECOND,
      delivery: 'queued',
      note: null,
    }),
  ])
}

function delivering(build: QueuedBuilder): ParallelGroupObservation {
  return build(MESSAGE_DELIVERING_PARALLEL_GROUP_ID, [
    msg({
      id: 'msg-queue-1',
      taskId: PRELOAD_TASK_ID,
      text: QUEUE_FIRST,
      delivery: 'delivering',
      note: null,
    }),
  ])
}

function uncertain(build: QueuedBuilder): ParallelGroupObservation {
  return build(MESSAGE_UNCERTAIN_PARALLEL_GROUP_ID, [
    msg({
      id: 'msg-queue-1',
      taskId: PRELOAD_TASK_ID,
      text: QUEUE_FIRST,
      delivery: 'uncertain',
      note: QUEUE_UNCERTAIN_NOTE,
    }),
  ])
}

function cancelled(build: QueuedBuilder): ParallelGroupObservation {
  return build(MESSAGE_CANCELLED_PARALLEL_GROUP_ID, [
    msg({
      id: 'msg-queue-2',
      taskId: PRELOAD_TASK_ID,
      text: QUEUE_SECOND,
      delivery: 'queued',
      note: null,
    }),
  ])
}

/**
 * Builds the four queued-message Parallel group observations.
 * The titled-lane assembler lives in parallelGroupFixtures to avoid a cycle.
 */
export function defineQueuedParallelGroups(
  titledGroupWithQueuedMessages: QueuedBuilder,
): ReadonlyMap<ParallelGroupId, ParallelGroupObservation> {
  const build = titledGroupWithQueuedMessages
  return new Map([
    [MESSAGES_QUEUED_PARALLEL_GROUP_ID, twoQueued(build)],
    [MESSAGE_DELIVERING_PARALLEL_GROUP_ID, delivering(build)],
    [MESSAGE_UNCERTAIN_PARALLEL_GROUP_ID, uncertain(build)],
    [MESSAGE_CANCELLED_PARALLEL_GROUP_ID, cancelled(build)],
  ])
}
