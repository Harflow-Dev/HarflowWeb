/**
 * Approval card copy (Design 56b49cb screens-approval-states.js COPY / AT /
 * DECIDED). Presentation only — never on the model.
 */

export const APPROVAL_COPY = {
  notCurrent:
    'The request changed or is no longer current. This response did not change it. Refresh to review the current action.',
  alreadyAnswered:
    'This request already has an answer. This response did not change it.',
  settled:
    'This request has already settled. This response did not change it.',
  unknown: 'Delivery is unknown. The decision will not be retried.',
  byMonitor: 'Answered in Harflow',
  byCaller: 'Answered by the caller',
  /** DECIDED.answeredCaller title (Needs you / menu-bar caller race). */
  raceCaller: 'Already answered by the caller',
  /**
   * Workflow attention `attention_checkpoint_stale` (COPY.changed). Not a
   * task-approval refusal reason.
   */
  checkpointChanged: 'This request changed. Review it again.',
  expired: 'Expired',
  rejectionSent: 'Harflow rejected the request when it expired.',
  recovery:
    "It can't be approved later. After the task finishes, continue it in a new session.",
  approveOnce: 'Approve once',
  approve: 'Approve',
  reject: 'Reject',
  refresh: 'Refresh',
  /**
   * Settled heads for this session's own accepted answer. Approved by you is
   * the components/approval-card head; Rejected by you is undrawn.
   */
  approvedByYou: 'Approved by you',
  rejectedByYou: 'Rejected by you',
  runCommand: 'Run command',
  sourceBash: 'Claude · Bash',
  ariaLabel: 'Approval needed',
} as const

/**
 * Refusal lines the design does not draw. Verbatim from HarflowMac
 * CallerApprovalPresentation.swift `refusalMessage` (undrawn in Design).
 */
export const APPROVAL_MAC_COPY = {
  expired: "The request's deadline has passed. This response did not change it.",
  ownershipLost:
    'No new decision was applied. The request owner is gone; Harflow may have invalidated the request.',
  unauthorized:
    'The engine refused this response from the current caller context. This response did not change the request.',
  unsupported:
    "This engine does not support this response. The request was not changed. Respond through the owning caller's MCP or CLI.",
  callerUndecidable:
    "The engine could not determine the caller context. The request was not changed and is read-only here. Respond through the owning caller's MCP or CLI.",
  incomplete:
    'The complete action is unavailable. The request was not changed. Refresh to read the full action before responding.',
  unconfirmed:
    'The result could not be confirmed. This request is read-only here and your answer will not be retried.',
} as const
