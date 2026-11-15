import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PreviewShell } from '../composition'
import {
  EVENTS_EMPTY_ROWS,
  EVENTS_HISTORY_UNAVAILABLE,
  EVENTS_NOT_STARTED,
  EVENTS_PAGE_ERROR,
} from '../presentation/taskEventsCopy'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

async function openScenario(id: string): Promise<HTMLElement> {
  window.location.hash = `#${id}`
  render(<PreviewShell />)
  return screen.findByRole('complementary', { name: 'Task details' })
}

describe('Events scenario seeds reach the screen', () => {
  it('populated draws facts groups, activity facts, and the tool-result record', async () => {
    const pane = await openScenario('task-events-populated')
    expect(within(pane).getByText('Task')).toBeInTheDocument()
    expect(within(pane).getByText('What was enforced')).toBeInTheDocument()
    expect(within(pane).getByText('Notices')).toBeInTheDocument()
    expect(within(pane).getByText('2')).toBeInTheDocument()
    expect(within(pane).getByText('2 tool calls observed')).toBeInTheDocument()
    expect(
      within(pane).getByText('Tool result · normalized record'),
    ).toBeInTheDocument()
    expect(within(pane).getByText('Recovered transcript')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Events' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('page-error keeps newest records and shows the earlier-read warning', async () => {
    const pane = await openScenario('task-events-page-error')
    expect(within(pane).getByText(EVENTS_PAGE_ERROR.title)).toBeInTheDocument()
    expect(
      within(pane).getByText('Assistant text · normalized record'),
    ).toBeInTheDocument()
    expect(
      within(pane).getByText('Unsupported record · public stub'),
    ).toBeInTheDocument()
    expect(within(pane).queryByText('Load earlier')).toBeNull()
  })

  it('not-started uses the pending pane copy', async () => {
    const pane = await openScenario('task-events-not-started')
    expect(within(pane).getByText(EVENTS_NOT_STARTED.title)).toBeInTheDocument()
    expect(within(pane).getByText(EVENTS_NOT_STARTED.body)).toBeInTheDocument()
  })

  it('empty says so without qualifying totals', async () => {
    const pane = await openScenario('task-events-empty')
    expect(within(pane).getByText(EVENTS_EMPTY_ROWS)).toBeInTheDocument()
    expect(
      within(pane).getByText('An empty window does not qualify totals.'),
    ).toBeInTheDocument()
  })

  it('error keeps facts and does not imply task failure', async () => {
    const pane = await openScenario('task-events-error')
    expect(within(pane).getByText('Task')).toBeInTheDocument()
    expect(
      within(pane).getByText(EVENTS_HISTORY_UNAVAILABLE.title),
    ).toBeInTheDocument()
    expect(
      within(pane).getByText(EVENTS_HISTORY_UNAVAILABLE.body),
    ).toBeInTheDocument()
  })
})
