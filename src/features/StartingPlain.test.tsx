import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { PreviewShell } from '../composition'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

describe('new-task/centered-starting-plain', () => {
  it('disables Start as Starting task, hides the status row, and announces once', async () => {
    window.location.hash = '#composer-starting'
    render(<PreviewShell />)
    const start = await screen.findByRole('button', { name: 'Starting task' })
    expect(start).toBeDisabled()
    expect(document.querySelector('.hw-compose-status')).toBeNull()
    expect(screen.queryByText('Starting task…', {
      selector: '.hw-compose-status',
    })).toBeNull()
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Starting task…')
    })
    expect(screen.getAllByRole('status')).toHaveLength(1)
  })

  it('clears the Starting task… announcement after Resolve held start', async () => {
    const user = userEvent.setup()
    window.location.hash = '#composer-starting'
    render(<PreviewShell />)
    await screen.findByRole('button', { name: 'Starting task' })
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Starting task…')
    })
    await user.click(
      screen.getByRole('button', { name: 'Resolve held start' }),
    )
    await waitFor(() => {
      expect(screen.getByRole('status').textContent).not.toBe('Starting task…')
    })
    expect(
      screen.getByRole('button', { name: 'Start task' }),
    ).toBeInTheDocument()
    expect(document.querySelector('.hw-compose-status')).not.toBeNull()
  })
})

describe('task pane loading skeletons via preview', () => {
  it('shows Changes loading then replaces it when the observation resolves', async () => {
    window.location.hash = '#task-changes-loading'
    render(<PreviewShell />)
    const busy = await screen.findByRole('group', {
      name: 'Reading stored changes',
    })
    expect(busy).toHaveAttribute('aria-busy', 'true')
    expect(
      within(busy).getByText('Reading stored changes', { selector: 'strong' }),
    ).toBeInTheDocument()
    expect(within(busy).queryByText(/proposal/)).toBeNull()
  })

  it('shows Events loading from the transcript loading observation', async () => {
    window.location.hash = '#task-events-loading'
    render(<PreviewShell />)
    const busy = await screen.findByRole('group', { name: 'Loading Events' })
    expect(busy).toHaveAttribute('aria-busy', 'true')
    expect(within(busy).getByText('Loading tool activity')).toBeInTheDocument()
    expect(
      within(busy).getByText('Loading captured history'),
    ).toBeInTheDocument()
  })
})
