import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  activityUnavailableParallelGroup,
  cancelledParallelGroup,
  failedParallelGroup,
  historyBoundaryParallelGroup,
  parallelGroupLoadFor,
  settledParallelGroup,
  takenOverParallelGroup,
  twoLanesParallelGroup,
  LOADING_TWO_PARALLEL_GROUP_ID,
  TWO_LANES_PARALLEL_GROUP_ID,
} from '../adapters/mock/parallelGroupFixtures'
import { ParallelGroupView } from './ParallelGroupView'
import { ParallelGroupLoadingPage } from './skeleton'

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
  it('shows two skeleton lanes for loading-two', () => {
    const load = parallelGroupLoadFor(LOADING_TWO_PARALLEL_GROUP_ID)
    expect(load).toEqual({ kind: 'loading', laneCount: 2 })
    render(<ParallelGroupView load={load} />)
    const busy = screen.getByRole('group', { name: 'Loading Parallel group' })
    expect(busy).toHaveAttribute('aria-busy', 'true')
    expect(busy.querySelectorAll('.hd-lane')).toHaveLength(2)
  })

  it('resolves to two lanes without changing lane count', () => {
    const { rerender } = render(
      <ParallelGroupLoadingPage laneCount={2} />,
    )
    expect(
      screen.getByRole('group', { name: 'Loading Parallel group' })
        .querySelectorAll('.hd-lane'),
    ).toHaveLength(2)
    rerender(
      <ParallelGroupView
        load={parallelGroupLoadFor(TWO_LANES_PARALLEL_GROUP_ID)}
      />,
    )
    const region = screen.getByRole('region', {
      name: 'Parallel group lanes',
    })
    expect(within(region).getAllByRole('region')).toHaveLength(2)
  })
})
