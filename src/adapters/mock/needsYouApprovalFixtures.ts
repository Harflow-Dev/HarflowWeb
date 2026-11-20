/**
 * Needs you approval ledger / checkpoint fixtures (Design 56b49cb
 * needs-you/approval-* and needs-you/checkpoint-stale).
 */
import {
  asTaskId,
  type ApprovalRespondRefusal,
  type NeedsYouItem,
  type NeedsYouLoad,
  type NeedsYouObservation,
  type NeedsYouTaskApproval,
  type NeedsYouWorkflowApproval,
  type TaskApprovalRequest,
} from '../../model'
import {
  NIGHTLY_PUBLISH_SNAPSHOT,
  NIGHTLY_REQUESTER_MODEL,
} from './nightlyPublishSnapshot'
import { NIGHTLY_AUDIT_RUN_ID } from './workflowExecutionFixtures'
import { SLOT_RELEASE_TASK_ID } from './taskFixtures'

export const NEEDS_YOU_SLOT_REQUEST_ID =
  '00000000000000000000000000000001' as const
export const NEEDS_YOU_EXPIRED_REQUEST_ID =
  '00000000000000000000000000000015' as const

/** Initial attention checkpoint token on the Nightly publish card. */
export const NEEDS_YOU_CHECKPOINT_TOKEN =
  'attention:1111111111111111111111111111111111111111111111111111111111111111' as const

/** Token Refresh returns after a stale answer in the checkpoint-stale scenario. */
export const NEEDS_YOU_CHECKPOINT_TOKEN_NEXT =
  'attention:2222222222222222222222222222222222222222222222222222222222222222' as const

const SLOT_ACTION = 'npm test -- --runInBand slot-release' as const
const SLOT_DETAIL =
  'In ~/Code/Harflow/HarflowMCP · Claude Code · Opus 5.5' as const
const SLOT_DIGEST =
  '9f3c2a1b0e8d7c6b5a4938271605f4e3d2c1b0a9f8e7d6c5b4a3928170615243' as const

/** Pending exact_action_once row for the Needs you command card. */
export function needsYouPendingRequest(
  overrides: Partial<TaskApprovalRequest> = {},
): TaskApprovalRequest {
  return {
    requestId: NEEDS_YOU_SLOT_REQUEST_ID,
    ownerRevision: 1,
    actionDigest: SLOT_DIGEST,
    disposition: 'pending',
    delivery: 'pending',
    decision: null,
    effectiveDecision: null,
    deliveredDecision: null,
    expiryRejection: false,
    executionOutcome: 'unknown',
    scope: 'exact_action_once',
    toolName: 'Bash',
    action: SLOT_ACTION,
    cwd: '~/Code/Harflow/HarflowMCP',
    decisionReason: null,
    ...overrides,
  }
}

/**
 * Expired unanswered row (ctl-approval-state-expired-unanswered.json).
 * `decision` is null — no who line.
 */
export function needsYouExpiredUnansweredRequest(): TaskApprovalRequest {
  return needsYouPendingRequest({
    requestId: NEEDS_YOU_EXPIRED_REQUEST_ID,
    ownerRevision: 4,
    actionDigest:
      'a0eb6acf130c25e03cf671452f166cb187cc7ceaba310276d4e84427a033d7ff',
    disposition: 'expired',
    delivery: 'sent',
    decision: null,
    effectiveDecision: 'reject',
    deliveredDecision: 'reject',
    expiryRejection: true,
    executionOutcome: 'unknown',
  })
}

/** Decided row matching the caller already_answered interaction. */
export function needsYouAnsweredElsewhereRequest(): TaskApprovalRequest {
  return needsYouPendingRequest({
    ownerRevision: 2,
    disposition: 'pending',
    delivery: 'reserved',
    decision: 'approve',
    decidedBy: 'caller',
    responder: 'caller',
    decidedAt: 1792000005,
  })
}

/** Engine row ahead of the stale Needs you card (decidable after Refresh). */
export const NEEDS_YOU_STALE_CURRENT = needsYouPendingRequest({
  ownerRevision: 2,
})

export const NEEDS_YOU_STALE_REFUSAL = {
  reason: 'not_current' as const,
} satisfies ApprovalRespondRefusal

export const NEEDS_YOU_ANSWERED_CALLER_REFUSAL = {
  reason: 'already_answered' as const,
  interaction: {
    answeredBy: 'caller' as const,
    answer: 'approve' as const,
    answeredAt: 1792000005,
  },
} satisfies ApprovalRespondRefusal

export function slotReleaseNeedsYouApproval(
  request: TaskApprovalRequest = needsYouPendingRequest(),
): NeedsYouTaskApproval {
  return {
    kind: 'approval',
    id: 'approve-slot-release-test',
    actionLabel: 'Wants to run a command',
    exactAction: SLOT_ACTION,
    detail: SLOT_DETAIL,
    approveLabel: 'Approve once',
    rejectLabel: 'Reject',
    context: {
      kind: 'task',
      title: 'Fix flaky slot release test',
      waitingLabel: 'waiting 3m',
      taskId: SLOT_RELEASE_TASK_ID,
    },
    requestId: request.requestId,
    ownerRevision: request.ownerRevision,
    request,
  }
}

export function nightlyPublishNeedsYouApproval(
  attentionCheckpointId: string = NEEDS_YOU_CHECKPOINT_TOKEN,
): NeedsYouWorkflowApproval {
  return {
    kind: 'approval',
    id: 'approve-nightly-publish',
    actionLabel: 'Wants to publish',
    exactAction: NIGHTLY_PUBLISH_SNAPSHOT.publishAction,
    detail: `${NIGHTLY_PUBLISH_SNAPSHOT.needsYouAccess} · ${NIGHTLY_REQUESTER_MODEL}`,
    approveLabel: 'Approve',
    rejectLabel: 'Reject',
    context: {
      kind: 'workflow',
      title: 'Nightly dependency audit',
      step: 'Open pull request',
      waitingLabel: 'waiting 1h',
      runId: NIGHTLY_AUDIT_RUN_ID,
    },
    attentionCheckpointId,
  }
}

function eventsConfigQuestion(): NeedsYouItem {
  return {
    kind: 'question',
    id: 'question-events-config',
    prompt: 'Which config should win when both are set?',
    detail: 'Opencode · claude-sonnet-5',
    context: {
      kind: 'task',
      title: 'Migrate events.jsonl reader',
      waitingLabel: 'waiting 12m',
      taskId: null,
    },
  }
}

function withFirstApproval(
  first: NeedsYouTaskApproval,
  checkpointId: string = NEEDS_YOU_CHECKPOINT_TOKEN,
): NeedsYouObservation {
  return {
    coverage: 'complete',
    coverageNote: null,
    items: [
      first,
      nightlyPublishNeedsYouApproval(checkpointId),
      eventsConfigQuestion(),
    ],
  }
}

function withPublishApproval(
  publish: NeedsYouWorkflowApproval,
): NeedsYouObservation {
  return {
    coverage: 'complete',
    coverageNote: null,
    items: [
      slotReleaseNeedsYouApproval(),
      publish,
      {
        kind: 'question',
        id: 'question-events-config',
        prompt: 'Which config should win when both are set?',
        detail: 'Opencode · claude-sonnet-5',
        context: {
          kind: 'task',
          title: 'Migrate events.jsonl reader',
          waitingLabel: 'waiting 12m',
          taskId: null,
        },
      },
    ],
  }
}

export function approvalStaleNeedsYouLoad(): NeedsYouLoad {
  return {
    kind: 'ready',
    observation: withFirstApproval(slotReleaseNeedsYouApproval()),
  }
}

export function approvalExpiredNeedsYouLoad(): NeedsYouLoad {
  return {
    kind: 'ready',
    observation: withFirstApproval(
      slotReleaseNeedsYouApproval(needsYouExpiredUnansweredRequest()),
    ),
  }
}

export function answeredElsewhereNeedsYouLoad(): NeedsYouLoad {
  return {
    kind: 'ready',
    observation: withFirstApproval(
      slotReleaseNeedsYouApproval(needsYouAnsweredElsewhereRequest()),
    ),
  }
}

export function checkpointStaleNeedsYouLoad(): NeedsYouLoad {
  return {
    kind: 'ready',
    observation: withPublishApproval(nightlyPublishNeedsYouApproval()),
  }
}

/** Task id used when responding from the Needs you slot-release card. */
export const NEEDS_YOU_APPROVAL_TASK_ID = asTaskId(SLOT_RELEASE_TASK_ID)
