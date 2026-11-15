/**
 * Task observations for M05 Events tab preview scenarios (Design 6e31cd7).
 * detailsPane is Changes so both tabs work. Mock-only — not a ctl protocol.
 */
import { asTaskId, type TaskEnforcement, type TaskObservation } from '../../model'
import {
  pendingEmptyTranscript,
  retryBudgetDoneTranscript,
  slotReleaseTranscript,
} from './mappedTaskTranscripts'
import {
  doneConversation,
  runningConversation,
} from './taskConversationFixtures'
import {
  TASK_EVENTS_EMPTY_ID,
  TASK_EVENTS_ERROR_ID,
  TASK_EVENTS_LOADING_ID,
  TASK_EVENTS_NOT_STARTED_ID,
  TASK_EVENTS_PAGE_ERROR_ID,
  TASK_EVENTS_PAGE_ID,
  TASK_EVENTS_POPULATED_ID,
} from './taskEventsFixtureIds'
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

const DEFAULT_ENFORCEMENT: TaskEnforcement = {
  requested: 'Can edit this repo',
  mechanism: 'Harness permission rules',
  osSandbox: false,
  writesConfined: false,
  directCommitCommands: 'denied',
  publishAttempts: false,
  network: 'not_controlled',
}

const POPULATED_NOTICES = [
  'Checkout is on the default branch.',
  'Inherited settings could not all be read.',
] as const

/** Design factsGroups specimen Task ID (ctl task_id). */
const PUBLIC_TASK_ID = '7be02d91'

function completedEvents(
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
    enforcement: DEFAULT_ENFORCEMENT,
    publicTaskId: PUBLIC_TASK_ID,
    ...extra,
  }
}

function runningEvents(
  taskId: ReturnType<typeof asTaskId>,
  extra?: Partial<TaskObservation>,
): TaskObservation {
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
    enforcement: DEFAULT_ENFORCEMENT,
    publicTaskId: PUBLIC_TASK_ID,
    ...extra,
  }
}

export function taskEventsTaskObservations(): readonly TaskObservation[] {
  return [
    completedEvents(TASK_EVENTS_POPULATED_ID, {
      notices: POPULATED_NOTICES,
      turnCount: 3,
    }),
    completedEvents(TASK_EVENTS_PAGE_ID),
    completedEvents(TASK_EVENTS_PAGE_ERROR_ID),
    {
      taskId: TASK_EVENTS_NOT_STARTED_ID,
      title: 'Run the nightly dependency audit',
      headerMeta: 'Claude · Opus 5.5 · HarflowMCP',
      statusRead: { kind: 'observed', status: 'pending' },
      launchWait: 'resources',
      transcript: pendingEmptyTranscript(),
      detailsPane: 'changes',
      repository: REPO_MCP,
      accessLevel: ACCESS_EDIT,
    },
    runningEvents(TASK_EVENTS_LOADING_ID),
    runningEvents(TASK_EVENTS_EMPTY_ID),
    completedEvents(TASK_EVENTS_ERROR_ID),
  ]
}

export const TASK_EVENTS_BY_ID: ReadonlyMap<string, TaskObservation> =
  new Map(
    taskEventsTaskObservations().map(
      (observation) => [observation.taskId, observation] as const,
    ),
  )

export function populatedEventsTaskObservation(): TaskObservation {
  return TASK_EVENTS_BY_ID.get(TASK_EVENTS_POPULATED_ID)!
}
