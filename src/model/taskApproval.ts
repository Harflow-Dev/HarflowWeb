/**
 * Task approval ledger row and respond-acknowledgement refusal.
 * Field names follow HarflowMCP contracts.md / ctl-approval-* fixtures.
 * Typed refusals exist only on the respond acknowledgement — never on the
 * ledger row (same pattern as messaging send-now refusals).
 */

/** Disposition of one approval request row. */
export type ApprovalDisposition =
  | 'pending'
  | 'decided'
  | 'expired'
  | 'cancelled'
  | 'invalidated'

/** Delivery fact for one approval request row. */
export type ApprovalDelivery =
  | 'pending'
  | 'reserved'
  | 'sending'
  | 'sent'
  | 'delivery_unknown'

/** Human or effective decision value. */
export type ApprovalDecision = 'approve' | 'reject'

/** Who recorded a human decision (`decided_by`). */
export type ApprovalDecidedBy = 'caller' | 'harflow'

/** Channel that supplied a human answer (`responder`). */
export type ApprovalResponder = 'caller' | 'monitor'

/**
 * Known `error.data.reason` values on an `approval_error` respond
 * acknowledgement. Missing or unknown reasons are non-actionable.
 */
export type ApprovalRefusalReason =
  | 'not_current'
  | 'already_answered'
  | 'settled'
  | 'expired'
  | 'ownership_lost'
  | 'unauthorized'
  | 'unsupported'
  | 'caller_undecidable'
  | 'incomplete'

/**
 * `error.data.interaction` on already_answered / settled refusals.
 */
export type ApprovalRefusalInteraction = {
  readonly answeredBy: ApprovalResponder
  readonly answer: ApprovalDecision
  readonly answeredAt: number
}

/**
 * Typed refusal of a respond acknowledgement (`error.code: "approval_error"`).
 * Held in session chrome keyed by request id — not a ledger field.
 */
export type ApprovalRespondRefusal = {
  /** Absent or unrecognised → non-actionable refresh-only card. */
  readonly reason?: string
  readonly interaction?: ApprovalRefusalInteraction
}

/**
 * Outcome of a respond call. `unknown` means the call threw or timed out
 * after submission: the result is uncertain and must never be resubmitted.
 */
export type ApprovalRespondOutcome =
  | { readonly kind: 'accepted'; readonly request: TaskApprovalRequest }
  | { readonly kind: 'refused'; readonly refusal: ApprovalRespondRefusal }
  | { readonly kind: 'unknown' }

/**
 * Outcome of a read-only refresh: the re-read row, no such row, or a failed
 * read (which learns nothing).
 */
export type ApprovalRefreshResult =
  | { readonly kind: 'row'; readonly request: TaskApprovalRequest }
  | { readonly kind: 'absent' }
  | { readonly kind: 'failed' }

/**
 * One ledger request row (ctl approval projection).
 * `action` is the exact command (or equivalent) for Bash-style tools.
 */
export type TaskApprovalRequest = {
  readonly requestId: string
  readonly ownerRevision: number
  readonly actionDigest: string
  readonly disposition: ApprovalDisposition
  readonly delivery: ApprovalDelivery
  readonly decision: ApprovalDecision | null
  readonly decidedBy?: ApprovalDecidedBy
  readonly responder?: ApprovalResponder
  /** Unix seconds (fixture clocks are UTC). */
  readonly decidedAt?: number
  readonly effectiveDecision: ApprovalDecision | null
  readonly deliveredDecision: ApprovalDecision | null
  readonly expiryRejection: boolean
  readonly executionOutcome: string
  readonly scope: string
  readonly toolName: string
  /** Exact action string shown in the card command block. */
  readonly action: string
  readonly cwd: string
  readonly decisionReason: string | null
}

/**
 * Additive status `approval_summary` fields this slice reads.
 * `awaiting_decision_count` counts rows still needing a human decision.
 */
export type TaskApprovalSummary = {
  readonly awaitingDecisionCount: number
}

/** Parameters for a respond call through EnginePort. */
export type RespondTaskApprovalRequest = {
  readonly taskId: string
  readonly requestId: string
  readonly decision: ApprovalDecision
  readonly ownerRevision: number
  readonly actionDigest: string
}

/**
 * True when the row still needs a human decision: disposition and delivery
 * are both pending, no human decision exists, and it was not rejected by the
 * system (`expiry_rejection` or `decided_by: harflow`). Mirrors the ctl
 * `awaiting_decision_count` definition.
 */
export function isAwaitingDecision(request: TaskApprovalRequest): boolean {
  return (
    request.disposition === 'pending' &&
    request.delivery === 'pending' &&
    request.decision === null &&
    !request.expiryRejection &&
    request.decidedBy !== 'harflow'
  )
}
