/**
 * Task observations for M05 G-ADAPTIVE / top-bar preview scenarios.
 */
import { asTaskId, type TaskObservation } from '../../model'
import { EDIT_REPO_ENFORCEMENT } from './taskEnforcementFixtures'
import { runningConversation } from './taskConversationFixtures'
import { slotReleaseTranscript } from './mappedTaskTranscripts'

export const TASK_TOPBAR_FACTS_ID = asTaskId('task-topbar-facts')
export const TASK_TOPBAR_RESOURCE_ID = asTaskId('task-topbar-resource')
export const TASK_TOPBAR_MINIMUM_ID = asTaskId('task-topbar-minimum')
export const TASK_PANE_RUNNING_OPEN_ID = asTaskId('task-pane-running-open')

function runningBase(
  taskId: ReturnType<typeof asTaskId>,
  extra: Partial<TaskObservation>,
): TaskObservation {
  return {
    taskId,
    title: 'Fix flaky slot release test',
    headerMeta: 'Claude · Opus 5.5 · HarflowMCP',
    statusRead: { kind: 'observed', status: 'running' },
    elapsedSeconds: 252,
    conversation: runningConversation(),
    transcript: slotReleaseTranscript(),
    detailsPane: null,
    repository: {
      name: 'HarflowMCP',
      path: '~/Code/Harflow/HarflowMCP',
    },
    accessLevel: 'edit_repo',
    enforcement: EDIT_REPO_ENFORCEMENT,
    ...extra,
  }
}

export const TASK_PANE_TOPBAR_OBSERVATIONS: readonly TaskObservation[] = [
  runningBase(TASK_PANE_RUNNING_OPEN_ID, {}),
  runningBase(TASK_TOPBAR_FACTS_ID, {
    notices: [
      'Checkout is on the default branch.',
      'Inherited settings could not all be read.',
    ],
    continuity: { adoptedAfterRestart: true, at: null },
    turnCount: 3,
  }),
  runningBase(TASK_TOPBAR_RESOURCE_ID, {
    notices: ['Checkout is on the default branch.'],
    resources: {
      names: ['heavy-build'],
      state: 'held',
      heldForSeconds: 240,
    },
  }),
  runningBase(TASK_TOPBAR_MINIMUM_ID, {
    notices: [
      'Checkout is on the default branch.',
      'Inherited settings could not all be read.',
    ],
    continuity: { adoptedAfterRestart: true, at: null },
    turnCount: 3,
  }),
]

export const TASK_PANE_TOPBAR_BY_ID: ReadonlyMap<string, TaskObservation> =
  new Map(
    TASK_PANE_TOPBAR_OBSERVATIONS.map(
      (observation) => [observation.taskId, observation] as const,
    ),
  )
