import type { TaskObservation } from '../model'
import { taskEngineStatus, taskExitNotObserved } from './taskObservation'

/**
 * Default right-pane open state from the observed task, as drawn in M05
 * G-ADAPTIVE / status screens. Running, failed, cancelled and timed-out stay
 * closed; settling and a completed task with an observed exit open on Changes.
 * A completed task whose exit was not observed (inferred) stays closed, as
 * `state-unknown-done` draws it. Transcript routes (Events details) stay
 * closed until the toggle, as their approved states draw them.
 */
export function defaultPaneOpen(observation: TaskObservation): boolean {
  if (observation.statusRead.kind === 'unread') return false
  if (observation.settling === true) return true
  const status = taskEngineStatus(observation)
  if (status === null) return false
  switch (status) {
    case 'running':
    case 'failed':
    case 'pending':
    case 'cancelled':
    case 'timed_out':
    case 'taken_over':
      return false
    case 'completed':
      // Transcript routes draw Events closed until the toggle or a deep link.
      return observation.detailsPane !== 'events' &&
        !taskExitNotObserved(observation)
  }
}

/** First open while the run is still live lands on Events (Changes empty until settle). */
export function firstOpenPaneTab(
  observation: TaskObservation,
): 'changes' | 'events' {
  const status = taskEngineStatus(observation)
  if (status === 'running' || status === 'pending') return 'events'
  return 'changes'
}

/** Detail-width threshold for split vs overlay (Design SIDEBAR/RAIL/SPLIT_MIN). */
export const TASK_PANE_SPLIT_MIN = 900

export type TaskPaneLayoutMode = 'split' | 'overlay'

/**
 * Split when the measured detail column (`.hd-main`) is at least 900 wide.
 * The main column already excludes the sidebar/rail.
 */
export function paneLayoutMode(detailWidthPx: number): TaskPaneLayoutMode {
  return detailWidthPx >= TASK_PANE_SPLIT_MIN ? 'split' : 'overlay'
}
