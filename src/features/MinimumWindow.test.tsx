import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PreviewShell } from '../composition'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

beforeEach(() => {
  window.location.hash = ''
})

async function boot(scenario: string): Promise<void> {
  window.location.hash = `#${scenario}`
  render(<PreviewShell />)
  await waitFor(() => {
    expect(document.querySelector('.hw-preview__app--minimum')).not.toBeNull()
  })
}

describe('minimum window 1000×620', () => {
  it('Needs you waiting-minimum reaches the frame and waiting list', async () => {
    await boot('needs-you-waiting-minimum')
    expect(
      await screen.findByRole('heading', { name: 'Needs you' }),
    ).toBeInTheDocument()
    expect(screen.getByText('3 waiting')).toBeInTheDocument()
  })

  it('Parallel group lanes-minimum hides meta behind a focusable named dot', async () => {
    await boot('parallel-group-lanes-minimum')
    expect(
      await screen.findByLabelText('Parallel group lanes'),
    ).toBeInTheDocument()
    const meta = await screen.findByRole('note', {
      name: /Enforced for every agent here/,
    })
    expect(meta).toHaveAttribute('tabindex', '0')
    expect(meta.querySelector('.hw-topbar-meta__dot')).not.toBeNull()
    expect(meta.textContent).toMatch(/Enforced for every agent here/)
    meta.focus()
    expect(meta).toHaveFocus()
  })

  it('Workflow run parallel-minimum exposes meta through the focusable dot', async () => {
    await boot('workflow-run-parallel-minimum')
    expect(await screen.findByLabelText('Parallel lanes')).toBeInTheDocument()
    const meta = await screen.findByRole('note', {
      name: 'Step 2 of 4 · 06:31',
    })
    expect(meta).toHaveAttribute('tabindex', '0')
  })

  it('Workflow editor node-selected-minimum scrolls the canvas and drops meta', async () => {
    await boot('workflow-editor-node-selected-minimum')
    const meta = await screen.findByRole('note', { name: 'Revision 7' })
    expect(meta).toHaveAttribute('tabindex', '0')
    const canvas = screen.getByRole('region', { name: 'Workflow canvas' })
    expect(canvas.className).toContain('hd-thin-scroll')
    expect(canvas.getAttribute('tabindex')).toBe('0')
    // Content is sized larger than a clipped viewport; overflow stays scrollable.
    expect(canvas).toHaveAttribute('data-content-width')
    const contentWidth = Number(canvas.getAttribute('data-content-width'))
    expect(contentWidth).toBeGreaterThan(0)
  })

  it('Workflow editor orchestrator-minimum selects the locked orchestrator', async () => {
    await boot('workflow-editor-orchestrator-minimum')
    await screen.findByRole('note', { name: 'Revision 7' })
    expect(
      await screen.findByRole('complementary', {
        name: 'Orchestrator settings',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Every workflow has one\. It can't be removed\./),
    ).toBeInTheDocument()
  })

  it('needs-you-loading-minimum shows its busy region', async () => {
    await boot('needs-you-loading-minimum')
    const busy = await screen.findByRole('group', { name: 'Loading Needs you' })
    expect(busy).toHaveAttribute('aria-busy', 'true')
  })

  it('parallel-group-loading-minimum shows its busy region without a meta note', async () => {
    await boot('parallel-group-loading-minimum')
    const busy = await screen.findByRole('group', {
      name: 'Loading Parallel group',
    })
    expect(busy).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByRole('note')).toBeNull()
    expect(screen.getByLabelText('Parallel lanes')).toBeInTheDocument()
  })

  it('workflow-run-loading-parallel-minimum shows its busy parallel region', async () => {
    await boot('workflow-run-loading-parallel-minimum')
    const busy = await screen.findByRole('group', {
      name: 'Loading Workflow run',
    })
    expect(busy).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByLabelText('Parallel lanes')).toBeInTheDocument()
    expect(screen.queryByRole('note')).toBeNull()
  })

  it('workflow-editor-loading-minimum shows its busy region and scrollable canvas', async () => {
    await boot('workflow-editor-loading-minimum')
    const busy = await screen.findByRole('group', {
      name: 'Loading Workflow editor',
    })
    expect(busy).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByRole('note')).toBeNull()
    const canvas = screen.getByRole('region', {
      name: 'Loading workflow canvas',
    })
    expect(canvas.className).toContain('hd-thin-scroll')
  })
})
