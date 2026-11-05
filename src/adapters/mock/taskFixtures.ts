/**
 * Deterministic running-task transcript fixtures from HarflowDesign
 * 3643d083… v2/scripts/screens-task.js state task/running.
 * Mock-only presentation — not a public ctl transcript protocol.
 */
import { asTaskId } from '../../model'
import type { TaskLoad, TaskObservation } from '../../model'
import { preloadBlocks, slotReleaseBlocks } from './taskFixtureBlocks'

/** Mapped from sidebar row "Fix flaky slot release test". */
export const SLOT_RELEASE_TASK_ID = asTaskId('task-slot-release')

/** Second mapped running task for switch/stale tests. */
export const PRELOAD_TASK_ID = asTaskId('task-preload-bridge')

export function slotReleaseObservation(): TaskObservation {
  return {
    taskId: SLOT_RELEASE_TASK_ID,
    title: 'Fix flaky slot release test',
    runningBadge: 'Running 04:12',
    headerMeta: 'Claude · Opus 5.5 · HarflowMCP',
    blocks: slotReleaseBlocks(),
    followUpPlaceholder:
      'Send a follow-up. It is delivered after the current turn.',
  }
}

export function preloadObservation(): TaskObservation {
  return {
    taskId: PRELOAD_TASK_ID,
    title: 'Review preload bridge',
    runningBadge: 'Running 01:03',
    headerMeta: 'Claude · Opus 5.5 · HarflowMCP',
    blocks: preloadBlocks(),
    followUpPlaceholder:
      'Send a follow-up. It is delivered after the current turn.',
  }
}

const BY_ID: ReadonlyMap<string, TaskObservation> = new Map([
  [SLOT_RELEASE_TASK_ID, slotReleaseObservation()],
  [PRELOAD_TASK_ID, preloadObservation()],
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
