import type { TaskObservation } from '../model'
import { EVENTS_FREEDOM_LABELS } from './taskEventsCopy'

export type EventsFactsRevealId = 'enforcement' | 'notices' | 'continuity'

export type TaskTopbarChip = {
  readonly id: EventsFactsRevealId
  readonly icon: 'shield' | 'alert' | 'refresh'
  /** Visible label at wide widths; null means icon-only (narrow still uses ariaLabel). */
  readonly label: string | null
  /** Narrow-only count text for notices (design draws the digit alone). */
  readonly narrowLabel: string | null
  readonly ariaLabel: string
}

/**
 * Access / notices / continuity chips that open Events facts (design topbar).
 * Pending composers omit the access chip.
 */
export function taskTopbarChips(
  observation: TaskObservation,
): readonly TaskTopbarChip[] {
  const chips: TaskTopbarChip[] = []
  if (observation.continuity?.adoptedAfterRestart === true) {
    chips.push({
      id: 'continuity',
      icon: 'refresh',
      label: 'Observation resumed',
      narrowLabel: null,
      ariaLabel: 'Observation resumed after a restart. Show details.',
    })
  }
  const notices = observation.notices ?? []
  if (notices.length > 0) {
    const n = notices.length
    const unit = n === 1 ? 'notice' : 'notices'
    chips.push({
      id: 'notices',
      icon: 'alert',
      label: `${n} ${unit}`,
      narrowLabel: String(n),
      ariaLabel: `Show ${n} ${unit}`,
    })
  }
  if (
    observation.enforcement &&
    taskEngineStatusIsPending(observation) === false
  ) {
    const requested =
      EVENTS_FREEDOM_LABELS[observation.enforcement.freedom] ??
      observation.enforcement.freedom
    chips.push({
      id: 'enforcement',
      icon: 'shield',
      label: requested,
      narrowLabel: null,
      ariaLabel: `${requested}. Show what was enforced.`,
    })
  }
  return chips
}

/** Whether the meta line is omitted because chips + open pane need the space. */
export function topbarOmitsMetaForPane(
  observation: TaskObservation,
  paneOpen: boolean,
): boolean {
  if (!paneOpen) return false
  if ((observation.notices?.length ?? 0) > 0) return true
  return observation.continuity?.adoptedAfterRestart === true
}

function taskEngineStatusIsPending(observation: TaskObservation): boolean {
  return (
    observation.statusRead.kind === 'observed' &&
    observation.statusRead.status === 'pending'
  )
}
