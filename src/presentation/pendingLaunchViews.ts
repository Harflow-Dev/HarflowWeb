import type { PendingLaunchStatusObservation } from '../model'
import { PENDING_COPY, notStartedLead, waitingLead } from './pendingLaunchCopy'

/** Derived detail chrome for one ready status observation. */
export type PendingLaunchDetailView = {
  readonly heading: string
  readonly lead: string
  readonly topbarTitle: string
  readonly showFacts: boolean
  readonly showStop: boolean
  readonly stopUnavailable: boolean
  readonly stopUnavailableExplanation: string | null
  readonly showCheckAgain: boolean
  readonly showCheckTaskStatus: boolean
  readonly showUnconfirmedStopNote: boolean
  readonly showDetailNote: boolean
  readonly showStopAvailabilityNote: boolean
}

function baseView(
  topbarTitle: string,
  known: boolean,
): Omit<PendingLaunchDetailView, 'heading' | 'lead'> {
  return {
    topbarTitle,
    showFacts: known,
    showStop: false,
    stopUnavailable: false,
    stopUnavailableExplanation: null,
    showCheckAgain: true,
    showCheckTaskStatus: false,
    showUnconfirmedStopNote: false,
    showDetailNote: true,
    showStopAvailabilityNote: false,
  }
}

type BaseChrome = Omit<PendingLaunchDetailView, 'heading' | 'lead'>

function stopOutcomeView(
  status: PendingLaunchStatusObservation,
  base: BaseChrome,
): PendingLaunchDetailView | null {
  if (status.stopOutcome === 'requested') {
    return {
      ...base,
      heading: PENDING_COPY.stopRequestedHeading,
      lead: PENDING_COPY.stopRequestedLead,
      showUnconfirmedStopNote: true,
    }
  }
  if (status.stopOutcome === 'uncertain') {
    return {
      ...base,
      heading: PENDING_COPY.stopUncertainHeading,
      lead: PENDING_COPY.stopUncertainLead,
      showUnconfirmedStopNote: true,
    }
  }
  if (status.stopOutcome === 'refused') {
    return {
      ...base,
      heading: PENDING_COPY.stopRefusedHeading,
      lead: PENDING_COPY.stopRefusedLead,
    }
  }
  return null
}

function phaseView(
  status: PendingLaunchStatusObservation,
  base: BaseChrome,
): PendingLaunchDetailView {
  switch (status.phase) {
    case 'waiting_for_resources':
      return {
        ...base,
        heading: PENDING_COPY.waitingHeading,
        lead: waitingLead(status.waitingResourcesLabel ?? 'resources'),
        showStop: status.stopSupport === 'available',
        showStopAvailabilityNote: status.stopSupport === 'available',
      }
    case 'reserved':
    case 'claimed':
      return preparingView(status, base)
    case 'granted':
      return {
        ...base,
        heading: PENDING_COPY.grantedHeading,
        lead: PENDING_COPY.grantedLead,
        showStop: status.stopSupport === 'available',
        showStopAvailabilityNote: status.stopSupport === 'available',
      }
    case 'not_started':
      return {
        ...base,
        heading: PENDING_COPY.notStartedHeading,
        lead: notStartedLead(status.notStartedReason ?? 'unspecified'),
      }
    case 'unknown':
      return {
        ...base,
        heading: PENDING_COPY.unavailableHeading,
        lead: PENDING_COPY.unavailableLead,
        topbarTitle: PENDING_COPY.neutralTitle,
      }
    case 'not_found':
      return {
        ...base,
        heading: PENDING_COPY.missingHeading,
        lead: PENDING_COPY.missingLead,
        topbarTitle: PENDING_COPY.neutralTitle,
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
    return {
      ...base,
      heading: PENDING_COPY.preparingHandshakeHeading,
      lead: PENDING_COPY.preparingHandshakeLead,
      showStop: true,
      stopUnavailable: true,
      stopUnavailableExplanation: PENDING_COPY.stopHandshakeUnavailable,
    }
  }
  return {
    ...base,
    heading: PENDING_COPY.preparingHeading,
    lead: PENDING_COPY.preparingLead,
    showStop: status.stopSupport === 'available',
    showStopAvailabilityNote: status.stopSupport === 'available',
  }
}

export function pendingLaunchDetailView(
  status: PendingLaunchStatusObservation,
): PendingLaunchDetailView {
  const known = status.title !== null
  const base = baseView(status.title ?? PENDING_COPY.neutralTitle, known)
  return stopOutcomeView(status, base) ?? phaseView(status, base)
}
