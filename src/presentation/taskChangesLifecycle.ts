import type { TaskChangesCapture, TaskObservation } from '../model'
import { observedEngineStatus } from '../model'
import { taskExitNotObserved } from './taskObservation'

/**
 * Which Changes document the pane should show, matching design paneHtml:
 * pending → not started; status unavailable → unavailable; live run → running;
 * inferred outcome → not observed; otherwise the stored capture (including
 * pending/settling before a document exists).
 */
export type ChangesLifecycleKind =
  | 'notStarted'
  | 'unavailable'
  | 'running'
  | 'notObserved'
  | 'settling'
  | 'capture'

export function changesLifecycleFor(
  observation: TaskObservation,
  capture: TaskChangesCapture | null,
): ChangesLifecycleKind {
  if (observation.statusRead.kind === 'unread') return 'unavailable'
  const status = observedEngineStatus(observation.statusRead)
  if (status === 'pending') return 'notStarted'
  if (status === 'running') return 'running'
  if (taskExitNotObserved(observation)) return 'notObserved'
  if (observation.settling) return 'settling'
  if (capture !== null && capture.state === 'pending') return 'settling'
  return 'capture'
}
