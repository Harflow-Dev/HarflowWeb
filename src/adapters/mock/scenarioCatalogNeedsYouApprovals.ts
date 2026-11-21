/**
 * Approved needs-you/approval-* and checkpoint-stale scenarios (Design 56b49cb).
 */
import {
  answeredElsewhereNeedsYouLoad,
  approvalExpiredNeedsYouLoad,
  approvalStaleNeedsYouLoad,
  checkpointStaleNeedsYouLoad,
  NEEDS_YOU_ANSWERED_CALLER_REFUSAL,
  NEEDS_YOU_APPROVAL_TASK_ID,
  NEEDS_YOU_CHECKPOINT_TOKEN,
  NEEDS_YOU_SLOT_REQUEST_ID,
  NEEDS_YOU_STALE_REFUSAL,
} from './needsYouApprovalFixtures'
import { accepted, base, readyContext } from './scenarioBase'
import type { ScenarioDefinition } from './scenarios'
import { NIGHTLY_AUDIT_RUN_ID } from './workflowExecutionFixtures'

function needsYouApprovalScenario(
  id: ScenarioDefinition['id'],
  label: string,
  description: string,
  needsYou: ScenarioDefinition['needsYou'],
  seed: NonNullable<ScenarioDefinition['seed']>,
): ScenarioDefinition {
  return base({
    id,
    label,
    description,
    context: readyContext(),
    needsYou,
    startOutcome: accepted,
    holdStart: false,
    seed: { openRoute: 'needs-you', ...seed },
  })
}

/** Four approved Needs you approval / checkpoint states. */
export const NEEDS_YOU_APPROVAL_SCENARIOS: readonly ScenarioDefinition[] = [
  needsYouApprovalScenario(
    'needs-you-approval-stale',
    'Needs you · Approval no longer current',
    'Approved needs-you/approval-stale (Design 56b49cb). not_current + Refresh.',
    approvalStaleNeedsYouLoad(),
    {
      needsYouApprovalRefusals: [
        {
          taskId: NEEDS_YOU_APPROVAL_TASK_ID,
          requestId: NEEDS_YOU_SLOT_REQUEST_ID,
          reason: NEEDS_YOU_STALE_REFUSAL.reason,
        },
      ],
    },
  ),
  needsYouApprovalScenario(
    'needs-you-approval-expired',
    'Needs you · Approval expired',
    'Approved needs-you/approval-expired (Design 56b49cb). Expired unanswered.',
    approvalExpiredNeedsYouLoad(),
    {},
  ),
  needsYouApprovalScenario(
    'needs-you-answered-elsewhere',
    'Needs you · Approval answered elsewhere',
    'Approved needs-you/answered-elsewhere (Design 56b49cb). already_answered caller.',
    answeredElsewhereNeedsYouLoad(),
    {
      needsYouApprovalRefusals: [
        {
          taskId: NEEDS_YOU_APPROVAL_TASK_ID,
          requestId: NEEDS_YOU_SLOT_REQUEST_ID,
          reason: NEEDS_YOU_ANSWERED_CALLER_REFUSAL.reason,
          interaction: NEEDS_YOU_ANSWERED_CALLER_REFUSAL.interaction,
        },
      ],
    },
  ),
  needsYouApprovalScenario(
    'needs-you-checkpoint-stale',
    'Needs you · Checkpoint no longer current',
    'Approved needs-you/checkpoint-stale (Design 56b49cb). attention_checkpoint_stale.',
    checkpointStaleNeedsYouLoad(),
    {
      needsYouCheckpointStale: {
        runId: NIGHTLY_AUDIT_RUN_ID,
        attentionCheckpointId: NEEDS_YOU_CHECKPOINT_TOKEN,
      },
    },
  ),
  base({
    id: 'needs-you-cross-surface',
    label: 'Needs you · Task approval on both surfaces',
    description:
      'Default waiting inbox whose task approval also shows on its task screen.',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    crossSurfaceApprovals: true,
  }),
]
