import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import {
  NIGHTLY_AUDIT_RUN_ID,
  nightlyAuditRun,
  workflowExecutionLoadFor,
} from '../adapters/mock/workflowExecutionFixtures'
import { asWorkflowId, asWorkflowRunId, WORKFLOW_RUN_UNAVAILABLE } from '../model'
import { WorkflowRunView } from './WorkflowRunView'
import { WORKFLOW_RUN_ACTION_EXPLANATION } from './workflowRunUnavailable'

afterEach(() => {
  cleanup()
})

describe('WorkflowRunView', () => {
  it('shows the nightly graph and blocks run mutations', async () => {
    const user = userEvent.setup()
    const load = workflowExecutionLoadFor(NIGHTLY_AUDIT_RUN_ID)
    render(<WorkflowRunView load={load} />)
    expect(screen.getByText('Nightly dependency audit')).toBeInTheDocument()
    expect(screen.getByText('Step 2 of 4 · 06:31')).toBeInTheDocument()
    const graph = screen.getByRole('img', { name: /Scan lockfiles/ })
    expect(graph).toHaveTextContent('Draft upgrade plan')
    expect(graph).toHaveTextContent('Open pull request')
    expect(graph).toHaveTextContent('Notify')
    expect(graph.querySelectorAll('path').length).toBeGreaterThan(0)
    const step = screen.getByRole('complementary', { name: 'Selected step' })
    expect(within(step).getByText('Open pull request')).toBeInTheDocument()
    expect(step).toHaveTextContent('812 passed in 71.40s')
    expect(step).toHaveTextContent('git push origin audit/2026-11-03')
    const approve = within(step).getByRole('button', { name: 'Approve' })
    const reject = within(step).getByRole('button', { name: 'Reject' })
    const pause = screen.getByRole('button', { name: 'Pause' })
    const cancel = screen.getByRole('button', { name: 'Cancel run' })
    const parallel = screen.getByRole('button', { name: 'Parallel' })
    const revise = screen.getByRole('button', { name: 'Revise goal…' })
    for (const control of [approve, reject, pause, cancel, parallel, revise]) {
      expect(control).toBeDisabled()
      expect(control).toHaveAccessibleDescription(WORKFLOW_RUN_ACTION_EXPLANATION)
    }
    await user.click(approve)
    fireEvent.click(reject)
    fireEvent.click(pause)
    expect(within(step).getByText('Publish changes')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Graph' })).toHaveAttribute('aria-current', 'page')
  })

  it('does not show the nightly run for another identity', () => {
    render(
      <WorkflowRunView
        load={workflowExecutionLoadFor(asWorkflowRunId('wf-nightly-audit'))}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent(WORKFLOW_RUN_UNAVAILABLE)
    expect(screen.queryByText('Open pull request')).not.toBeInTheDocument()
    expect(screen.queryByText('812 passed')).not.toBeInTheDocument()
    expect(asWorkflowId('wf-nightly-audit')).not.toBe(nightlyAuditRun().runId)
  })
})
