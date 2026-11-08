import { useState } from 'react'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  NIGHTLY_AUDIT_RUN_ID,
  SECURITY_REVIEWER_NODE_ID,
  nightlyAuditRun,
  workflowExecutionLoadFor,
} from '../adapters/mock/workflowExecutionFixtures'
import {
  asWorkflowId,
  asWorkflowNodeId,
  asWorkflowRunId,
  WORKFLOW_RUN_UNAVAILABLE,
  type WorkflowNodeId,
  type WorkflowRunLoad,
} from '../model'
import {
  effectiveWorkflowRunViewMode,
  workflowRunHasParallel,
  type WorkflowRunViewMode,
} from '../presentation'
import { WorkflowRunView } from './WorkflowRunView'
import {
  WORKFLOW_RUN_ACTION_EXPLANATION,
  WORKFLOW_RUN_CALL_EXPLANATION,
  WORKFLOW_RUN_LANE_EXPLANATION,
  WORKFLOW_RUN_PARALLEL_EXPLANATION,
  WORKFLOW_RUN_TOOL_EXPLANATION,
  WORKFLOW_RUN_ZOOM_EXPLANATION,
} from './workflowRunUnavailable'

afterEach(() => {
  cleanup()
})

describe('WorkflowRunView', () => {
  it('shows the nightly graph and blocks run mutations', async () => {
    const user = userEvent.setup()
    const load = workflowExecutionLoadFor(NIGHTLY_AUDIT_RUN_ID)
    render(<WorkflowRunView load={load} {...viewProps(load)} />)
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
    const reviewer = screen.getByRole('button', {
      name: 'Security reviewer, on demand node, done, not selected',
    })
    expect(reviewer).toBeEnabled()
    expect(reviewer).toHaveAttribute('aria-pressed', 'false')
    expect(reviewer).not.toHaveClass('is-selected')
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
    const zoom = screen.getByRole('group', { name: 'Zoom' })
    expect(zoom).toHaveTextContent('70%')
    const zoomOut = within(zoom).getByRole('button', { name: 'Zoom out' })
    const zoomIn = within(zoom).getByRole('button', { name: 'Zoom in' })
    for (const control of [approve, reject, pause, cancel, revise]) {
      expect(control).toBeDisabled()
      expect(control).toHaveAccessibleDescription(WORKFLOW_RUN_ACTION_EXPLANATION)
    }
    expect(parallel).toBeEnabled()
    expect(parallel).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Graph' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    for (const control of [zoomOut, zoomIn]) {
      expect(control).toBeDisabled()
      expect(control).toHaveAccessibleDescription(WORKFLOW_RUN_ZOOM_EXPLANATION)
      expect(control).not.toHaveAccessibleDescription(WORKFLOW_RUN_ACTION_EXPLANATION)
    }
    await user.click(approve)
    fireEvent.click(reject)
    fireEvent.click(pause)
    expect(within(step).getByText('Publish changes')).toBeInTheDocument()
  })

  it('does not show the nightly run for another identity', () => {
    render(
      <WorkflowRunView
        load={workflowExecutionLoadFor(asWorkflowRunId('wf-nightly-audit'))}
        {...viewProps(workflowExecutionLoadFor(asWorkflowRunId('wf-nightly-audit')))}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent(WORKFLOW_RUN_UNAVAILABLE)
    expect(screen.queryByText('Open pull request')).not.toBeInTheDocument()
    expect(screen.queryByText('812 passed')).not.toBeInTheDocument()
    expect(asWorkflowId('wf-nightly-audit')).not.toBe(nightlyAuditRun().runId)
  })

  it('selects the security reviewer inspector and closes back to the pull request', async () => {
    const user = userEvent.setup()
    render(<RunHarness />)
    await user.click(
      screen.getByRole('button', {
        name: 'Security reviewer, on demand node, done, not selected',
      }),
    )
    const pane = screen.getByRole('complementary', { name: 'Selected on-demand node' })
    expect(screen.getByRole('region', { name: 'Workflow graph' })).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Workflow graph' }).querySelectorAll('.is-selected'),
    ).toHaveLength(0)
    expect(pane).toHaveTextContent('Security reviewer')
    expect(pane).toHaveTextContent('On demand')
    expect(pane).toHaveTextContent(
      'Runs only when the orchestrator calls it, one call at a time.',
    )
    expect(pane).toHaveTextContent('Call 2 · Done · 01:12')
    expect(pane).toHaveTextContent('Call 1 · Done · 00:48')
    expect(pane).toHaveTextContent('Call 2 · Codex · gpt-6-astra · HarflowMCP')
    expect(pane.querySelector('.hd-msg-user')).toHaveTextContent(
      'Check the lockfile diff for packages with known advisories.',
    )
    expect(pane).toHaveTextContent(
      'Compared uv.lock against the previous commit. Two packages changed: httpx and pydantic. Neither has an open advisory.',
    )
    for (const token of ['uv.lock', 'httpx', 'pydantic']) {
      expect(within(pane).getByText(token).tagName).toBe('CODE')
    }
    const audit = within(pane).getByRole('button', { name: /pip-audit -r requirements.lock/ })
    expect(audit).toBeDisabled()
    expect(audit).toHaveAttribute('aria-expanded', 'false')
    expect(audit).toHaveAccessibleDescription(WORKFLOW_RUN_TOOL_EXPLANATION)
    expect(audit).toHaveTextContent('0:41')
    expect(within(audit).getByText('pip-audit -r requirements.lock').tagName).toBe('CODE')
    expect(audit.parentElement?.querySelector('.hd-tool__body')).toBeNull()
    expect(pane).toHaveTextContent('Done · no advisories · 01:12')
    expect(pane.querySelector('[data-highlighted="true"]')).toHaveTextContent(
      'Call 2 · Done · 01:12',
    )
    expect(pane.querySelector('[data-highlighted="false"]')).toHaveTextContent(
      'Call 1 · Done · 00:48',
    )
    const reviewer = screen.getByRole('button', {
      name: 'Security reviewer, on demand node, done, selected',
    })
    expect(reviewer).toHaveClass('is-selected')
    expect(reviewer).toHaveAttribute('aria-pressed', 'true')
    const steps = screen.getByRole('list', { name: /Scan lockfiles/ })
    const items = within(steps).getAllByRole('listitem')
    expect(items[2]).toHaveTextContent('Open pull request, Needs you, not selected')
    expect(items[2]).not.toHaveAttribute('aria-current')
    expect(items[4]).toHaveTextContent('Security reviewer, Done, selected')
    expect(items[4]).toHaveAttribute('aria-current', 'true')
    expect(screen.queryByRole('group', { name: 'Approval needed' })).not.toBeInTheDocument()
    await user.click(screen.getByText('Call 1 · Done · 00:48'))
    expect(pane).toHaveTextContent('Call 2 · Codex · gpt-6-astra · HarflowMCP')
    expect(pane).not.toHaveTextContent('Call 1 · Codex')
    const opens = screen.getAllByRole('button', { name: 'Open task' })
    expect(opens).toHaveLength(2)
    const message = screen.getByRole('textbox', { name: 'Message this node' })
    const send = screen.getByRole('button', { name: 'Send to Security reviewer' })
    const pause = screen.getByRole('button', { name: 'Pause' })
    const cancel = screen.getByRole('button', { name: 'Cancel run' })
    const more = screen.getByRole('button', { name: 'More actions' })
    const docs = screen.getByRole('button', {
      name: 'Docs checker, on demand node, not called, not selected',
    })
    for (const control of [message, send, ...opens]) {
      expect(control).toBeDisabled()
      expect(control).toHaveAccessibleDescription(WORKFLOW_RUN_CALL_EXPLANATION)
      expect(control).not.toHaveAttribute('href')
    }
    const zoom = screen.getByRole('group', { name: 'Zoom' })
    expect(zoom).toHaveTextContent('70%')
    const zoomOut = within(zoom).getByRole('button', { name: 'Zoom out' })
    const zoomIn = within(zoom).getByRole('button', { name: 'Zoom in' })
    for (const control of [pause, cancel, more, docs]) {
      expect(control).toBeDisabled()
      expect(control).toHaveAccessibleDescription(WORKFLOW_RUN_ACTION_EXPLANATION)
    }
    expect(screen.getByRole('button', { name: 'Parallel' })).toBeEnabled()
    for (const control of [zoomOut, zoomIn]) {
      expect(control).toBeDisabled()
      expect(control).toHaveAccessibleDescription(WORKFLOW_RUN_ZOOM_EXPLANATION)
    }
    expect(docs).not.toHaveAttribute('aria-pressed')
    await user.click(opens[0]!)
    await user.click(send)
    fireEvent.click(audit)
    expect(pane).toHaveTextContent('Done · no advisories · 01:12')
    expect(audit.parentElement?.querySelector('.hd-tool__body')).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Add retry budget to delivery queue' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    const step = screen.getByRole('complementary', { name: 'Selected step' })
    expect(within(step).getByText('Open pull request')).toBeInTheDocument()
    expect(within(step).getByRole('group', { name: 'Approval needed' })).toBeInTheDocument()
    expect(within(step).getByText('Publish changes')).toBeInTheDocument()
    const approve = within(step).getByRole('button', { name: 'Approve' })
    const reject = within(step).getByRole('button', { name: 'Reject' })
    const revise = within(step).getByRole('button', { name: 'Revise goal…' })
    for (const control of [approve, reject, revise]) {
      expect(control).toBeDisabled()
      expect(control).toHaveAccessibleDescription(WORKFLOW_RUN_ACTION_EXPLANATION)
    }
    expect(
      screen.getByRole('button', {
        name: 'Security reviewer, on demand node, done, not selected',
      }),
    ).toHaveAttribute('aria-pressed', 'false')
    expect(within(steps).getAllByRole('listitem')[2]).toHaveAttribute('aria-current', 'true')
    expect(within(steps).getAllByRole('listitem')[4]).not.toHaveAttribute('aria-current')
    expect(
      screen.getByRole('button', {
        name: 'Security reviewer, on demand node, done, not selected',
      }),
    ).toHaveFocus()
  })

  it('closes the inspector when the selected reviewer is activated again', () => {
    render(<RunHarness />)
    const reviewer = screen.getByRole('button', {
      name: 'Security reviewer, on demand node, done, not selected',
    })
    fireEvent.click(reviewer)
    expect(screen.getByRole('complementary', { name: 'Selected on-demand node' })).toBeInTheDocument()
    reviewer.blur()
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Security reviewer, on demand node, done, selected',
      }),
    )
    expect(screen.queryByRole('complementary', { name: 'Selected on-demand node' })).not.toBeInTheDocument()
    const step = screen.getByRole('complementary', { name: 'Selected step' })
    expect(within(step).getByText('Open pull request')).toBeInTheDocument()
    expect(within(step).getByRole('group', { name: 'Approval needed' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Security reviewer, on demand node, done, not selected',
      }),
    ).toHaveFocus()
  })

  it('shows new inspector text from a same-run update', () => {
    const run = nightlyAuditRun()
    const demand = run.onDemand[0]
    if (!demand) throw new Error('missing inspector')
    const initial: WorkflowRunLoad = { kind: 'ready', run }
    const updated: WorkflowRunLoad = {
      kind: 'ready',
      run: {
        ...run,
        onDemand: [
          {
            ...demand,
            call: { ...demand.call, result: 'Done · refreshed · 01:40' },
          },
        ],
      },
    }
    const { rerender } = render(
      <WorkflowRunView
        load={initial}
        selectedNodeId={SECURITY_REVIEWER_NODE_ID}
        {...viewProps(initial)}
      />,
    )
    expect(screen.getByText('Done · no advisories · 01:12')).toBeInTheDocument()
    rerender(
      <WorkflowRunView
        load={updated}
        selectedNodeId={SECURITY_REVIEWER_NODE_ID}
        {...viewProps(updated)}
      />,
    )
    expect(
      screen.getByRole('complementary', { name: 'Selected on-demand node' }),
    ).toHaveTextContent('Done · refreshed · 01:40')
    expect(screen.queryByText('Done · no advisories · 01:12')).not.toBeInTheDocument()
  })

  it('keeps the inspector when the same run observation changes', () => {
    const run = nightlyAuditRun()
    const initial: WorkflowRunLoad = { kind: 'ready', run }
    const updated: WorkflowRunLoad = {
      kind: 'ready',
      run: { ...run, progressLabel: 'Step 2 of 4 · 07:05' },
    }
    const { rerender } = render(
      <WorkflowRunView
        load={initial}
        selectedNodeId={SECURITY_REVIEWER_NODE_ID}
        {...viewProps(initial)}
      />,
    )
    expect(screen.getByText('Done · no advisories · 01:12')).toBeInTheDocument()
    rerender(
      <WorkflowRunView
        load={updated}
        selectedNodeId={SECURITY_REVIEWER_NODE_ID}
        {...viewProps(updated)}
      />,
    )
    expect(screen.getByText('Step 2 of 4 · 07:05')).toBeInTheDocument()
    expect(
      screen.getByRole('complementary', { name: 'Selected on-demand node' }),
    ).toHaveTextContent('Call 2 · Codex · gpt-6-astra · HarflowMCP')
    expect(run.selectedNodeId).not.toBe(SECURITY_REVIEWER_NODE_ID)
  })

  it('shows the default detail for an unknown node id', () => {
    render(
      <WorkflowRunView
        load={workflowExecutionLoadFor(NIGHTLY_AUDIT_RUN_ID)}
        selectedNodeId={asWorkflowNodeId('run-missing-node')}
        {...viewProps(workflowExecutionLoadFor(NIGHTLY_AUDIT_RUN_ID))}
      />,
    )
    const step = screen.getByRole('complementary', { name: 'Selected step' })
    expect(within(step).getByText('Publish changes')).toBeInTheDocument()
    expect(screen.queryByText('Done · no advisories · 01:12')).not.toBeInTheDocument()
    expect(screen.queryByText(/lockfile diff/)).not.toBeInTheDocument()
    const items = within(screen.getByRole('list', { name: /Scan lockfiles/ })).getAllByRole(
      'listitem',
    )
    expect(items[2]).toHaveAttribute('aria-current', 'true')
    expect(items[4]).not.toHaveAttribute('aria-current')
    expect(
      screen.getByRole('button', {
        name: 'Security reviewer, on demand node, done, not selected',
      }),
    ).toHaveAttribute('aria-pressed', 'false')
  })

  it('does not render call text stored under another node id', () => {
    const run = nightlyAuditRun()
    const demand = run.onDemand[0]
    if (!demand) throw new Error('missing inspector')
    const foreign = asWorkflowNodeId('run-other-reviewer')
    const tampered = { ...run, onDemand: [{ ...demand, nodeId: foreign }] }
    const load: WorkflowRunLoad = { kind: 'ready', run: tampered }
    const { rerender } = render(
      <WorkflowRunView load={load} selectedNodeId={foreign} {...viewProps(load)} />,
    )
    expect(screen.getByRole('complementary', { name: 'Selected step' })).toHaveTextContent(
      'Publish changes',
    )
    expect(screen.queryByText('Done · no advisories · 01:12')).not.toBeInTheDocument()
    rerender(
      <WorkflowRunView
        load={load}
        selectedNodeId={SECURITY_REVIEWER_NODE_ID}
        {...viewProps(load)}
      />,
    )
    expect(screen.getByRole('complementary', { name: 'Selected step' })).toHaveTextContent(
      'Open pull request',
    )
    expect(screen.queryByText(/no advisories/)).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Docs checker, on demand node, not called, not selected',
      }),
    ).toBeDisabled()
  })

  it('hides call content that is not the highlighted call', () => {
    const run = nightlyAuditRun()
    const demand = run.onDemand[0]
    if (!demand) throw new Error('missing inspector')
    const load: WorkflowRunLoad = {
      kind: 'ready',
      run: {
        ...run,
        onDemand: [{ ...demand, call: { ...demand.call, id: 'run-security-call-1' } }],
      },
    }
    render(
      <WorkflowRunView
        load={load}
        selectedNodeId={SECURITY_REVIEWER_NODE_ID}
        {...viewProps(load)}
      />,
    )
    expect(screen.getByText('Call 2 · Done · 01:12')).toBeInTheDocument()
    expect(screen.getByText('Call 1 · Done · 00:48')).toBeInTheDocument()
    expect(screen.queryByText(/lockfile diff/)).not.toBeInTheDocument()
    expect(screen.queryByText(/no advisories/)).not.toBeInTheDocument()
    expect(screen.queryByText('pip-audit -r requirements.lock')).not.toBeInTheDocument()
  })

  it('toggles Graph and Parallel with pressed state and keeps keyboard focus', async () => {
    const user = userEvent.setup()
    render(<RunHarness />)
    const graph = screen.getByRole('button', { name: 'Graph' })
    const parallel = screen.getByRole('button', { name: 'Parallel' })
    expect(graph).toHaveAttribute('aria-current', 'page')
    expect(graph).toHaveAttribute('aria-pressed', 'true')
    expect(parallel).toHaveAttribute('aria-pressed', 'false')
    await user.click(parallel)
    expect(parallel).toHaveFocus()
    expect(parallel).toHaveAttribute('aria-current', 'page')
    expect(parallel).toHaveAttribute('aria-pressed', 'true')
    expect(graph).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('region', { name: 'Parallel lanes' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Workflow graph' })).not.toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(parallel).toHaveFocus()
    await user.click(graph)
    expect(graph).toHaveFocus()
    expect(graph).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('region', { name: 'Workflow graph' })).toBeInTheDocument()
  })

  it('renders Parallel lane content from the observation', async () => {
    const user = userEvent.setup()
    render(<RunHarness />)
    await user.click(screen.getByRole('button', { name: 'Parallel' }))
    const lanes = screen.getByRole('region', { name: 'Parallel lanes' })
    expect(within(lanes).getByRole('region', { name: 'Scan Python deps' })).toHaveTextContent(
      'Codex · gpt-6-astra',
    )
    expect(within(lanes).getByRole('region', { name: 'Scan Python deps' })).toHaveTextContent(
      'Done · 4 updates · 02:14',
    )
    expect(within(lanes).getByRole('region', { name: 'Scan npm deps' })).toHaveTextContent(
      'Reading package-lock.json…',
    )
    expect(within(lanes).getByRole('region', { name: 'Draft upgrade PR' })).toHaveTextContent(
      'Waits for both scans',
    )
    expect(screen.queryByText('Codex · gpt-6')).not.toBeInTheDocument()
    const npm = within(lanes).getByRole('region', { name: 'Scan npm deps' })
    const workingGlyph = within(npm).getByText('Reading package-lock.json…')
      .previousElementSibling
    expect(workingGlyph).toHaveClass('hd-glyph', 'hd-glyph--running', 'is-animated')
  })

  it('shows new Parallel lane text from a same-run update', () => {
    const run = nightlyAuditRun()
    const parallel = run.parallel
    if (!parallel) throw new Error('missing parallel')
    const load: WorkflowRunLoad = { kind: 'ready', run }
    const { rerender } = render(
      <WorkflowRunView
        load={load}
        {...viewProps(load, 'parallel')}
      />,
    )
    expect(screen.getByText('Reading package-lock.json…')).toBeInTheDocument()
    const next = {
      ...parallel,
      lanes: parallel.lanes.map((lane) =>
        lane.id === 'lane-scan-npm'
          ? {
              ...lane,
              blocks: lane.blocks.map((block) =>
                block.kind === 'working'
                  ? { ...block, text: 'Reading package-lock.json… refreshed' }
                  : block,
              ),
            }
          : lane,
      ),
    }
    const updated: WorkflowRunLoad = {
      kind: 'ready',
      run: { ...run, parallel: next },
    }
    rerender(
      <WorkflowRunView load={updated} {...viewProps(updated, 'parallel')} />,
    )
    expect(screen.getByText('Reading package-lock.json… refreshed')).toBeInTheDocument()
    expect(screen.queryByText('Reading package-lock.json…')).not.toBeInTheDocument()
  })

  it('falls back to Graph when Parallel data is missing without borrowing lanes', () => {
    const run = { ...nightlyAuditRun(), parallel: null }
    const load: WorkflowRunLoad = { kind: 'ready', run }
    render(
      <WorkflowRunView load={load} {...viewProps(load, 'parallel')} />,
    )
    expect(screen.getByRole('region', { name: 'Workflow graph' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Parallel lanes' })).not.toBeInTheDocument()
    expect(screen.queryByText('Scan Python deps')).not.toBeInTheDocument()
    const parallel = screen.getByRole('button', { name: 'Parallel' })
    expect(parallel).toBeDisabled()
    expect(parallel).toHaveAccessibleDescription(WORKFLOW_RUN_PARALLEL_EXPLANATION)
    expect(parallel).not.toHaveAccessibleDescription(WORKFLOW_RUN_ACTION_EXPLANATION)
    expect(screen.getByRole('button', { name: 'Graph' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('falls back to Graph when Parallel lanes are an empty array', () => {
    const base = nightlyAuditRun()
    const run = {
      ...base,
      parallel: {
        lanes: [],
        workingLabel: 'Orchestrator is choosing the next node…',
        decisionAttemptsLabel: 'Decision attempts: 1 / 3',
      },
    }
    const load: WorkflowRunLoad = { kind: 'ready', run }
    render(<WorkflowRunView load={load} {...viewProps(load, 'parallel')} />)
    expect(screen.getByRole('region', { name: 'Workflow graph' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Parallel lanes' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Parallel' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Parallel' })).toHaveAccessibleDescription(
      WORKFLOW_RUN_PARALLEL_EXPLANATION,
    )
  })

  it('shows the Parallel footer from the observation', async () => {
    const user = userEvent.setup()
    render(<RunHarness />)
    await user.click(screen.getByRole('button', { name: 'Parallel' }))
    expect(screen.getByText('Orchestrator is choosing the next node…')).toBeInTheDocument()
    expect(screen.getByText('Decision attempts: 1 / 3')).toBeInTheDocument()
  })

  it('switches from Graph to Parallel with the keyboard', async () => {
    const user = userEvent.setup()
    render(<RunHarness />)
    const parallel = screen.getByRole('button', { name: 'Parallel' })
    parallel.focus()
    expect(parallel).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(parallel).toHaveAttribute('aria-current', 'page')
    expect(parallel).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('region', { name: 'Parallel lanes' })).toBeInTheDocument()
    expect(parallel).toHaveFocus()
  })

  it('preserves the selected node when returning from Parallel to Graph', async () => {
    const user = userEvent.setup()
    render(<RunHarness />)
    await user.click(
      screen.getByRole('button', {
        name: 'Security reviewer, on demand node, done, not selected',
      }),
    )
    expect(
      screen.getByRole('complementary', { name: 'Selected on-demand node' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Parallel' }))
    expect(screen.queryByRole('complementary', { name: 'Selected on-demand node' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Graph' }))
    expect(
      screen.getByRole('complementary', { name: 'Selected on-demand node' }),
    ).toHaveTextContent('Security reviewer')
    expect(
      screen.getByRole('button', {
        name: 'Security reviewer, on demand node, done, selected',
      }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('keeps Parallel lane actions and composers disabled without sending', async () => {
    const user = userEvent.setup()
    const onViewMode = vi.fn()
    const onSelectNode = vi.fn()
    const load = workflowExecutionLoadFor(NIGHTLY_AUDIT_RUN_ID)
    render(
      <WorkflowRunView
        load={load}
        {...viewProps(load, 'parallel')}
        onViewMode={onViewMode}
        onSelectNode={onSelectNode}
      />,
    )
    const actions = screen.getAllByRole('button', { name: 'Lane actions' })
    const sendCodex = screen.getByRole('button', { name: 'Send to Codex' })
    const sendClaude = screen.getByRole('button', { name: 'Send to Claude Code' })
    const messageCodex = screen.getByRole('textbox', { name: 'Message Codex' })
    const messageClaude = screen.getByRole('textbox', { name: 'Message Claude Code' })
    const pause = screen.getByRole('button', { name: 'Pause' })
    const cancel = screen.getByRole('button', { name: 'Cancel run' })
    const more = screen.getByRole('button', { name: 'More actions' })
    for (const control of [...actions, sendCodex, sendClaude, messageCodex, messageClaude]) {
      expect(control).toBeDisabled()
    }
    for (const control of [...actions, sendCodex, sendClaude]) {
      expect(control).toHaveAccessibleDescription(WORKFLOW_RUN_LANE_EXPLANATION)
    }
    for (const control of [pause, cancel, more]) {
      expect(control).toBeDisabled()
      expect(control).toHaveAccessibleDescription(WORKFLOW_RUN_ACTION_EXPLANATION)
    }
    const pip = screen.getByRole('button', { name: /pip-audit -r requirements.lock/ })
    expect(pip).toBeDisabled()
    expect(pip).toHaveAccessibleDescription(WORKFLOW_RUN_TOOL_EXPLANATION)
    await user.click(sendCodex)
    fireEvent.click(actions[0]!)
    fireEvent.click(pip)
    fireEvent.submit(sendCodex.closest('form')!)
    expect(onViewMode).not.toHaveBeenCalled()
    expect(onSelectNode).not.toHaveBeenCalled()
    expect(screen.getByText('Done · 4 updates · 02:14')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Add retry budget/ })).not.toBeInTheDocument()
  })
})

function viewProps(
  load: WorkflowRunLoad,
  viewMode: WorkflowRunViewMode = 'graph',
) {
  return {
    activeView: effectiveWorkflowRunViewMode(viewMode, load),
    parallelAvailable: load.kind === 'ready' && workflowRunHasParallel(load.run),
  }
}

function RunHarness() {
  const [selectedNodeId, setSelectedNodeId] = useState<WorkflowNodeId | null>(null)
  const [viewMode, setViewMode] = useState<WorkflowRunViewMode>('graph')
  const load = workflowExecutionLoadFor(NIGHTLY_AUDIT_RUN_ID)
  return (
    <WorkflowRunView
      load={load}
      selectedNodeId={selectedNodeId}
      {...viewProps(load, viewMode)}
      onSelectNode={setSelectedNodeId}
      onViewMode={setViewMode}
    />
  )
}
