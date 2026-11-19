import type { TaskId } from './ids'

/**
 * Task status `messages` ledger (messaging.v1).
 * Field names follow HarflowMCP contracts.md / ctl-messaging-* fixtures.
 */

export type TaskMessageStatus =
  | 'queued'
  | 'delivering'
  | 'delivered'
  | 'undeliverable'
  | 'cancelled'

/**
 * Engine handshake capability `messaging.v1`, observed at engine level (not a
 * task field). Mirrors the pending-launch capability load.
 */
export type MessagingCapabilityLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly supported: boolean }

export type TaskMessageDelivery = 'queue' | 'now'

/** Target of a task-ledger message (standalone task). */
export type TaskMessageTarget = {
  readonly kind: 'task'
  readonly taskId: TaskId
}

/**
 * `refusal` of a send acknowledgement (ctl-messaging-queued.json
 * `result.refusal`). It is a command outcome, never a status `messages`
 * ledger field.
 */
export type MessageSendRefusal = {
  readonly code: string
  readonly message: string
}

/**
 * One messages-ledger record.
 * Delivered and cancelled records retain metadata only (no text).
 * `undeliverable` is listed by the contract (superseded entries).
 * Uncertain delivery stays `delivering` with a `reason` — no invented status.
 */
export type TaskMessage = {
  readonly id: string
  readonly seq: number
  readonly status: TaskMessageStatus
  readonly delivery: TaskMessageDelivery
  readonly queuedAt?: string
  readonly text?: string
  readonly reason?: string
  readonly target?: TaskMessageTarget
}
