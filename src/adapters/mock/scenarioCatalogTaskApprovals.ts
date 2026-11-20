/**
 * Approved task/approval-* scenarios (Design 56b49cb).
 */
import type { TaskId } from '../../model'
import { accepted, base, readyContext } from './scenarioBase'
import type { NewTaskScenarioSeed, ScenarioDefinition } from './scenarios'
import {
  ANSWERED_REFUSAL,
  APPROVAL_ANSWERED_TASK_ID,
  APPROVAL_EXACT_TASK_ID,
  APPROVAL_EXPIRED_TASK_ID,
  APPROVAL_REFUSED_TASK_ID,
  APPROVAL_STALE_TASK_ID,
  APPROVAL_UNCERTAIN_TASK_ID,
  approvalSidebar,
  SETTLED_REFUSAL,
  STALE_REFUSAL,
} from './taskApprovalFixtures'
import { taskLoadFor } from './taskFixtures'

const tasks = (taskId: string) => taskLoadFor(taskId)

type ApprovalSeed = Pick<
  NewTaskScenarioSeed,
  'taskApprovalRefusals'
>

function approvalScenario(
  id: ScenarioDefinition['id'],
  label: string,
  description: string,
  openTaskId: TaskId,
  attention: boolean,
  seed?: ApprovalSeed,
): ScenarioDefinition {
  return base({
    id,
    label,
    description,
    context: readyContext(approvalSidebar(openTaskId, attention)),
    tasks,
    startOutcome: accepted,
    holdStart: false,
    messagingCapability: true,
    seed: { openTaskId, ...seed },
  })
}

/** Six approved task-screen approval states. */
export const TASK_APPROVAL_SCENARIOS: readonly ScenarioDefinition[] = [
  approvalScenario(
    'approval-exact',
    'Task · Approval exact action',
    'Approved task/approval-exact (Design 56b49cb). Approve once and Reject.',
    APPROVAL_EXACT_TASK_ID,
    true,
  ),
  approvalScenario(
    'approval-stale',
    'Task · Approval no longer current',
    'Approved task/approval-stale (Design 56b49cb). not_current + Refresh.',
    APPROVAL_STALE_TASK_ID,
    true,
    {
      taskApprovalRefusals: [
        { requestId: '00000000000000000000000000000001', ...STALE_REFUSAL },
      ],
    },
  ),
  approvalScenario(
    'approval-expired',
    'Task · Approval expired',
    'Approved task/approval-expired (Design 56b49cb). Expired override facts.',
    APPROVAL_EXPIRED_TASK_ID,
    false,
  ),
  approvalScenario(
    'approval-answered-elsewhere',
    'Task · Approval answered elsewhere',
    'Approved task/approval-answered-elsewhere (Design 56b49cb). already_answered.',
    APPROVAL_ANSWERED_TASK_ID,
    false,
    {
      taskApprovalRefusals: [
        {
          requestId: '00000000000000000000000000000001',
          ...ANSWERED_REFUSAL,
        },
      ],
    },
  ),
  approvalScenario(
    'approval-refused',
    'Task · Approval response refused',
    'Approved task/approval-refused (Design 56b49cb). settled refusal.',
    APPROVAL_REFUSED_TASK_ID,
    false,
    {
      taskApprovalRefusals: [
        { requestId: '00000000000000000000000000000001', ...SETTLED_REFUSAL },
      ],
    },
  ),
  approvalScenario(
    'approval-uncertain',
    'Task · Approval delivery uncertain',
    'Approved task/approval-uncertain (Design 56b49cb). delivery_unknown.',
    APPROVAL_UNCERTAIN_TASK_ID,
    false,
  ),
]
