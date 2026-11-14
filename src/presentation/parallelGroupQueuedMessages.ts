import type {
  ParallelGroupLane,
  ParallelGroupQueuedDelivery,
  ParallelGroupQueuedMessage,
} from '../model'
import type { ParallelGroupQueuedOutcome } from './parallelGroupState'

/** Exact copy from Design 2153ab1 / states-parallel-lanes.js. */
export const QUEUED_MESSAGE_COPY = {
  captionQueued: 'Queued',
  captionUncertain: 'Delivery uncertain',
  deliveryInProgress: 'Delivery is in progress.',
  uncertainNote:
    'Delivery could not be confirmed. The message is not requeued.',
  cancelledOutcome: 'Queued message cancelled.',
} as const

/** Presentation view for one fenced queued message. */
export type QueuedMessageView = {
  readonly id: string
  readonly text: string
  readonly caption: string
  /** Derived from uncertain delivery; null otherwise. */
  readonly note: string | null
  readonly pinned: boolean
  readonly showCancel: boolean
  /** Accessible name identifying which message Cancel targets. */
  readonly cancelLabel: string
}

export type QueuedLaneTailView = {
  readonly messages: readonly QueuedMessageView[]
  /** Delivery-progress or cancelled-command outcome; null when none. */
  readonly outcome: string | null
}

function captionFor(delivery: ParallelGroupQueuedDelivery): string {
  if (delivery === 'uncertain') return QUEUED_MESSAGE_COPY.captionUncertain
  return QUEUED_MESSAGE_COPY.captionQueued
}

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
  return {
    id: message.id,
    text: message.text,
    caption: captionFor(message.delivery),
    note:
      message.delivery === 'uncertain' ? QUEUED_MESSAGE_COPY.uncertainNote : null,
    pinned: message.delivery !== 'uncertain',
    showCancel: message.delivery === 'queued',
    cancelLabel: `Cancel queued message: ${message.text}`,
  }
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
  const commandOutcome =
    queuedOutcome !== null &&
    queuedOutcome.laneId === lane.id &&
    lane.taskId !== null
      ? OUTCOME_COPY[queuedOutcome.kind]
      : null
  const delivering = fenced.some((message) => message.delivery === 'delivering')
  const outcome =
    commandOutcome ?? (delivering ? QUEUED_MESSAGE_COPY.deliveryInProgress : null)
  return { messages, outcome }
}

/** True when any lane shows an (unavailable) Cancel on a queued message. */
export function groupShowsQueuedCancel(
  lanes: readonly ParallelGroupLane[],
): boolean {
  return lanes.some((lane) =>
    queuedLaneTailView(lane, null).messages.some((message) => message.showCancel),
  )
}
