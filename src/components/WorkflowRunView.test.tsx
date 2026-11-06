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
    const graph = screen.getByRole('region', { name: 'Workflow graph' })
    expect(graph.querySelectorAll('path').length).toBeGreaterThan(0)
    expect(screen.queryByRole('img', { name: /Scan lockfiles/ })).not.toBeInTheDocument()
    const steps = screen.getByRole('list', { name: /Scan lockfiles/ })
    const items = within(steps).getAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual([
      'Scan lockfiles, Done, not selected',
      'Draft upgrade plan, Done, not selected',
      'Open pull request, Needs you, selected',
      'Notify, Pending, not selected',
      'Security reviewer, Done, not selected',
      'Docs checker, Not called, not selected',
    ])
    expect(items[2]).toHaveAttribute('aria-current', 'true')
    for (const item of items.filter((_, index) => index !== 2)) {
      expect(item).not.toHaveAttribute('aria-current')
    }
    expect(
      screen.getByRole('button', {
        name: 'Security reviewer, on demand node, done, not selected',
      }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', {
        name: 'Docs checker, on demand node, not called, not selected',
      }),
    ).toBeDisabled()
    const step = screen.getByRole('complementary', { name: 'Selected step' })
    expect(within(step).getByText('Open pull request')).toBeInTheDocument()
    expect(step).toHaveTextContent('812 passed in 71.40s')
    expect(step).toHaveTextContent('git push origin deps/audit-2026-11-03')
    expect(step).toHaveTextContent('Codex · gpt-6-astra · HarflowMCP')
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
