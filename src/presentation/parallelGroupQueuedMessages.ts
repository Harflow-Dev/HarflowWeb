import type {
  ParallelGroupLane,
  ParallelGroupQueuedMessage,
} from '../model'
import type { ParallelGroupQueuedOutcome } from './parallelGroupState'
import {
  QUEUED_MESSAGE_COPY,
  partitionQueuedMessages,
  queuedMessageView,
  type QueuedMessageView,
  type QueuedMessagesTailView,
} from './queuedMessages'

export { QUEUED_MESSAGE_COPY, type QueuedMessageView }
export type QueuedLaneTailView = QueuedMessagesTailView

/**
 * Messages that belong to this lane's task. Mismatched task ids are rejected.
 */
export function fencedQueuedMessages(
  lane: ParallelGroupLane,
): readonly ParallelGroupQueuedMessage[] {
  if (lane.taskId === null) return []
  const taskId = lane.taskId
  return lane.queuedMessages.filter((message) => message.taskId === taskId)
}

function messageView(message: ParallelGroupQueuedMessage): QueuedMessageView {
  return queuedMessageView({
    id: message.id,
    text: message.text,
    kind: message.delivery,
  })
}

const OUTCOME_COPY: Record<ParallelGroupQueuedOutcome['kind'], string> = {
  cancelled: QUEUED_MESSAGE_COPY.cancelledOutcome,
}

/**
 * Tail below live activity: fenced bubbles plus derived or seeded outcome.
 * `queuedOutcome` is session/command state, not an observation fact; it
 * applies only to the lane it names (a lane with a task), even when the
 * cancelled message was the last one in its queue.
 */
export function queuedLaneTailView(
  lane: ParallelGroupLane,
  queuedOutcome: ParallelGroupQueuedOutcome | null,
): QueuedLaneTailView {
  const fenced = fencedQueuedMessages(lane)
  const messages = fenced.map(messageView)
  const { settled, pinned } = partitionQueuedMessages(messages)
  const commandOutcome =
    queuedOutcome !== null &&
    queuedOutcome.laneId === lane.id &&
    lane.taskId !== null
      ? OUTCOME_COPY[queuedOutcome.kind]
      : null
  const delivering = fenced.some((message) => message.delivery === 'delivering')
  const outcome =
    commandOutcome ?? (delivering ? QUEUED_MESSAGE_COPY.deliveryInProgress : null)
  return { messages, settled, pinned, outcome }
}

/** True when any lane shows an (unavailable) Cancel on a queued message. */
export function groupShowsQueuedCancel(
  lanes: readonly ParallelGroupLane[],
): boolean {
  return lanes.some((lane) =>
    queuedLaneTailView(lane, null).messages.some((message) => message.showCancel),
  )
}
