/**
 * M05 G-OVERFLOW preview scenarios (Design 6e31cd7).
 */
import { accepted, base, readyContext } from './scenarioBase'
import type { ScenarioDefinition } from './scenarios'
import { RETRY_BUDGET_DONE_TASK_ID, taskLoadFor } from './taskFixtures'
import {
  TASK_OVERFLOW_STOP_LINEAGE_ID,
  TASK_OVERFLOW_SUBTASK_ID,
} from './taskOverflowFixtures'
import { TASK_STATUS_RUNNING_STOP_ID } from './taskStatusFixtures'

const tasks = (taskId: string) => taskLoadFor(taskId)

export const TASK_OVERFLOW_SCENARIOS: readonly ScenarioDefinition[] = [
  base({
    id: 'task-overflow-running',
    label: 'Task · overflow running',
    description:
      'Approved task/overflow-running (M05 G-OVERFLOW). More menu open on a running task.',
    context: readyContext(),
    tasks,
    startOutcome: accepted,
    holdStart: false,
    seed: {
      openTaskId: TASK_STATUS_RUNNING_STOP_ID,
      taskOverflowMenuOpen: true,
    },
  }),
  base({
    id: 'task-overflow-settled',
    label: 'Task · overflow settled',
    description:
      'Approved task/overflow-settled (M05 G-OVERFLOW). Menu open on Changes with the single-file fixture.',
    context: readyContext(),
    tasks,
    startOutcome: accepted,
    holdStart: false,
    seed: {
      openTaskId: RETRY_BUDGET_DONE_TASK_ID,
      eventsPaneOpen: true,
      taskOverflowMenuOpen: true,
    },
  }),
  base({
    id: 'task-overflow-subtask',
    label: 'Task · overflow sub-task',
    description:
      'Approved task/overflow-subtask (M05 G-OVERFLOW). Parent lineage and provenance line.',
    context: readyContext(),
    tasks,
    startOutcome: accepted,
    holdStart: false,
    seed: {
      openTaskId: TASK_OVERFLOW_SUBTASK_ID,
      taskOverflowMenuOpen: true,
    },
  }),
  base({
    id: 'task-stop-dialog',
    label: 'Task · stop dialog',
    description:
      'Approved task/stop-dialog (M05 G-OVERFLOW). Stop confirmation on a running task.',
    context: readyContext(),
    tasks,
    startOutcome: accepted,
    holdStart: false,
    seed: {
      openTaskId: TASK_STATUS_RUNNING_STOP_ID,
      taskDialog: 'stop',
    },
  }),
  base({
    id: 'task-stop-dialog-earlier-turns',
    label: 'Task · stop dialog earlier turns',
    description:
      'Approved task/stop-dialog-earlier-turns (M05 G-OVERFLOW). Client-derived won\'t-be-stopped list.',
    context: readyContext(),
    tasks,
    startOutcome: accepted,
    holdStart: false,
    seed: {
      openTaskId: TASK_OVERFLOW_STOP_LINEAGE_ID,
      taskDialog: 'stop',
    },
  }),
  base({
    id: 'task-takeover-dialog',
    label: 'Task · takeover dialog',
    description:
      'Approved task/takeover-dialog (M05 G-OVERFLOW). Takeover confirmation.',
    context: readyContext(),
    tasks,
    startOutcome: accepted,
    holdStart: false,
    seed: {
      openTaskId: TASK_STATUS_RUNNING_STOP_ID,
      taskDialog: 'takeover',
    },
  }),
]
