import {
  observedEngineStatus,
  type TaskObservation,
} from '../model'
import { buildOverflowItems } from './taskOverflowItems'

/** Menu variant driven by the observed status read. */
export type OverflowMenuVariant =
  | 'running'
  | 'pending'
  | 'settled'
  | 'unavailable'

export type OverflowItemId =
  | 'stop'
  | 'takeover'
  | 'openTerminal'
  | 'openParent'
  | 'copyResume'
  | 'copyTaskId'
  | 'openFinder'
  | 'copyPath'

export type OverflowItemAvailability = 'action' | 'unavailable'

export type OverflowItemIcon =
  | 'stop'
  | 'terminal'
  | 'external'
  | 'copy'
  | 'folder'

export type OverflowMenuItemView = {
  readonly id: OverflowItemId
  readonly label: string
  readonly icon: OverflowItemIcon
  readonly danger?: boolean
  readonly hint?: string
  readonly availability: OverflowItemAvailability
  readonly describedById?: string
}

export type OverflowMenuView = {
  readonly variant: OverflowMenuVariant
  readonly items: readonly OverflowMenuItemView[]
  readonly repositoryName: string
}

/** Map observed status to the overflow menu variant. */
export function overflowMenuVariant(
  observation: TaskObservation,
): OverflowMenuVariant {
  if (observation.statusRead.kind === 'unread') return 'unavailable'
  const status = observation.statusRead.status
  if (status === 'pending') return 'pending'
  if (status === 'running') return 'running'
  return 'settled'
}

/**
 * Exhaustive per-status availability for each overflow item id.
 * Hidden items are omitted from the returned menu; this maps only shown ids.
 */
export function overflowItemAvailability(
  variant: OverflowMenuVariant,
  id: OverflowItemId,
): OverflowItemAvailability | 'hidden' {
  switch (id) {
    case 'stop':
      return variant === 'running' || variant === 'pending' ? 'action' : 'hidden'
    case 'takeover':
      return variant === 'running' ? 'action' : 'hidden'
    case 'openTerminal':
      if (variant === 'settled') return 'unavailable'
      return 'hidden'
    case 'openParent':
      return 'action'
    case 'copyResume':
      if (variant === 'pending' || variant === 'unavailable') return 'hidden'
      return 'unavailable'
    case 'copyTaskId':
      return 'action'
    case 'openFinder':
      return 'unavailable'
    case 'copyPath':
      return 'action'
    default: {
      const _exhaustive: never = id
      return _exhaustive
    }
  }
}

/** Build the overflow menu view for a ready task observation. */
export function overflowMenuView(
  observation: TaskObservation,
): OverflowMenuView {
  const variant = overflowMenuVariant(observation)
  return {
    variant,
    items: buildOverflowItems(variant, observation),
    repositoryName: observation.repository?.name ?? 'Repository',
  }
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
