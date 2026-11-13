import { describe, expect, it } from 'vitest'
import {
  PENDING_LAUNCH_A,
  pendingInventoryReady,
  pendingStatusFixture,
  pendingStatusWaiting,
} from '../adapters/mock/pendingLaunchFixtures'
import { PENDING_COPY } from './pendingLaunchCopy'
import {
  pendingLaunchDetailView,
  pendingLaunchInventoryRow,
} from './pendingLaunchViews'

describe('pendingLaunchDetailView', () => {
  it('maps waiting_for_resources to Waiting for resources with Stop available', () => {
    const view = pendingLaunchDetailView(pendingStatusWaiting())
    expect(view.heading).toBe(PENDING_COPY.waitingHeading)
    expect(view.lead).toBe(
      'Waiting for Claude slots and Shared checkout. Harflow has not confirmed a running task yet.',
    )
    expect(view.showStop).toBe(true)
    expect(view.showStopAvailabilityNote).toBe(true)
  })

  it('maps claimed handshake preparation to the Stop-unavailable heading with no Stop control', () => {
    const view = pendingLaunchDetailView(
      pendingStatusFixture('preparing-handshake'),
    )
    expect(view.heading).toBe(PENDING_COPY.preparingHandshakeHeading)
    expect(view.lead).toBe(PENDING_COPY.preparingHandshakeLead)
    expect(view.showStop).toBe(false)
    expect(view.showStopAvailabilityNote).toBe(false)
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

  it('shows only the Selected ID for unknown, missing, recorded, and handoff-failed launches', () => {
    for (const id of [
      'unavailable',
      'missing',
      'recorded',
      'handoff-failed',
    ] as const) {
      const view = pendingLaunchDetailView(pendingStatusFixture(id))
      expect(view.topbarTitle).toBe(PENDING_COPY.neutralTitle)
      expect(view.facts).toEqual([
        { label: 'Selected ID', value: PENDING_LAUNCH_A, code: true },
      ])
    }
  })

  it('formats qualified facts from structured values', () => {
    const view = pendingLaunchDetailView(pendingStatusWaiting())
    expect(view.topbarTitle).toBe('Review launch admission checks')
    expect(view.facts.map((fact) => [fact.label, fact.value])).toEqual([
      ['Launch ID', PENDING_LAUNCH_A],
      ['Harness', 'Claude'],
      ['Repository', '/projects/Harflow'],
      ['Created', '10 Nov 2026, 09:30'],
      ['Resources', 'Claude slots · Shared checkout'],
    ])
    const handshake = pendingLaunchDetailView(
      pendingStatusFixture('preparing-handshake'),
    )
    expect(handshake.facts.at(-1)).toEqual({
      label: 'Resources',
      value: 'None requested',
      code: false,
    })
  })

  it('maps not_started without a stored reason to the unavailable view', () => {
    const view = pendingLaunchDetailView({
      ...pendingStatusFixture('not-started'),
      notStartedReason: null,
    })
    expect(view.heading).toBe(PENDING_COPY.unavailableHeading)
    expect(view.lead).toBe(PENDING_COPY.unavailableLead)
    expect(view.facts).toHaveLength(1)
  })

  it('maps waiting without named resources to the unavailable view', () => {
    for (const resources of [null, []] as const) {
      const view = pendingLaunchDetailView({
        ...pendingStatusWaiting(),
        resources,
      })
      expect(view.heading).toBe(PENDING_COPY.unavailableHeading)
      expect(view.showStop).toBe(false)
    }
  })

  it('maps stop outcomes to their headings and unconfirmed note where required', () => {
    const waiting = pendingStatusWaiting()
    expect(pendingLaunchDetailView(waiting, 'requested')).toMatchObject({
      heading: PENDING_COPY.stopRequestedHeading,
      lead: PENDING_COPY.stopRequestedLead,
      showUnconfirmedStopNote: true,
      showStop: false,
    })
    expect(pendingLaunchDetailView(waiting, 'uncertain')).toMatchObject({
      heading: PENDING_COPY.stopUncertainHeading,
      showUnconfirmedStopNote: true,
    })
    expect(pendingLaunchDetailView(waiting, 'refused')).toMatchObject({
      heading: PENDING_COPY.stopRefusedHeading,
      showUnconfirmedStopNote: false,
    })
  })
})

describe('pendingLaunchInventoryRow', () => {
  it('labels rows from the observed phase', () => {
    const load = pendingInventoryReady()
    if (load.kind !== 'ready') throw new Error('expected ready inventory')
    expect(
      load.inventory.entries.map((entry) => pendingLaunchInventoryRow(entry).meta),
    ).toEqual([
      'Claude · Harflow · Waiting for resources',
      'Codex · Harflow · Preparing',
    ])
  })
})
