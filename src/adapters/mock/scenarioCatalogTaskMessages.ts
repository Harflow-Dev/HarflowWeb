/**
 * Approved task/message-* queued-message scenarios (Design 7de89a4).
 */
import { accepted, base, readyContext } from './scenarioBase'
import type { ScenarioDefinition } from './scenarios'
import {
  MESSAGE_CANCELLED_TASK_ID,
  MESSAGE_DELIVERED_TASK_ID,
  MESSAGE_DELIVERING_TASK_ID,
  MESSAGE_QUEUED_SETTLED_TASK_ID,
  MESSAGE_QUEUED_TASK_ID,
  MESSAGE_SEND_NOW_REFUSED_TASK_ID,
  MESSAGE_UNCERTAIN_TASK_ID,
  MESSAGE_UNSUPPORTED_TASK_ID,
} from './taskMessageFixtures'
import { taskLoadFor } from './taskFixtures'

const tasks = (taskId: string) => taskLoadFor(taskId)

function messageScenario(
  id: ScenarioDefinition['id'],
  label: string,
  description: string,
  openTaskId: string,
): ScenarioDefinition {
  return base({
    id,
    label,
    description,
    context: readyContext(),
    tasks,
    startOutcome: accepted,
    holdStart: false,
    seed: { openTaskId },
  })
}

/** Eight approved task-screen queued-message states. */
export const TASK_MESSAGES_SCENARIOS: readonly ScenarioDefinition[] = [
  messageScenario(
    'message-queued',
    'Task · Messages queued',
    'Approved task/message-queued (Design 7de89a4). Two Queued bubbles with Cancel; Send now beside Send.',
    MESSAGE_QUEUED_TASK_ID,
  ),
  messageScenario(
    'message-delivering',
    'Task · Message delivering',
    'Approved task/message-delivering (Design 7de89a4). Queued caption, no Cancel; delivery outcome.',
    MESSAGE_DELIVERING_TASK_ID,
  ),
  messageScenario(
    'message-delivered',
    'Task · Message delivered',
    'Approved task/message-delivered (Design 7de89a4). No bubble; Message delivered outcome.',
    MESSAGE_DELIVERED_TASK_ID,
  ),
  messageScenario(
    'message-cancelled',
    'Task · Message cancelled',
    'Approved task/message-cancelled (Design 7de89a4). Remaining queued bubble; cancelled outcome.',
    MESSAGE_CANCELLED_TASK_ID,
  ),
  messageScenario(
    'message-send-now-refused',
    'Task · Send now refused',
    'Approved task/message-send-now-refused (Design 7de89a4). Refusal note; Cancel stays.',
    MESSAGE_SEND_NOW_REFUSED_TASK_ID,
  ),
  messageScenario(
    'message-uncertain',
    'Task · Delivery uncertain',
    'Approved task/message-uncertain (Design 7de89a4). Uncertain caption above live activity; no Cancel.',
    MESSAGE_UNCERTAIN_TASK_ID,
  ),
  messageScenario(
    'message-unsupported',
    'Task · Messages unavailable',
    'Approved task/message-unsupported (Design 7de89a4). Locked composer; no Send now, hint, or placeholder.',
    MESSAGE_UNSUPPORTED_TASK_ID,
  ),
  messageScenario(
    'message-queued-settled',
    'Task · Queued on a finished task',
    'Approved task/message-queued-settled (Design 7de89a4). Failed task; queued bubbles; standard composer.',
    MESSAGE_QUEUED_SETTLED_TASK_ID,
  ),
]
