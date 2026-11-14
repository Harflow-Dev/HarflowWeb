/**
 * G-OVERFLOW task fixtures (Design 6e31cd7 overflow / stop / takeover states).
 */
import { asTaskId, type TaskObservation } from '../../model'
import { runningConversation } from './taskConversationFixtures'
import { slotReleaseTranscript } from './mappedTaskTranscripts'

const ACCESS_EDIT = 'edit_repo' as const
const REPO_MCP = {
  name: 'HarflowMCP',
  path: '~/Code/Harflow/HarflowMCP',
} as const

export const TASK_OVERFLOW_PARENT_ID = asTaskId('task-m05-overflow-parent')
export const TASK_OVERFLOW_SUBTASK_ID = asTaskId('task-m05-overflow-subtask')
export const TASK_OVERFLOW_STOP_LINEAGE_ID = asTaskId(
  'task-m05-overflow-stop-lineage',
)

function runningBase(
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
    detailsPane: null,
    repository: REPO_MCP,
    accessLevel: ACCESS_EDIT,
    ...extra,
  }
}

export function taskOverflowObservations(): readonly TaskObservation[] {
  return [
    {
      ...runningBase(TASK_OVERFLOW_PARENT_ID),
      title: 'Nightly dependency audit',
      headerMeta: 'Claude · Opus 5.5 · HarflowMCP',
      elapsedSeconds: 600,
    },
    runningBase(TASK_OVERFLOW_SUBTASK_ID, {
      parent: {
        taskId: TASK_OVERFLOW_PARENT_ID,
        title: 'Nightly dependency audit',
      },
    }),
    runningBase(TASK_OVERFLOW_STOP_LINEAGE_ID, {
      earlierTurnRunningTasks: [
        {
          taskId: asTaskId('task-m05-rebuild-index'),
          title: 'Rebuild the index',
        },
      ],
    }),
  ]
}

export const TASK_OVERFLOW_BY_ID: ReadonlyMap<string, TaskObservation> =
  new Map(
    taskOverflowObservations().map(
      (observation) => [observation.taskId, observation] as const,
    ),
  )
