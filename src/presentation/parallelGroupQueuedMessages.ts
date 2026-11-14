import type {
  ParallelGroupLane,
  ParallelGroupQueuedDelivery,
  ParallelGroupQueuedMessage,
} from '../model'

/** Exact copy from Design 2153ab1 / states-parallel-lanes.js. */
export const QUEUED_MESSAGE_COPY = {
  captionQueued: 'Queued',
  captionUncertain: 'Delivery uncertain',
  deliveryInProgress: 'Delivery is in progress.',
  uncertainNote:
    'Delivery could not be confirmed. The message is not requeued.',
  cancelledOutcome: 'Queued message cancelled.',
  cancelUnavailable:
    'Unavailable. Cancel does not remove queued messages in this mock.',
} as const

export const QUEUED_MESSAGE_FIRST =
  'Once the fix is in, run the whole slots suite one more time.'
export const QUEUED_MESSAGE_SECOND =
  'Then summarise what changed in two sentences.'

/** Presentation view for one fenced queued message. */
export type QueuedMessageView = {
  readonly id: string
  readonly text: string
  readonly caption: string
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
    note: message.note,
    pinned: message.delivery !== 'uncertain',
    showCancel: message.delivery === 'queued',
    cancelLabel: `Cancel queued message: ${message.text}`,
  }
}

/**
 * Tail below live activity: fenced bubbles plus derived or seeded outcome.
 * `cancelledOutcome` is session/command state, not an observation fact.
 */
export function queuedLaneTailView(
  lane: ParallelGroupLane,
  cancelledOutcome: string | null,
): QueuedLaneTailView {
  const messages = fencedQueuedMessages(lane).map(messageView)
  const delivering = fencedQueuedMessages(lane).some(
    (message) => message.delivery === 'delivering',
  )
  const outcome = cancelledOutcome
    ? cancelledOutcome
    : delivering
      ? QUEUED_MESSAGE_COPY.deliveryInProgress
      : null
  return { messages, outcome }
}
