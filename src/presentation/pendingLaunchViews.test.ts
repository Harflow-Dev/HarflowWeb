import { describe, expect, it } from 'vitest'
import {
  pendingStatusFixture,
  pendingStatusWaiting,
} from '../adapters/mock/pendingLaunchFixtures'
import { PENDING_COPY } from './pendingLaunchCopy'
import { pendingLaunchDetailView } from './pendingLaunchViews'

describe('pendingLaunchDetailView', () => {
  it('maps waiting_for_resources to Waiting for resources with Stop available', () => {
    const view = pendingLaunchDetailView(pendingStatusWaiting())
    expect(view.heading).toBe(PENDING_COPY.waitingHeading)
    expect(view.lead).toBe(
      'Waiting for Claude slots and Shared checkout. Harflow has not confirmed a running task yet.',
    )
    expect(view.showStop).toBe(true)
    expect(view.stopUnavailable).toBe(false)
    expect(view.showStopAvailabilityNote).toBe(true)
  })

  it('maps claimed handshake preparation to Stop unavailable with explanation', () => {
    const view = pendingLaunchDetailView(
      pendingStatusFixture('preparing-handshake'),
    )
    expect(view.heading).toBe(PENDING_COPY.preparingHandshakeHeading)
    expect(view.lead).toBe(PENDING_COPY.preparingHandshakeLead)
    expect(view.showStop).toBe(true)
    expect(view.stopUnavailable).toBe(true)
    expect(view.stopUnavailableExplanation).toBe(
      PENDING_COPY.stopHandshakeUnavailable,
    )
  })

  it('maps reserved preparation to Preparing with Stop available', () => {
    const view = pendingLaunchDetailView(pendingStatusFixture('preparing'))
    expect(view.heading).toBe(PENDING_COPY.preparingHeading)
    expect(view.lead).toBe(PENDING_COPY.preparingLead)
    expect(view.showStop).toBe(true)
  })

  it('maps granted without fabricating Running', () => {
    const view = pendingLaunchDetailView(pendingStatusFixture('granted'))
    expect(view.heading).toBe(PENDING_COPY.grantedHeading)
    expect(view.lead).toBe(PENDING_COPY.grantedLead)
  })

  it('maps not_started with the recorded reason', () => {
    const view = pendingLaunchDetailView(pendingStatusFixture('not-started'))
    expect(view.heading).toBe(PENDING_COPY.notStartedHeading)
    expect(view.lead).toBe(
      'The engine recorded that this launch did not start. Reason: resource wait was cancelled.',
    )
    expect(view.showStop).toBe(false)
  })

  it('maps unknown to unavailable and missing to not found', () => {
    expect(pendingLaunchDetailView(pendingStatusFixture('unavailable'))).toMatchObject({
      heading: PENDING_COPY.unavailableHeading,
      lead: PENDING_COPY.unavailableLead,
      showStop: false,
    })
    expect(pendingLaunchDetailView(pendingStatusFixture('missing'))).toMatchObject({
      heading: PENDING_COPY.missingHeading,
      lead: PENDING_COPY.missingLead,
      showStop: false,
    })
  })

  it('maps recorded to Check task status and handoff-failed without task controls', () => {
    const recorded = pendingLaunchDetailView(pendingStatusFixture('recorded'))
    expect(recorded.heading).toBe(PENDING_COPY.recordedHeading)
    expect(recorded.showCheckTaskStatus).toBe(true)
    expect(recorded.showCheckAgain).toBe(false)
    expect(recorded.showStop).toBe(false)
    const failed = pendingLaunchDetailView(
      pendingStatusFixture('handoff-failed'),
    )
    expect(failed.heading).toBe(PENDING_COPY.handoffFailedHeading)
    expect(failed.showCheckTaskStatus).toBe(false)
    expect(failed.showStop).toBe(false)
  })

  it('maps stop outcomes to their headings and unconfirmed note where required', () => {
    expect(
      pendingLaunchDetailView(pendingStatusFixture('stop-requested')),
    ).toMatchObject({
      heading: PENDING_COPY.stopRequestedHeading,
      lead: PENDING_COPY.stopRequestedLead,
      showUnconfirmedStopNote: true,
      showStop: false,
    })
    expect(
      pendingLaunchDetailView(pendingStatusFixture('stop-uncertain')),
    ).toMatchObject({
      heading: PENDING_COPY.stopUncertainHeading,
      showUnconfirmedStopNote: true,
    })
    expect(
      pendingLaunchDetailView(pendingStatusFixture('stop-refused')),
    ).toMatchObject({
      heading: PENDING_COPY.stopRefusedHeading,
      showUnconfirmedStopNote: false,
    })
  })
})
