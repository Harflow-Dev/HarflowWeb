import {
  observedEngineStatus,
  type TaskObservation,
} from '../model'
import { TASK_OVERFLOW_COPY } from './taskOverflowCopy'
import { buildPrimaryItems, buildRepositoryItems } from './taskOverflowItems'
import type { OverflowMenuVariant, OverflowMenuView } from './taskOverflowTypes'
import type { TaskCommandChrome } from './taskStatusTypes'

export {
  overflowItemAvailability,
  type OverflowActionId,
  type OverflowItemAvailability,
  type OverflowItemIcon,
  type OverflowItemId,
  type OverflowMenuItemView,
  type OverflowMenuVariant,
  type OverflowMenuView,
  type OverflowUnavailableId,
} from './taskOverflowTypes'

/** Map the observed status read (and Stop acknowledgement) to a variant. */
export function overflowMenuVariant(
  observation: TaskObservation,
  chrome: TaskCommandChrome,
): OverflowMenuVariant {
  const read = observation.statusRead
  if (read.kind === 'unread') return 'unavailable'
  const status = read.status
  switch (status) {
    case 'pending':
      return 'pending'
    case 'running':
      return chrome === 'stop-requested' ? 'stopping' : 'running'
    case 'completed':
    case 'failed':
    case 'timed_out':
    case 'cancelled':
    case 'taken_over':
      return 'settled'
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}

/**
 * Overflow menu for a ready task observation, or null when the screen draws
 * no More anchor: the observation says so (`overflowMenu: 'omitted'`, the
 * approved transcript screens) or records no repository to label the group.
 */
export function overflowMenuView(
  observation: TaskObservation,
  chrome: TaskCommandChrome,
): OverflowMenuView | null {
  if (observation.overflowMenu === 'omitted') return null
  const repository = observation.repository
  if (!repository) return null
  const variant = overflowMenuVariant(observation, chrome)
  return {
    variant,
    primary: buildPrimaryItems(variant, observation),
    repository: {
      name: repository.name,
      items: buildRepositoryItems(variant),
    },
  }
}

/** Access label for the Take over dialog; null when the level is not observed. */
export function takeoverAccessLabel(
  observation: TaskObservation,
): string | null {
  const level = observation.accessLevel
  return level ? TASK_OVERFLOW_COPY.accessLabels[level] : null
}

/** Titles for the client-derived "won't be stopped" list. */
export function wontBeStoppedTitles(
  observation: TaskObservation,
): readonly string[] {
  return (observation.earlierTurnRunningTasks ?? []).map((task) => task.title)
}

/** True when the observation reports a live engine status that admits Stop. */
export function taskAllowsStopDialog(observation: TaskObservation): boolean {
  const status = observedEngineStatus(observation.statusRead)
  return status === 'running' || status === 'pending'
}

/** True when Take over can be offered: running, not stopping, level observed. */
export function taskAllowsTakeoverDialog(
  observation: TaskObservation,
  chrome: TaskCommandChrome,
): boolean {
  return (
    observation.accessLevel !== undefined &&
    overflowMenuVariant(observation, chrome) === 'running'
  )
}
