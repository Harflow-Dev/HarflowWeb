import type { TaskId } from './ids'

/**
 * Task status `messages` ledger (messaging.v1).
 * Field names follow HarflowMCP contracts.md / ctl-messaging-* fixtures.
 */

export type TaskMessageStatus =
  | 'queued'
  | 'delivering'
  | 'delivered'
  | 'cancelled'

export type TaskMessageDelivery = 'queue' | 'now'

/** Target of a task-ledger message (standalone task). */
export type TaskMessageTarget = {
  readonly kind: 'task'
  readonly taskId: TaskId
}

/** Send-now refusal carried on an accepted queued response. */
export type TaskMessageRefusal = {
  readonly code: string
  readonly message: string
}

/**
 * One messages-ledger record.
 * Delivered and cancelled records retain metadata only (no text).
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
  readonly refusal?: TaskMessageRefusal
}
