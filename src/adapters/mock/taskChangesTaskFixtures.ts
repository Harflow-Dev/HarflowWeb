/**
 * Task observations for M05 G-DIFF preview scenarios.
 * Completed fixtures reuse the retry-budget transcript/summary; running uses
 * the slot-release conversation. Mock-only — not a ctl transcript protocol.
 */
import { asTaskId, type TaskObservation } from '../../model'
import { retryBudgetDoneTranscript, slotReleaseTranscript } from './mappedTaskTranscripts'
import { doneConversation, runningConversation } from './taskConversationFixtures'
import {
  TASK_CHANGES_ERROR_ID,
  TASK_CHANGES_INCOMPLETE_ID,
  TASK_CHANGES_LOADING_ID,
  TASK_CHANGES_MULTI_ID,
  TASK_CHANGES_MULTI_LIMITED_ID,
  TASK_CHANGES_NOT_CAPTURED_ID,
  TASK_CHANGES_NO_REPOSITORY_ID,
  TASK_CHANGES_ROW_STATES_ID,
  TASK_CHANGES_RUNNING_ID,
  TASK_CHANGES_SAME_PATH_ID,
  TASK_CHANGES_SINGLE_ID,
  TASK_CHANGES_TEXT_ID,
  TASK_CHANGES_TURNS_ID,
  TASK_CHANGES_UNMERGED_ID,
  TASK_CHANGES_ZERO_ID,
} from './taskChangesFixtureIds'
import { retryBudgetSummary } from './taskSummaryFixture'

const ACCESS_EDIT = 'edit_repo' as const
const REPO_WEB = {
  name: 'HarflowWeb',
  path: '~/Code/Harflow/HarflowWeb',
} as const
const REPO_MCP = {
  name: 'HarflowMCP',
  path: '~/Code/Harflow/HarflowMCP',
} as const

function completedChanges(
  taskId: ReturnType<typeof asTaskId>,
  extra?: Partial<TaskObservation>,
): TaskObservation {
  return {
    taskId,
    title: 'Add retry budget to delivery queue',
    headerMeta: 'Claude · Opus 5.5 · HarflowWeb',
    statusRead: { kind: 'observed', status: 'completed' },
    elapsedSeconds: 1264,
    exitObserved: true,
    conversation: doneConversation(),
    summary: retryBudgetSummary(),
    transcript: retryBudgetDoneTranscript(),
    detailsPane: 'changes',
    repository: REPO_WEB,
    accessLevel: ACCESS_EDIT,
    ...extra,
  }
}

function omitRepository(observation: TaskObservation): TaskObservation {
  const { repository: _unused, ...rest } = observation
  return rest
}

function runningChanges(taskId: ReturnType<typeof asTaskId>): TaskObservation {
  return {
    taskId,
    title: 'Fix flaky slot release test',
    headerMeta: 'Claude · Opus 5.5 · HarflowMCP',
    statusRead: { kind: 'observed', status: 'running' },
    elapsedSeconds: 252,
    conversation: runningConversation(),
    transcript: slotReleaseTranscript(),
    detailsPane: 'changes',
    repository: REPO_MCP,
    accessLevel: ACCESS_EDIT,
  }
}

export function taskChangesTaskObservations(): readonly TaskObservation[] {
  return [
    completedChanges(TASK_CHANGES_SINGLE_ID),
    completedChanges(TASK_CHANGES_MULTI_ID),
    completedChanges(TASK_CHANGES_MULTI_LIMITED_ID),
    completedChanges(TASK_CHANGES_SAME_PATH_ID),
    completedChanges(TASK_CHANGES_ROW_STATES_ID),
    completedChanges(TASK_CHANGES_INCOMPLETE_ID),
    completedChanges(TASK_CHANGES_NOT_CAPTURED_ID),
    completedChanges(TASK_CHANGES_UNMERGED_ID),
    runningChanges(TASK_CHANGES_RUNNING_ID),
    completedChanges(TASK_CHANGES_ZERO_ID),
    omitRepository(completedChanges(TASK_CHANGES_NO_REPOSITORY_ID)),
    completedChanges(TASK_CHANGES_TEXT_ID),
    completedChanges(TASK_CHANGES_LOADING_ID),
    completedChanges(TASK_CHANGES_ERROR_ID),
    completedChanges(TASK_CHANGES_TURNS_ID, { turnCount: 3 }),
  ]
}

export const TASK_CHANGES_BY_ID: ReadonlyMap<string, TaskObservation> =
  new Map(
    taskChangesTaskObservations().map(
      (observation) => [observation.taskId, observation] as const,
    ),
  )
