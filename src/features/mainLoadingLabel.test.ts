import { describe, expect, it } from 'vitest'
import { PENDING_LAUNCH_A } from '../adapters/mock/pendingLaunchFixtures'
import type { AppScreenState } from '../presentation'
import { initialPendingLaunchesState } from '../presentation/pendingLaunchesState'
import { mainLoadingLabel } from './mainLoadingLabel'

function pendingState(selected: boolean): AppScreenState {
  return {
    route: 'pending-launches',
    pendingLaunches: {
      ...initialPendingLaunchesState(),
      selectedLaunchId: selected ? PENDING_LAUNCH_A : null,
    },
  } as unknown as AppScreenState
}

describe('mainLoadingLabel for Pending launches', () => {
  it('announces the inventory check while the inventory loads', () => {
    expect(mainLoadingLabel(pendingState(false))).toBe(
      'Checking pending launches',
    )
  })

  it('announces a neutral status check while one launch status loads', () => {
    expect(mainLoadingLabel(pendingState(true))).toBe('Checking launch status')
  })
})
