import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
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

  it('renders workflow editor graph and inspector placeholders', () => {
    render(<WorkflowEditorLoadingPage />)
    const loading = screen.getByRole('group', { name: 'Loading Workflow editor' })
    expect(loading).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByLabelText('Workflow canvas')).toBeInTheDocument()
    expect(screen.getByLabelText('Node settings')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(loading.querySelectorAll('.hd-skel--shimmer').length).toBeGreaterThan(0)
  })

  it('renders workflow run graph and parallel loading variants', () => {
    const { rerender } = render(<WorkflowRunLoadingPage />)
    expect(screen.getByRole('group', { name: 'Loading Workflow run' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(screen.getByLabelText('Workflow steps')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled()

    rerender(<WorkflowRunParallelLoadingPage />)
    expect(screen.getByLabelText('Parallel lanes')).toBeInTheDocument()
    expect(document.querySelectorAll('.hd-lane').length).toBe(3)
  })

  it('renders parallel group lane placeholders', () => {
    render(<ParallelGroupLoadingPage />)
    const loading = screen.getByRole('group', { name: 'Loading Parallel group' })
    expect(loading).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: 'View prompt' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel all' })).toBeDisabled()
    expect(screen.getByLabelText('Parallel lanes')).toBeInTheDocument()
  })
})
