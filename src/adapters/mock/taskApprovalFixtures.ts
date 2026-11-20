/**
 * Task-screen approval fixtures (Design 56b49cb task/approval-*).
 * Ledger fields follow ctl-approval-* specimens; card body matches the
 * approved task/approval base specimen (exact action, cwd, reason).
 */
import {
  asTaskId,
  type SidebarData,
  type TaskApprovalRequest,
  type TaskId,
  type TaskObservation,
} from '../../model'
import { approvalConversation } from './taskApprovalConversation'
import { EDIT_REPO_ENFORCEMENT } from './taskEnforcementFixtures'
import { slotReleaseTranscript } from './mappedTaskTranscripts'
import { populatedSidebar } from './fixtures'

export const APPROVAL_EXACT_TASK_ID = asTaskId('task-approval-exact')
export const APPROVAL_STALE_TASK_ID = asTaskId('task-approval-stale')
export const APPROVAL_EXPIRED_TASK_ID = asTaskId('task-approval-expired')
export const APPROVAL_ANSWERED_TASK_ID = asTaskId(
  'task-approval-answered-elsewhere',
)
export const APPROVAL_REFUSED_TASK_ID = asTaskId('task-approval-refused')
export const APPROVAL_UNCERTAIN_TASK_ID = asTaskId('task-approval-uncertain')

const ACCESS_EDIT = 'edit_repo' as const
const REPO_MCP = {
  name: 'HarflowMCP',
  path: '~/Code/Harflow/HarflowMCP',
} as const

/** Design specimen command / cwd / reason (screens-task.js task/approval). */
const SPECIMEN = {
  action: 'pytest tests/test_slots.py -k release --count 50',
  cwd: '~/Code/Harflow/HarflowMCP',
  decisionReason:
    'confirm the race no longer reproduces over 50 runs, up from 20 before the fix.',
  actionDigest:
    '34f5cdad4c9524bc3c91dd2da54b35e139a51196af1a0c06324f02d99ccf30c4',
} as const

/** Pending exact_action_once row (ctl-approval-get-claude-bash shape). */
export function pendingExactRequest(
  overrides: Partial<TaskApprovalRequest> = {},
): TaskApprovalRequest {
  return {
    requestId: '00000000000000000000000000000001',
    ownerRevision: 1,
    actionDigest: SPECIMEN.actionDigest,
    disposition: 'pending',
    delivery: 'pending',
    decision: null,
    effectiveDecision: null,
    deliveredDecision: null,
    expiryRejection: false,
    executionOutcome: 'unknown',
    scope: 'exact_action_once',
    toolName: 'Bash',
    action: SPECIMEN.action,
    cwd: SPECIMEN.cwd,
    decisionReason: SPECIMEN.decisionReason,
    ...overrides,
  }
}

/** Expired override row (ctl-approval-state-expired-override facts). */
export function expiredOverrideRequest(): TaskApprovalRequest {
  return pendingExactRequest({
    requestId: '00000000000000000000000000000014',
    ownerRevision: 4,
    disposition: 'expired',
    delivery: 'sent',
    decision: 'approve',
    decidedBy: 'caller',
    responder: 'caller',
    decidedAt: 1792000022,
    effectiveDecision: 'reject',
    deliveredDecision: 'reject',
    expiryRejection: true,
  })
}

/** Delivery-unknown row (ctl-approval-state-delivery-unknown facts). */
export function deliveryUnknownRequest(): TaskApprovalRequest {
  return pendingExactRequest({
    requestId: '0000000000000000000000000000000b',
    ownerRevision: 4,
    disposition: 'decided',
    delivery: 'delivery_unknown',
    decision: 'approve',
    decidedBy: 'caller',
    responder: 'monitor',
    decidedAt: 1792000011,
    effectiveDecision: 'approve',
    deliveredDecision: null,
  })
}

/** Post-approve decided/sent row after a successful Approve once. */
export function approvedSentRequest(
  base: TaskApprovalRequest,
): TaskApprovalRequest {
  return {
    ...base,
    disposition: 'decided',
    delivery: 'sent',
    decision: 'approve',
    decidedBy: 'caller',
    responder: 'caller',
    decidedAt: 1792000011,
    effectiveDecision: 'approve',
    deliveredDecision: 'approve',
    ownerRevision: base.ownerRevision + 1,
  }
}

function approvalObservation(
  taskId: TaskId,
  approval: TaskApprovalRequest,
  awaitingDecisionCount: number,
): TaskObservation {
  return {
    taskId,
    title: 'Fix flaky slot release test',
    headerMeta: 'Claude · Opus 5.5 · HarflowMCP',
    statusRead: { kind: 'observed', status: 'running' },
    elapsedSeconds: 252,
    conversation: approvalConversation(),
    transcript: slotReleaseTranscript(),
    detailsPane: null,
    repository: REPO_MCP,
    accessLevel: ACCESS_EDIT,
    enforcement: EDIT_REPO_ENFORCEMENT,
    approval,
    approvalSummary: { awaitingDecisionCount },
  }
}

export function approvalSidebar(taskId: TaskId, attention: boolean): SidebarData {
  const base = populatedSidebar()
  const running = base.running.map((entry) => {
    if (entry.title !== 'Fix flaky slot release test') return entry
    return {
      ...entry,
      mappedTaskId: taskId,
      glyph: attention ? ('attention' as const) : ('running' as const),
    }
  })
  return { ...base, running }
}

export const APPROVAL_EXACT_OBS = approvalObservation(
  APPROVAL_EXACT_TASK_ID,
  pendingExactRequest(),
  1,
)
export const APPROVAL_STALE_OBS = approvalObservation(
  APPROVAL_STALE_TASK_ID,
  pendingExactRequest(),
  1,
)
export const APPROVAL_EXPIRED_OBS = approvalObservation(
  APPROVAL_EXPIRED_TASK_ID,
  expiredOverrideRequest(),
  0,
)
export const APPROVAL_ANSWERED_OBS = approvalObservation(
  APPROVAL_ANSWERED_TASK_ID,
  pendingExactRequest(),
  0,
)
export const APPROVAL_REFUSED_OBS = approvalObservation(
  APPROVAL_REFUSED_TASK_ID,
  pendingExactRequest(),
  0,
)
export const APPROVAL_UNCERTAIN_OBS = approvalObservation(
  APPROVAL_UNCERTAIN_TASK_ID,
  deliveryUnknownRequest(),
  0,
)

export const TASK_APPROVAL_BY_ID: ReadonlyMap<string, TaskObservation> =
  new Map([
    [APPROVAL_EXACT_TASK_ID, APPROVAL_EXACT_OBS],
    [APPROVAL_STALE_TASK_ID, APPROVAL_STALE_OBS],
    [APPROVAL_EXPIRED_TASK_ID, APPROVAL_EXPIRED_OBS],
    [APPROVAL_ANSWERED_TASK_ID, APPROVAL_ANSWERED_OBS],
    [APPROVAL_REFUSED_TASK_ID, APPROVAL_REFUSED_OBS],
    [APPROVAL_UNCERTAIN_TASK_ID, APPROVAL_UNCERTAIN_OBS],
  ])

/** Scripted respond refusal for scenarios that open on a refusal card. */
export const STALE_REFUSAL = { reason: 'not_current' as const }
export const ANSWERED_REFUSAL = {
  reason: 'already_answered' as const,
  interaction: {
    answeredBy: 'monitor' as const,
    answer: 'approve' as const,
    answeredAt: 1792000005,
  },
}
export const SETTLED_REFUSAL = { reason: 'settled' as const }
