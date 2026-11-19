import type { TaskMessage, TaskObservation } from '../model'
import {
  QUEUED_MESSAGE_COPY,
  partitionQueuedMessages,
  queuedMessageView,
  type QueuedMessageDrawFacts,
  type QueuedMessageView,
  type QueuedMessagesTailView,
} from './queuedMessages'

export type TaskMessagingCancelChrome = {
  /** Message ids removed by Cancel in this session (mock mutation). */
  readonly removedIds: readonly string[]
  /** Set after Cancel; also derived from a cancelled ledger record. */
  readonly cancelled: boolean
  /** Bumped on Cancel so the outcome line can take focus. */
  readonly focusSeq: number
}

export const EMPTY_MESSAGING_CANCEL: TaskMessagingCancelChrome = {
  removedIds: [],
  cancelled: false,
  focusSeq: 0,
}

const INTERRUPT_UNSUPPORTED = 'interrupt_unsupported'

/**
 * Map one ledger record to draw facts, or null when no bubble is drawn
 * (delivered/cancelled keep metadata only; missing text cannot render).
 */
export function taskMessageDrawFacts(
  message: TaskMessage,
): QueuedMessageDrawFacts | null {
  if (message.status === 'delivered' || message.status === 'cancelled') {
    return null
  }
  const text = message.text
  if (text === undefined || text === '') return null

  if (message.status === 'queued') {
    return {
      id: message.id,
      text,
      kind: 'queued',
      interruptUnsupported: message.refusal?.code === INTERRUPT_UNSUPPORTED,
    }
  }

  // delivering: a reason means uncertain (not requeued); otherwise claimed.
  if (message.reason !== undefined && message.reason !== '') {
    return { id: message.id, text, kind: 'uncertain' }
  }
  return { id: message.id, text, kind: 'delivering' }
}

export function taskMessageView(message: TaskMessage): QueuedMessageView | null {
  const facts = taskMessageDrawFacts(message)
  return facts === null ? null : queuedMessageView(facts)
}

function visibleLedger(
  messages: readonly TaskMessage[],
  removedIds: readonly string[],
): readonly TaskMessage[] {
  if (removedIds.length === 0) return messages
  const removed = new Set(removedIds)
  return messages.filter((message) => !removed.has(message.id))
}

function outcomeFor(
  ledger: readonly TaskMessage[],
  chrome: TaskMessagingCancelChrome,
): string | null {
  if (chrome.cancelled) return QUEUED_MESSAGE_COPY.cancelledOutcome
  const hasDelivering = ledger.some(
    (message) =>
      message.status === 'delivering' &&
      (message.reason === undefined || message.reason === ''),
  )
  if (hasDelivering) return QUEUED_MESSAGE_COPY.deliveryInProgress
  if (ledger.some((message) => message.status === 'delivered')) {
    return QUEUED_MESSAGE_COPY.messageDelivered
  }
  if (ledger.some((message) => message.status === 'cancelled')) {
    return QUEUED_MESSAGE_COPY.cancelledOutcome
  }
  return null
}

/**
 * Bubbles and outcome for the task screen messages ledger.
 * Ordering: settled before the live working row; pinned after, by send order.
 */
export function taskQueuedTailView(
  observation: TaskObservation,
  chrome: TaskMessagingCancelChrome = EMPTY_MESSAGING_CANCEL,
): QueuedMessagesTailView {
  const ledger = visibleLedger(observation.messages ?? [], chrome.removedIds)
  const messages = ledger
    .map(taskMessageView)
    .filter((view): view is QueuedMessageView => view !== null)
  const { settled, pinned } = partitionQueuedMessages(messages)
  return {
    messages,
    settled,
    pinned,
    outcome: outcomeFor(ledger, chrome),
  }
}

/** True when the engine reports messaging.v1. */
export function taskMessagingSupported(observation: TaskObservation): boolean {
  return observation.messagingV1 === true
}
