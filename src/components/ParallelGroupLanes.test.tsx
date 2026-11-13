import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  activityUnavailableParallelGroup,
  cancelledParallelGroup,
  emptyParallelGroup,
  failedParallelGroup,
  historyBoundaryParallelGroup,
  preloadParallelGroup,
  settledParallelGroup,
  takenOverParallelGroup,
  titledParallelGroup,
  twoLanesParallelGroup,
} from '../adapters/mock/parallelGroupFixtures'
import { parallelGroupTopBar } from '../presentation'
import { ParallelGroupView } from './ParallelGroupView'

afterEach(() => {
  cleanup()
})

describe('Parallel group lane end states', () => {
  it('shows settled badge without Cancel all', () => {
    render(
      <ParallelGroupView
        load={{ kind: 'ready', group: settledParallelGroup() }}
      />,
    )
    expect(screen.getByText('3 done')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Cancel all' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Done · 05:02')).toBeInTheDocument()
  })

  it('shows failed lane glyph and end row', () => {
    render(
      <ParallelGroupView
        load={{ kind: 'ready', group: failedParallelGroup() }}
      />,
    )
    expect(screen.getByText('2 done · 1 failed')).toBeInTheDocument()
    expect(screen.getByText('Failed 07:48')).toBeInTheDocument()
    expect(screen.getByText('Failed · 07:48')).toBeInTheDocument()
    expect(screen.getByLabelText('Failed')).toBeInTheDocument()
  })

  it('shows cancelled lane end row', () => {
    render(
      <ParallelGroupView
        load={{ kind: 'ready', group: cancelledParallelGroup() }}
      />,
    )
    expect(screen.getByText('2 done · 1 cancelled')).toBeInTheDocument()
    expect(screen.getByText('Cancelled · 04:31')).toBeInTheDocument()
  })

  it('shows taken-over caption and locked composer', () => {
    render(
      <ParallelGroupView
        load={{ kind: 'ready', group: takenOverParallelGroup() }}
      />,
    )
    expect(
      screen.getByText('Claude · Opus 5.5 · taken over'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Cancelled · taken over · 04:31'),
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(
        'Messages are off — you took this task over in Terminal',
      ),
    ).toBeDisabled()
  })

  it('shows activity unavailable and empty activity notes', () => {
    render(
      <ParallelGroupView
        load={{ kind: 'ready', group: activityUnavailableParallelGroup() }}
      />,
    )
    expect(screen.getByText('Activity log unavailable.')).toBeInTheDocument()
    expect(
      screen.getByText('Messaging is unavailable for this activity view.'),
    ).toBeInTheDocument()
    expect(screen.getByText('No activity to display.')).toBeInTheDocument()
  })

  it('shows history boundary without available-captured-history copy', () => {
    render(
      <ParallelGroupView
        load={{ kind: 'ready', group: historyBoundaryParallelGroup() }}
      />,
    )
    expect(
      screen.getByText(
        /Observation session changed · cached history is not current/,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Load current activity' }),
    ).toBeDisabled()
    expect(
      screen.queryByText(/Available captured history/),
    ).not.toBeInTheDocument()
  })

  it('lays out two lanes', () => {
    render(
      <ParallelGroupView
        load={{ kind: 'ready', group: twoLanesParallelGroup() }}
      />,
    )
    const region = screen.getByRole('region', {
      name: 'Parallel group lanes',
    })
    expect(within(region).getAllByRole('region')).toHaveLength(2)
    expect(screen.getByText('1 running · 1 done')).toBeInTheDocument()
  })
})

describe('Parallel group loading-two', () => {
  it('shows two skeleton lanes while the member count is unknown', () => {
    render(<ParallelGroupView load={{ kind: 'loading', memberCount: null }} />)
    const busy = screen.getByRole('group', { name: 'Loading Parallel group' })
    expect(busy).toHaveAttribute('aria-busy', 'true')
    expect(busy.querySelectorAll('.hd-lane')).toHaveLength(2)
  })

  it('shows the known member count while loading', () => {
    render(<ParallelGroupView load={{ kind: 'loading', memberCount: 3 }} />)
    expect(
      screen
        .getByRole('group', { name: 'Loading Parallel group' })
        .querySelectorAll('.hd-lane'),
    ).toHaveLength(3)
  })
})

describe('Parallel group top bar derivation', () => {
  it('derives badge tone, Cancel all and View prompt from the lanes', () => {
    expect(parallelGroupTopBar(titledParallelGroup())).toEqual({
      badgeTone: 'running',
      showCancelAll: true,
      viewPromptEnabled: true,
      harnessTitled: false,
    })
    expect(parallelGroupTopBar(settledParallelGroup())).toMatchObject({
      badgeTone: 'done',
      showCancelAll: false,
    })
    expect(parallelGroupTopBar(failedParallelGroup()).badgeTone).toBe('failed')
    expect(parallelGroupTopBar(cancelledParallelGroup()).badgeTone).toBe(
      'neutral',
    )
    expect(parallelGroupTopBar(emptyParallelGroup())).toEqual({
      badgeTone: null,
      showCancelAll: false,
      viewPromptEnabled: false,
      harnessTitled: false,
    })
    expect(parallelGroupTopBar(preloadParallelGroup())).toMatchObject({
      viewPromptEnabled: false,
      harnessTitled: true,
    })
  })
})

describe('Parallel group lane bodies', () => {
  const FINDING = /exposeInMainWorld/
  const WORKING = 'Reading src/preload/bridge.ts…'
  const cases = [
    ['settled', settledParallelGroup],
    ['failed', failedParallelGroup],
    ['cancelled', cancelledParallelGroup],
    ['taken over', takenOverParallelGroup],
  ] as const

  it.each(cases)('keeps the full body without a working row when %s', (_n, make) => {
    render(<ParallelGroupView load={{ kind: 'ready', group: make() }} />)
    const claude = screen.getByRole('region', {
      name: 'Audit what the preload bridge exposes',
    })
    expect(within(claude).getByText('Read 6 files')).toBeInTheDocument()
    expect(within(claude).getByText(FINDING)).toBeInTheDocument()
    expect(
      within(claude).getByText('rg "ipcRenderer" src/preload'),
    ).toBeInTheDocument()
    expect(within(claude).queryByText(WORKING)).not.toBeInTheDocument()
  })

  it('shows the working row only while the lane runs', () => {
    render(
      <ParallelGroupView
        load={{ kind: 'ready', group: titledParallelGroup() }}
      />,
    )
    expect(screen.getByText(WORKING)).toBeInTheDocument()
  })
})
