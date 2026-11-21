/**
 * M05 task-status preview scenarios (Design 6e31cd7).
 * Migration: task-running and task-failed stay as legacy ids; task-running-stop
 * and task-failed-continue alias the same openTaskId seeds (duplicate catalog rows).
 */
import { emptyNeedsYouLoad } from './needsYouFixtures'
import { accepted, base, readyContext } from './scenarioBase'
import type { ScenarioDefinition } from './scenarios'
import type { TaskCommandChromeSeed } from './scenarioSeed'
import { taskLoadFor } from './taskFixtures'
import {
  TASK_STATUS_CANCELLED_ID,
  TASK_STATUS_CONTINUE_STARTED_ID,
  TASK_STATUS_CONTINUE_STARTING_ID,
  TASK_STATUS_FAILED_CONTINUE_ID,
  TASK_STATUS_LAUNCH_UNKNOWN_ID,
  TASK_STATUS_OWNER_LOST_ID,
  TASK_STATUS_PENDING_ID,
  TASK_STATUS_RUNNING_STOP_ID,
  TASK_STATUS_SETTLING_ID,
  TASK_STATUS_STATUS_UNAVAILABLE_ID,
  TASK_STATUS_STOP_REQUESTED_ID,
  TASK_STATUS_TAKEN_OVER_ID,
  TASK_STATUS_TIMED_OUT_ID,
  TASK_STATUS_UNVERIFIED_ID,
  TASK_STATUS_UNKNOWN_DONE_ID,
  TASK_STATUS_UNKNOWN_FAILED_ID,
} from './taskStatusFixtures'

const tasks = (taskId: string) => taskLoadFor(taskId)

function statusScenario(
  id: ScenarioDefinition['id'],
  label: string,
  description: string,
  openTaskId: string,
  taskCommandChrome?: TaskCommandChromeSeed,
): ScenarioDefinition {
  return base({
    id,
    label,
    description,
    context: readyContext(),
    tasks,
    startOutcome: accepted,
    holdStart: false,
    seed: {
      openTaskId,
      ...(taskCommandChrome !== undefined ? { taskCommandChrome } : {}),
    },
  })
}

const RUNNING_STOP_SEED = {
  openTaskId: TASK_STATUS_RUNNING_STOP_ID,
} as const

const FAILED_CONTINUE_SEED = {
  openTaskId: TASK_STATUS_FAILED_CONTINUE_ID,
} as const

/** M05 /task/* status states for /preview (light and dark via appearance). */
export const TASK_STATUS_SCENARIOS: readonly ScenarioDefinition[] = [
  statusScenario(
    'task-stop-requested',
    'Task · stop requested',
    'Approved task/stop-requested (M05). Running status with Stop acknowledged.',
    TASK_STATUS_STOP_REQUESTED_ID,
    'stop-requested',
  ),
  statusScenario(
    'task-cancelled',
    'Task · cancelled',
    'Approved task/cancelled (M05).',
    TASK_STATUS_CANCELLED_ID,
  ),
  statusScenario(
    'task-timed-out',
    'Task · timed out',
    'Approved task/timed-out (M05).',
    TASK_STATUS_TIMED_OUT_ID,
  ),
  statusScenario(
    'task-settling',
    'Task · settling',
    'Approved task/settling (M05).',
    TASK_STATUS_SETTLING_ID,
  ),
  statusScenario(
    'task-unknown-failed',
    'Task · unknown failed',
    'Approved task/unknown-failed (M05).',
    TASK_STATUS_UNKNOWN_FAILED_ID,
  ),
  statusScenario(
    'task-unknown-done',
    'Task · unknown done',
    'Approved task/unknown-done (M05).',
    TASK_STATUS_UNKNOWN_DONE_ID,
  ),
  statusScenario(
    'task-owner-lost',
    'Task · owner lost',
    'Approved task/owner-lost (M05).',
    TASK_STATUS_OWNER_LOST_ID,
  ),
  statusScenario(
    'task-unverified',
    'Task · unverified',
    'Approved task/unverified (M05).',
    TASK_STATUS_UNVERIFIED_ID,
  ),
  statusScenario(
    'task-launch-unknown',
    'Task · launch unknown',
    'Approved task/launch-unknown (M05).',
    TASK_STATUS_LAUNCH_UNKNOWN_ID,
    'continue-unknown',
  ),
  statusScenario(
    'task-status-unavailable',
    'Task · status unavailable',
    'Approved task/status-unavailable (M05). Display-only unread status.',
    TASK_STATUS_STATUS_UNAVAILABLE_ID,
  ),
  statusScenario(
    'task-pending',
    'Task · pending',
    'Approved task/pending (M05). Waiting for resources.',
    TASK_STATUS_PENDING_ID,
  ),
  statusScenario(
    'task-taken-over',
    'Task · taken over',
    'Approved task/taken-over (M05).',
    TASK_STATUS_TAKEN_OVER_ID,
  ),
  statusScenario(
    'task-continue-starting',
    'Task · continue starting',
    'Approved task/continue-starting (M05).',
    TASK_STATUS_CONTINUE_STARTING_ID,
    'continue-starting',
  ),
  statusScenario(
    'task-continue-started',
    'Task · continue started',
    'Approved task/continue-started (M05).',
    TASK_STATUS_CONTINUE_STARTED_ID,
    'continue-started',
  ),
  base({
    id: 'task-running-stop',
    label: 'Task · running stop',
    description:
      'Approved task/running-stop (M05). Alias of task-running — same fixture seed.',
    context: readyContext(),
    tasks,
    startOutcome: accepted,
    holdStart: false,
    // The slot-release task also backs a Needs you approval in the default
    // inbox; this scenario shows the plain running status, so the inbox is empty.
    needsYou: emptyNeedsYouLoad(),
    seed: RUNNING_STOP_SEED,
  }),
  base({
    id: 'task-failed-continue',
    label: 'Task · failed continue',
    description:
      'Approved task/failed-continue (M05). Alias of task-failed — Continue in a new session.',
    context: readyContext(),
    tasks,
    startOutcome: accepted,
    holdStart: false,
    seed: FAILED_CONTINUE_SEED,
  }),
]