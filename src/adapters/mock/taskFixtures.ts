/**
 * Deterministic task transcript fixtures from HarflowDesign
 * 3643d083… v2/scripts/screens-task.js (task/running, task/failed).
 * Mock-only presentation — not a public ctl transcript protocol.
 */
import { asTaskId } from '../../model'
import type { TaskLoad, TaskObservation } from '../../model'
import { eventsReaderFailedBlocks } from './taskFailedBlocks'
import { preloadBlocks, slotReleaseBlocks } from './taskFixtureBlocks'

/** Mapped from sidebar row "Fix flaky slot release test". */
export const SLOT_RELEASE_TASK_ID = asTaskId('task-slot-release')

/** Second mapped running task for switch/stale tests. */
export const PRELOAD_TASK_ID = asTaskId('task-preload-bridge')

/** Mapped from Recent work "Migrate events.jsonl reader" (task/failed). */
export const EVENTS_READER_FAILED_TASK_ID = asTaskId('task-events-reader-failed')

export function slotReleaseObservation(): TaskObservation {
  return {
    status: 'running',
    taskId: SLOT_RELEASE_TASK_ID,
    title: 'Fix flaky slot release test',
    statusBadge: 'Running 04:12',
    headerMeta: 'Claude · Opus 5.5 · HarflowMCP',
    blocks: slotReleaseBlocks(),
    followUpPlaceholder:
      'Send a follow-up. It is delivered after the current turn.',
  }
}

export function preloadObservation(): TaskObservation {
  return {
    status: 'running',
    taskId: PRELOAD_TASK_ID,
    title: 'Review preload bridge',
    statusBadge: 'Running 01:03',
    headerMeta: 'Claude · Opus 5.5 · HarflowMCP',
    blocks: preloadBlocks(),
    followUpPlaceholder:
      'Send a follow-up. It is delivered after the current turn.',
  }
}

export function eventsReaderFailedObservation(): TaskObservation {
  return {
    status: 'failed',
    taskId: EVENTS_READER_FAILED_TASK_ID,
    title: 'Migrate events.jsonl reader',
    statusBadge: 'Failed 07:48',
    headerMeta: 'Claude · Opus 5.5 · HarflowMCP',
    blocks: eventsReaderFailedBlocks(),
    followUpPlaceholder: 'Tell the agent how to continue',
    failure: {
      title: 'Task failed: the harness exited with code 1',
      intro: 'The last error was:',
      lastError:
        'json.decoder.JSONDecodeError: Unterminated string starting at: line 1 column 38',
    },
  }
}

const BY_ID: ReadonlyMap<string, TaskObservation> = new Map([
  [SLOT_RELEASE_TASK_ID, slotReleaseObservation()],
  [PRELOAD_TASK_ID, preloadObservation()],
  [EVENTS_READER_FAILED_TASK_ID, eventsReaderFailedObservation()],
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
