import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { transcriptObservationFor } from '../adapters/mock/transcriptFixtures'
import { TaskEventsPane } from './TaskEventsPane'

afterEach(cleanup)

function renderPane(
  overrides: Partial<ReturnType<typeof transcriptObservationFor>>,
) {
  render(
    <TaskEventsPane
      transcript={{ ...transcriptObservationFor('observed'), ...overrides }}
      executionStatus="Done"
      onCopyRecord={() => undefined}
      onClosePane={() => undefined}
      onUnavailable={() => undefined}
    />,
  )
}

describe('TaskEventsPane loading', () => {
  it('shows the full-pane skeleton only while history is loading', () => {
    renderPane({ history: 'loading', summaryCoverage: 'loading' })
    expect(
      screen.getByRole('group', { name: 'Loading Events' }),
    ).toHaveAttribute('aria-busy', 'true')
  })

  it('keeps available records visible when only the summary is loading', () => {
    renderPane({ summaryCoverage: 'loading' })
    expect(screen.queryByRole('group', { name: 'Loading Events' })).toBeNull()
    expect(screen.getByText('Loading tool activity')).toBeInTheDocument()
    expect(screen.getByText('Recovered transcript')).toBeInTheDocument()
  })
})
