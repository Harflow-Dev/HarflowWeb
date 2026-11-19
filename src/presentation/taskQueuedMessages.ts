import type {
  MessageSendRefusal,
  TaskMessage,
  TaskObservation,
} from '../model'
import {
  QUEUED_MESSAGE_COPY,
  partitionQueuedMessages,
  queuedMessageView,
  type QueuedMessageDrawFacts,
  type QueuedMessageView,
  type QueuedMessagesTailView,
} from './queuedMessages'

/**
 * Transient result of a message command, held in session chrome. The status
 * `messages` ledger offers no event-level outcome, so the mock seeds these.
 */
export type TaskMessagingOutcome = 'cancelled' | 'delivered'

/** Send-now refusal of one message (send acknowledgement, not the ledger). */
export type TaskSendNowRefusal = {
  readonly messageId: string
  readonly refusal: MessageSendRefusal
}

export type TaskMessagingChrome = {
  /** Message ids removed by Cancel in this session (mock mutation). */
  readonly removedIds: readonly string[]
  /** Last command outcome; null when none. */
  readonly outcome: TaskMessagingOutcome | null
  /** Refusals from Send now acknowledgements, keyed by message id. */
  readonly refusals: readonly TaskSendNowRefusal[]
  /** Bumped on Cancel so the outcome line can take focus. */
  readonly focusSeq: number
}

export const EMPTY_TASK_MESSAGING: TaskMessagingChrome = {
  removedIds: [],
  outcome: null,
  refusals: [],
  focusSeq: 0,
}

const INTERRUPT_UNSUPPORTED = 'interrupt_unsupported'

const OUTCOME_COPY: Record<TaskMessagingOutcome, string> = {
  cancelled: QUEUED_MESSAGE_COPY.cancelledOutcome,
  delivered: QUEUED_MESSAGE_COPY.messageDelivered,
}

/**
 * Ledger records of the shown task, in send order. Records that name another
 * task are ignored (as Parallel lanes fence their messages).
 */
export function taskLedger(
  observation: TaskObservation,
): readonly TaskMessage[] {
  return (observation.messages ?? [])
    .filter(
      (message) =>
        message.target === undefined ||
        message.target.taskId === observation.taskId,
    )
    .toSorted((a, b) => a.seq - b.seq)
}

/**
 * Map one ledger record to draw facts, or null when no bubble is drawn:
 * delivered and cancelled keep metadata only; `undeliverable` is undesigned
 * on the task screen; a record without text cannot render.
 */
export function taskMessageDrawFacts(
  message: TaskMessage,
  refusal?: MessageSendRefusal,
): QueuedMessageDrawFacts | null {
  switch (message.status) {
    case 'delivered':
    case 'cancelled':
    case 'undeliverable':
      return null
    case 'queued': {
      if (message.text === undefined || message.text === '') return null
      return {
        id: message.id,
        text: message.text,
        kind: 'queued',
        interruptUnsupported: refusal?.code === INTERRUPT_UNSUPPORTED,
      }
    }
    case 'delivering': {
      if (message.text === undefined || message.text === '') return null
      // A reason means uncertain (not requeued); otherwise claimed.
      const uncertain = message.reason !== undefined && message.reason !== ''
      return {
        id: message.id,
        text: message.text,
        kind: uncertain ? 'uncertain' : 'delivering',
      }
    }
    default: {
      const unreachable: never = message.status
      return unreachable
    }
  }
}

export function taskMessageView(
  message: TaskMessage,
  refusal?: MessageSendRefusal,
): QueuedMessageView | null {
  const facts = taskMessageDrawFacts(message, refusal)
  return facts === null ? null : queuedMessageView(facts)
}

function visibleLedger(
  observation: TaskObservation,
  removedIds: readonly string[],
): readonly TaskMessage[] {
  const ledger = taskLedger(observation)
  if (removedIds.length === 0) return ledger
  const removed = new Set(removedIds)
  return ledger.filter((message) => !removed.has(message.id))
}

/**
 * Outcome line: a transient command outcome wins; otherwise "Delivery is in
 * progress." is derived from a delivering ledger record (not uncertain).
 * Retained terminal records never produce an outcome.
 */
function outcomeFor(
  ledger: readonly TaskMessage[],
  chrome: TaskMessagingChrome,
): string | null {
  if (chrome.outcome !== null) return OUTCOME_COPY[chrome.outcome]
  const delivering = ledger.some(
    (message) =>
      message.status === 'delivering' &&
      (message.reason === undefined || message.reason === ''),
  )
  return delivering ? QUEUED_MESSAGE_COPY.deliveryInProgress : null
}

/**
 * Bubbles and outcome for the task screen messages ledger.
 * Ordering: settled before the live working row; pinned after; each group in
 * send order (`seq`). `messages` lists settled first, then pinned.
 */
export function taskQueuedTailView(
  observation: TaskObservation,
  chrome: TaskMessagingChrome = EMPTY_TASK_MESSAGING,
): QueuedMessagesTailView {
  const ledger = visibleLedger(observation, chrome.removedIds)
  const refusalFor = (id: string): MessageSendRefusal | undefined =>
    chrome.refusals.find((entry) => entry.messageId === id)?.refusal
  const drawn = ledger
    .map((message) => taskMessageView(message, refusalFor(message.id)))
    .filter((view): view is QueuedMessageView => view !== null)
  const { settled, pinned } = partitionQueuedMessages(drawn)
  return {
    messages: [...settled, ...pinned],
    settled,
    pinned,
    outcome: outcomeFor(ledger, chrome),
  }
}
