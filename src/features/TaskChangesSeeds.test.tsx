import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PreviewShell } from '../composition'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

async function openScenario(id: string): Promise<HTMLElement> {
  window.location.hash = `#${id}`
  render(<PreviewShell />)
  return screen.findByRole('complementary', { name: 'Task details' })
}

describe('Changes scenario seeds reach the screen', () => {
  it('not-captured draws the alternates repository open with its caption', async () => {
    const pane = await openScenario('task-changes-not-captured')
    expect(
      await within(pane).findByText(/This repository uses alternates/),
    ).toBeInTheDocument()
  })

  it('turns draws the turn picker and the selected row text', async () => {
    const pane = await openScenario('task-changes-turns')
    expect(await within(pane).findByLabelText('Turn')).toBeInTheDocument()
    expect(within(pane).getByText('task 7be02d91')).toBeInTheDocument()
    expect(
      await within(pane).findByRole('group', {
        name: 'Diff of harflow_web/delivery/queue.py',
      }),
    ).toBeInTheDocument()
  })

  it('same-path selects the working-tree row', async () => {
    const pane = await openScenario('task-changes-same-path')
    expect(
      await within(pane).findByText(
        'Counts and patch for this scope are separate observations and can differ.',
      ),
    ).toBeInTheDocument()
  })

  it('text draws the stacked specimen instead of the list', async () => {
    const pane = await openScenario('task-changes-text')
    expect(
      await within(pane).findByText('Read 32 KiB of 48 KiB stored'),
    ).toBeInTheDocument()
    expect(within(pane).queryByText('Provenance')).toBeNull()
  })
})
