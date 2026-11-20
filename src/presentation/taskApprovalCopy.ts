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
  expired: 'Expired',
  rejectionSent: 'Harflow rejected the request when it expired.',
  recovery:
    "It can't be approved later. After the task finishes, continue it in a new session.",
  approveOnce: 'Approve once',
  reject: 'Reject',
  refresh: 'Refresh',
  /** Post-approve settled head (components/approval-card). Undrawn as a route. */
  approvedByYou: 'Approved by you',
  runCommand: 'Run command',
  sourceBash: 'Claude · Bash',
  ariaLabel: 'Approval needed',
} as const
