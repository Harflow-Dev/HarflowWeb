import type { TaskEventsLoad, TaskObservation } from '../model'
import { observedEngineStatus } from '../model'

/**
 * Which Events body the pane should show, matching design paneHtml:
 * pending (or the pending-launch refusal) → notStarted; status unread → unavailable; else the stored
 * events observation (or loading).
 */
export type EventsLifecycleKind =
  | 'notStarted'
  | 'unavailable'
  | 'loading'
  | 'ready'

export function eventsLifecycleFor(
  observation: TaskObservation,
  load: TaskEventsLoad,
): EventsLifecycleKind {
  if (observation.statusRead.kind === 'unread') return 'unavailable'
  if (observedEngineStatus(observation.statusRead) === 'pending') {
    return 'notStarted'
  }
  // The engine's own pending-launch refusal says the same as a pending status.
  if (load.kind === 'refused') return 'notStarted'
  if (load.kind === 'loading') return 'loading'
  return 'ready'
}
