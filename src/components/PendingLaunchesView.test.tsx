import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PENDING_LAUNCH_A } from '../adapters/mock/pendingLaunchFixtures'
import { PENDING_COPY } from '../presentation/pendingLaunchCopy'
import { initialPendingLaunchesState } from '../presentation/pendingLaunchesState'
import { PendingLaunchesView } from './PendingLaunchesView'

afterEach(cleanup)

describe('PendingLaunchesView detail loading', () => {
  it('shows a neutral busy skeleton without inventory or status claims', () => {
    render(
      <PendingLaunchesView
        state={{
          ...initialPendingLaunchesState(),
          selectedLaunchId: PENDING_LAUNCH_A,
        }}
        onOpenLaunch={() => undefined}
        onStopConfirm={() => undefined}
      />,
    )
    expect(document.querySelector('.hd-topbar__title')?.textContent).toBe(
      PENDING_COPY.neutralTitle,
    )
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(document.querySelector('[aria-busy="true"] [aria-hidden="true"]')).not.toBeNull()
    expect(screen.queryByText(PENDING_COPY.loadingHeading)).toBeNull()
    expect(screen.queryByText(PENDING_COPY.loadingLead)).toBeNull()
    expect(screen.queryByRole('heading')).toBeNull()
    expect(screen.queryByRole('button', { name: PENDING_COPY.stop })).toBeNull()
  })
})
