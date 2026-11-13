import type {
  PendingLaunchInventoryEntry,
  PendingLaunchPhase,
  PendingLaunchStatusObservation,
} from '../model'
import { PENDING_COPY, notStartedLead, waitingLead } from './pendingLaunchCopy'
import type { PendingLaunchStopOutcome } from './pendingLaunchesState'

/** One labelled fact row on the detail. */
export type PendingLaunchFact = {
  readonly label: string
  readonly value: string
  /** Render the value as a full-width ID. */
  readonly code: boolean
}

/** Derived detail chrome for one ready status observation. */
export type PendingLaunchDetailView = {
  readonly heading: string
  readonly lead: string
  readonly topbarTitle: string
  readonly facts: readonly PendingLaunchFact[]
  readonly showStop: boolean
  readonly showCheckAgain: boolean
  readonly showCheckTaskStatus: boolean
  readonly showUnconfirmedStopNote: boolean
  readonly showDetailNote: boolean
  readonly showStopAvailabilityNote: boolean
}

type BaseChrome = Omit<PendingLaunchDetailView, 'heading' | 'lead'>

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

/** "10 Nov 2026, 09:30" from an ISO timestamp, in UTC; null if unparseable. */
function formatCreated(iso: string): string | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  const two = (n: number): string => String(n).padStart(2, '0')
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}, ${two(date.getUTCHours())}:${two(date.getUTCMinutes())}`
}

function resourcesFact(resources: readonly string[]): string {
  return resources.length === 0 ? 'None requested' : resources.join(' · ')
}

/** "A", "A and B", "A, B and C". */
function resourcesSentence(resources: readonly string[]): string {
  if (resources.length <= 1) return resources.join('')
  return `${resources.slice(0, -1).join(', ')} and ${resources[resources.length - 1]}`
}

/**
 * Whether the observation carries enough qualified evidence for its phase.
 * Recorded, unknown and not-found launches never do; a waiting launch needs
 * named resources and a not-started launch needs its stored reason.
 */
function isQualified(status: PendingLaunchStatusObservation): boolean {
  switch (status.phase) {
    case 'waiting_for_resources':
      return status.resources !== null && status.resources.length > 0
    case 'not_started':
      return (
        status.notStartedReason !== null &&
        status.notStartedReason.trim() !== ''
      )
    case 'reserved':
    case 'claimed':
    case 'granted':
      return true
    case 'unknown':
    case 'not_found':
    case 'recorded':
    case 'recorded_status_unavailable':
      return false
  }
}

function qualifiedFacts(
  status: PendingLaunchStatusObservation,
): readonly PendingLaunchFact[] {
  const facts: PendingLaunchFact[] = [
    { label: 'Launch ID', value: status.launchId, code: true },
  ]
  if (status.harness) {
    facts.push({ label: 'Harness', value: status.harness, code: false })
  }
  if (status.repository) {
    facts.push({ label: 'Repository', value: status.repository, code: false })
  }
  const created = status.createdAt ? formatCreated(status.createdAt) : null
  if (created) facts.push({ label: 'Created', value: created, code: false })
  if (status.resources) {
    facts.push({
      label: 'Resources',
      value: resourcesFact(status.resources),
      code: false,
    })
  }
  return facts
}

function baseView(status: PendingLaunchStatusObservation): BaseChrome {
  const qualified = isQualified(status)
  return {
    topbarTitle:
      qualified && status.title ? status.title : PENDING_COPY.neutralTitle,
    facts: qualified
      ? qualifiedFacts(status)
      : [{ label: 'Selected ID', value: status.launchId, code: true }],
    showStop: false,
    showCheckAgain: true,
    showCheckTaskStatus: false,
    showUnconfirmedStopNote: false,
    showDetailNote: true,
    showStopAvailabilityNote: false,
  }
}

function stopOutcomeView(
  outcome: PendingLaunchStopOutcome | null,
  base: BaseChrome,
): PendingLaunchDetailView | null {
  if (outcome === 'requested') {
    return {
      ...base,
      heading: PENDING_COPY.stopRequestedHeading,
      lead: PENDING_COPY.stopRequestedLead,
      showUnconfirmedStopNote: true,
    }
  }
  if (outcome === 'uncertain') {
    return {
      ...base,
      heading: PENDING_COPY.stopUncertainHeading,
      lead: PENDING_COPY.stopUncertainLead,
      showUnconfirmedStopNote: true,
    }
  }
  if (outcome === 'refused') {
    return {
      ...base,
      heading: PENDING_COPY.stopRefusedHeading,
      lead: PENDING_COPY.stopRefusedLead,
    }
  }
  return null
}

function unavailableView(base: BaseChrome): PendingLaunchDetailView {
  return {
    ...base,
    heading: PENDING_COPY.unavailableHeading,
    lead: PENDING_COPY.unavailableLead,
  }
}

function phaseView(
  status: PendingLaunchStatusObservation,
  base: BaseChrome,
): PendingLaunchDetailView {
  const stoppable = status.stopSupport === 'available'
  switch (status.phase) {
    case 'waiting_for_resources':
      if (status.resources === null || status.resources.length === 0) {
        return unavailableView(base)
      }
      return {
        ...base,
        heading: PENDING_COPY.waitingHeading,
        lead: waitingLead(resourcesSentence(status.resources)),
        showStop: stoppable,
        showStopAvailabilityNote: stoppable,
      }
    case 'reserved':
    case 'claimed':
      return preparingView(status, base)
    case 'granted':
      return {
        ...base,
        heading: PENDING_COPY.grantedHeading,
        lead: PENDING_COPY.grantedLead,
        showStop: stoppable,
        showStopAvailabilityNote: stoppable,
      }
    case 'not_started':
      if (!isQualified(status) || status.notStartedReason === null) {
        return unavailableView(base)
      }
      return {
        ...base,
        heading: PENDING_COPY.notStartedHeading,
        lead: notStartedLead(status.notStartedReason),
      }
    case 'unknown':
      return unavailableView(base)
    case 'not_found':
      return {
        ...base,
        heading: PENDING_COPY.missingHeading,
        lead: PENDING_COPY.missingLead,
      }
    case 'recorded':
      return {
        ...base,
        heading: PENDING_COPY.recordedHeading,
        lead: PENDING_COPY.recordedLead,
        showCheckAgain: false,
        showCheckTaskStatus: true,
      }
    case 'recorded_status_unavailable':
      return {
        ...base,
        heading: PENDING_COPY.handoffFailedHeading,
        lead: PENDING_COPY.handoffFailedLead,
      }
  }
}

function preparingView(
  status: PendingLaunchStatusObservation,
  base: BaseChrome,
): PendingLaunchDetailView {
  if (status.stopSupport === 'unavailable') {
    // Design: no Stop control at all; the heading and lead explain why.
    return {
      ...base,
      heading: PENDING_COPY.preparingHandshakeHeading,
      lead: PENDING_COPY.preparingHandshakeLead,
    }
  }
  const stoppable = status.stopSupport === 'available'
  return {
    ...base,
    heading: PENDING_COPY.preparingHeading,
    lead: PENDING_COPY.preparingLead,
    showStop: stoppable,
    showStopAvailabilityNote: stoppable,
  }
}

export function pendingLaunchDetailView(
  status: PendingLaunchStatusObservation,
  stopOutcome: PendingLaunchStopOutcome | null = null,
): PendingLaunchDetailView {
  const base = baseView(status)
  return stopOutcomeView(stopOutcome, base) ?? phaseView(status, base)
}

/** One inventory row: title, "Harness · Repository · Status", full ID. */
export type PendingLaunchInventoryRow = {
  readonly launchId: PendingLaunchInventoryEntry['launchId']
  readonly title: string
  readonly meta: string
}

/** Inventory status labels; shorter than the detail headings where designed. */
function inventoryStatusLabel(phase: PendingLaunchPhase): string {
  switch (phase) {
    case 'waiting_for_resources':
      return PENDING_COPY.waitingHeading
    case 'reserved':
    case 'claimed':
      return PENDING_COPY.preparingHeading
    case 'granted':
      return PENDING_COPY.grantedHeading
    case 'not_started':
      return PENDING_COPY.notStartedHeading
    case 'unknown':
      return PENDING_COPY.unavailableHeading
    case 'not_found':
      return PENDING_COPY.missingHeading
    case 'recorded':
      return PENDING_COPY.recordedHeading
    case 'recorded_status_unavailable':
      return PENDING_COPY.handoffFailedHeading
  }
}

export function pendingLaunchInventoryRow(
  entry: PendingLaunchInventoryEntry,
): PendingLaunchInventoryRow {
  return {
    launchId: entry.launchId,
    title: entry.title,
    meta: `${entry.harness} · ${entry.repository} · ${inventoryStatusLabel(entry.phase)}`,
  }
}
