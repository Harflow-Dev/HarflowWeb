/**
 * Mapped task fixtures on the Design 854caae transcript surface.
 * Mock-only presentation — not a public ctl transcript protocol.
 */
import { asTaskId } from '../../model'
import type { TaskLoad, TaskObservation } from '../../model'
import {
  eventsReaderFailedTranscript,
  preloadTranscript,
  retryBudgetDoneTranscript,
  slotReleaseTranscript,
} from './mappedTaskTranscripts'
import {
  failedConversation,
  runningConversation,
} from './taskConversationFixtures'
import { retryBudgetSummary } from './taskSummaryFixture'
import {
  TRANSCRIPT_TASK_IDS,
  transcriptTaskObservation,
  type TranscriptMount,
} from './transcriptFixtures'
import { TASK_STATUS_BY_ID } from './taskStatusFixtures'

/** Mapped from sidebar row "Fix flaky slot release test". */
export const SLOT_RELEASE_TASK_ID = asTaskId('task-slot-release')

/** Second mapped running task for switch/stale tests. */
export const PRELOAD_TASK_ID = asTaskId('task-preload-bridge')

/** Mapped from Recent work "Migrate events.jsonl reader" (task/failed). */
export const EVENTS_READER_FAILED_TASK_ID = asTaskId('task-events-reader-failed')

/** Mapped from Recent work "Add retry budget to delivery queue" (task/done). */
export const RETRY_BUDGET_DONE_TASK_ID = asTaskId('task-retry-budget-done')

export function slotReleaseObservation(): TaskObservation {
  return {
    taskId: SLOT_RELEASE_TASK_ID,
    title: 'Fix flaky slot release test',
    headerMeta: 'Claude · Opus 5.5 · HarflowMCP',
    statusRead: { kind: 'observed', status: 'running' },
    elapsedSeconds: 252,
    conversation: runningConversation(),
    transcript: slotReleaseTranscript(),
    detailsPane: null,
  }
}

export function preloadObservation(): TaskObservation {
  return {
    taskId: PRELOAD_TASK_ID,
    title: 'Review preload bridge',
    headerMeta: 'Claude · Opus 5.5 · HarflowMCP',
    statusRead: { kind: 'observed', status: 'running' },
    elapsedSeconds: 63,
    transcript: preloadTranscript(),
    detailsPane: null,
  }
}

export function eventsReaderFailedObservation(): TaskObservation {
  return {
    taskId: EVENTS_READER_FAILED_TASK_ID,
    title: 'Migrate events.jsonl reader',
    headerMeta: 'Claude · Opus 5.5 · HarflowMCP',
    statusRead: { kind: 'observed', status: 'failed' },
    elapsedSeconds: 468,
    exitObserved: true,
    conversation: failedConversation(),
    failure: {
      title: 'Task failed: the harness exited with code 1',
      intro: 'The last error was:',
      lastError:
        'json.decoder.JSONDecodeError: Unterminated string starting at: line 1 column 38',
    },
    transcript: eventsReaderFailedTranscript(),
    detailsPane: null,
  }
}

export function retryBudgetCompletedObservation(): TaskObservation {
  return {
    taskId: RETRY_BUDGET_DONE_TASK_ID,
    title: 'Add retry budget to delivery queue',
    headerMeta: 'Claude · Opus 5.5 · HarflowWeb',
    statusRead: { kind: 'observed', status: 'completed' },
    elapsedSeconds: 1264,
    exitObserved: true,
    summary: retryBudgetSummary(),
    transcript: retryBudgetDoneTranscript(),
    detailsPane: 'changes',
  }
}

const BY_ID: ReadonlyMap<string, TaskObservation> = new Map([
  [SLOT_RELEASE_TASK_ID, slotReleaseObservation()],
  [PRELOAD_TASK_ID, preloadObservation()],
  [EVENTS_READER_FAILED_TASK_ID, eventsReaderFailedObservation()],
  [RETRY_BUDGET_DONE_TASK_ID, retryBudgetCompletedObservation()],
  ...(Object.keys(TRANSCRIPT_TASK_IDS) as TranscriptMount[]).map(
    (mount) =>
      [TRANSCRIPT_TASK_IDS[mount], transcriptTaskObservation(mount)] as const,
  ),
  ...TASK_STATUS_BY_ID,
])

export function taskLoadFor(taskId: string): TaskLoad {
  const observation = BY_ID.get(taskId)
  if (!observation) {
    return {
      kind: 'unavailable',
      message: `No mock transcript is mapped for task ${taskId}.`,
    }
  }
  return { kind: 'ready', observation }
}

export function populatedTaskLoad(): TaskLoad {
  return { kind: 'ready', observation: slotReleaseObservation() }
}