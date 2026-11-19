/**
 * Shared queued-message presentation for Parallel lanes and the task screen.
 * Copy matches Design 2153ab1 / 7de89a4 messages-screen states.
 */

export const QUEUED_MESSAGE_COPY = {
  captionQueued: 'Queued',
  captionUncertain: 'Delivery uncertain',
  deliveryInProgress: 'Delivery is in progress.',
  messageDelivered: 'Message delivered.',
  uncertainNote:
    'Delivery could not be confirmed. The message is not requeued.',
  cancelledOutcome: 'Queued message cancelled.',
  sendNowRefusedNote:
    "Send now isn't available. This operation can't be interrupted safely.",
  sendNowTitle:
    'Ask for immediate delivery; an engine refusal keeps the message queued',
  sendNowLabel: 'Send now',
} as const

/** Drawn bubble kinds (delivered/cancelled keep no bubble text). */
export type QueuedMessageKind = 'queued' | 'delivering' | 'uncertain'

/** Presentation view for one fenced queued message bubble. */
export type QueuedMessageView = {
  readonly id: string
  readonly text: string
  readonly caption: string
  /** Refusal or uncertain note; null when none. */
  readonly note: string | null
  readonly pinned: boolean
  readonly showCancel: boolean
  /** Accessible name identifying which message Cancel targets. */
  readonly cancelLabel: string
}

export type QueuedMessagesTailView = {
  readonly messages: readonly QueuedMessageView[]
  /** Settled (non-pinned) bubbles — place before the live working row. */
  readonly settled: readonly QueuedMessageView[]
  /** Pinned bubbles — place after the live activity, in send order. */
  readonly pinned: readonly QueuedMessageView[]
  /** Delivery-progress, delivered, or cancelled outcome; null when none. */
  readonly outcome: string | null
}

/** Facts the shared mapper needs; Parallel and task ledgers both reduce to this. */
export type QueuedMessageDrawFacts = {
  readonly id: string
  readonly text: string
  readonly kind: QueuedMessageKind
  /** When true, attach the interrupt_unsupported refusal note. */
  readonly interruptUnsupported?: boolean
}

export function queuedMessageView(facts: QueuedMessageDrawFacts): QueuedMessageView {
  const uncertain = facts.kind === 'uncertain'
  const note = uncertain
    ? QUEUED_MESSAGE_COPY.uncertainNote
    : facts.interruptUnsupported
      ? QUEUED_MESSAGE_COPY.sendNowRefusedNote
      : null
  return {
    id: facts.id,
    text: facts.text,
    caption: uncertain
      ? QUEUED_MESSAGE_COPY.captionUncertain
      : QUEUED_MESSAGE_COPY.captionQueued,
    note,
    pinned: !uncertain,
    showCancel: facts.kind === 'queued',
    cancelLabel: `Cancel queued message: ${facts.text}`,
  }
}

export function partitionQueuedMessages(
  messages: readonly QueuedMessageView[],
): Pick<QueuedMessagesTailView, 'settled' | 'pinned'> {
  return {
    settled: messages.filter((message) => !message.pinned),
    pinned: messages.filter((message) => message.pinned),
  }
}
