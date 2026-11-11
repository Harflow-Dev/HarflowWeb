import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ParallelGroupLoadingPage,
  WorkflowRunLoadingPage,
  WorkflowRunParallelLoadingPage,
} from './skeletonWorkflowRun'
import {
  WorkflowEditorLoadingPage,
  WorkflowsLoadingPage,
} from './skeletonWorkflows'

afterEach(() => {
  cleanup()
})

describe('Workflow loading skeletons', () => {
  it('renders workflows list placeholders with real title chrome', () => {
    render(<WorkflowsLoadingPage />)
    const loading = screen.getByRole('group', { name: 'Loading Workflows' })
    expect(loading).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('heading', { name: 'Workflows' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New workflow' })).toBeDisabled()
    expect(loading.querySelectorAll('.hd-list-row[aria-hidden="true"]').length).toBe(5)
  })

  it('keeps Back enabled in the loading editor', async () => {
    const onClose = vi.fn()
    render(<WorkflowEditorLoadingPage onClose={onClose} />)
    const back = screen.getByRole('button', { name: 'Workflows' })
    expect(back).toBeEnabled()
    await userEvent.setup().click(back)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'More actions' })).toBeDisabled()
  })

  it('renders workflow editor graph and inspector placeholders', () => {
    render(<WorkflowEditorLoadingPage onClose={() => undefined} />)
    const loading = screen.getByRole('group', { name: 'Loading Workflow editor' })
    expect(loading).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByLabelText('Loading workflow canvas')).toBeInTheDocument()
    expect(screen.getByLabelText('Loading node settings')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(loading.querySelectorAll('.hd-skel--shimmer').length).toBeGreaterThan(0)
  })

  it('renders workflow run graph and parallel loading variants', () => {
    const { rerender } = render(<WorkflowRunLoadingPage />)
    expect(screen.getByRole('group', { name: 'Loading Workflow run' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(screen.getByLabelText('Loading workflow graph')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled()
    expect(screen.getByText(/Loading workflow run/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'More actions' })).toBeDisabled()
    expect(screen.getByRole('textbox', { name: 'Message this node' })).toBeDisabled()
    expect(screen.getByLabelText('Loading selected node')).toBeInTheDocument()

    rerender(<WorkflowRunParallelLoadingPage />)
    expect(screen.getByLabelText('Parallel lanes')).toBeInTheDocument()
    expect(document.querySelectorAll('.hd-lane').length).toBe(3)
    expect(screen.getAllByRole('textbox', { name: 'Message this lane' })).toHaveLength(3)
  })

  it('renders parallel group lane placeholders', () => {
    render(<ParallelGroupLoadingPage />)
    const loading = screen.getByRole('group', { name: 'Loading Parallel group' })
    expect(loading).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: 'View prompt' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel all' })).toBeDisabled()
    expect(screen.getByLabelText('Parallel lanes')).toBeInTheDocument()
    expect(screen.getByText(/Loading parallel group/)).toBeInTheDocument()
  })
})
