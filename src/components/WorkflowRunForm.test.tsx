import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { asRepositoryId, seedWorkflowRunDraft } from '../model'
import {
  RELEASE_WORKFLOW_ID,
  workflowRunLoadFor,
} from '../adapters/mock/workflowRunFixtures'
import { WorkflowRunForm, WORKFLOW_RUN_EXPLANATION } from './WorkflowRunForm'

function releaseContext() {
  const load = workflowRunLoadFor(RELEASE_WORKFLOW_ID)
  if (load.kind !== 'ready') throw new Error('release fixture')
  return load.context
}

afterEach(() => {
  cleanup()
})

describe('WorkflowRunForm', () => {
  it('keeps the exact task text and explains the disabled run', async () => {
    const user = userEvent.setup()
    const context = releaseContext()
    const onTask = vi.fn()
    const draft = seedWorkflowRunDraft(
      {
        task: '',
        goal: '',
        goalOpen: true,
        repositoryId: null,
        overrideId: null,
        seeded: false,
        touched: false,
      },
      context,
    )
    const { rerender } = render(
      <WorkflowRunForm
        workflows={[]}
        context={context}
        draft={draft}
        onOpen={vi.fn()}
        onTask={onTask}
        onGoal={vi.fn()}
        onGoalOpen={vi.fn()}
        onRepository={vi.fn()}
        onOverride={vi.fn()}
      />,
    )
    const task = screen.getByLabelText(/Task/)
    fireEvent.change(task, { target: { value: '  spaced  ' } })
    expect(onTask).toHaveBeenCalledWith('  spaced  ')
    rerender(
      <WorkflowRunForm
        workflows={[]}
        context={context}
        draft={{ ...draft, task: '   ' }}
        onOpen={vi.fn()}
        onTask={onTask}
        onGoal={vi.fn()}
        onGoalOpen={vi.fn()}
        onRepository={vi.fn()}
        onOverride={vi.fn()}
      />,
    )
    expect(screen.getByLabelText(/Task/)).toHaveValue('   ')
    expect(screen.getByRole('alert')).toHaveTextContent('Task is required.')
    const run = screen.getByRole('button', { name: 'Run workflow' })
    expect(run).toBeDisabled()
    expect(run).toHaveAccessibleDescription(WORKFLOW_RUN_EXPLANATION)
    await user.click(run)
    expect(
      screen.getByText('Claude Code · Can edit this repo · Network: not controlled'),
    ).toBeInTheDocument()
    expect(screen.getByText('Codex · Read-only · Sandboxed')).toBeInTheDocument()
    expect(screen.getByText(/do not claim enforcement/)).toBeInTheDocument()
  })

  it('collapses the goal without dropping its text and blocks the custom override', async () => {
    const user = userEvent.setup()
    const context = releaseContext()
    const onGoal = vi.fn()
    const onGoalOpen = vi.fn()
    const onOverride = vi.fn()
    const draft = {
      ...seedWorkflowRunDraft(
        {
          task: '',
          goal: '',
          goalOpen: true,
          repositoryId: null,
          overrideId: null,
          seeded: false,
          touched: false,
        },
        context,
      ),
      goal: 'keep goal',
    }
    const { rerender } = render(
      <WorkflowRunForm
        workflows={[{ id: context.workflowId, title: context.title, description: '', nodeCount: 5 }]}
        context={context}
        draft={draft}
        onOpen={vi.fn()}
        onTask={vi.fn()}
        onGoal={onGoal}
        onGoalOpen={onGoalOpen}
        onRepository={vi.fn()}
        onOverride={onOverride}
      />,
    )
    const goal = screen.getByLabelText('Goal')
    expect(goal).toHaveValue('keep goal')
    const toggle = screen.getByRole('button', { name: 'Goal (optional)' })
    toggle.focus()
    expect(toggle).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onGoalOpen).toHaveBeenCalledWith(false)
    rerender(
      <WorkflowRunForm
        workflows={[]}
        context={context}
        draft={{ ...draft, goalOpen: false }}
        onOpen={vi.fn()}
        onTask={vi.fn()}
        onGoal={onGoal}
        onGoalOpen={onGoalOpen}
        onRepository={vi.fn()}
        onOverride={onOverride}
      />,
    )
    expect(screen.queryByLabelText('Goal')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Goal (optional)' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    rerender(
      <WorkflowRunForm
        workflows={[]}
        context={context}
        draft={{ ...draft, goalOpen: true }}
        onOpen={vi.fn()}
        onTask={vi.fn()}
        onGoal={onGoal}
        onGoalOpen={onGoalOpen}
        onRepository={vi.fn()}
        onOverride={onOverride}
      />,
    )
    expect(screen.getByLabelText('Goal')).toHaveValue('keep goal')

    await user.click(screen.getByRole('button', { name: 'Orchestrator: saved' }))
    const custom = screen.getByRole('menuitem', { name: /Custom orchestrator/ })
    expect(custom).toBeDisabled()
    expect(custom).toHaveAccessibleDescription(
      /does not replace the saved orchestrator/,
    )
    await user.click(custom)
    expect(onOverride).not.toHaveBeenCalled()
    const saved = screen.getByRole('menuitem', { name: /^Orchestrator: saved/ })
    saved.focus()
    expect(saved).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onOverride).toHaveBeenCalledWith('saved')
  })

  it('hides facts when the repository or override is no longer valid', () => {
    const context = releaseContext()
    const mac = asRepositoryId('repo-mac')
    const draft = {
      ...seedWorkflowRunDraft(
        {
          task: '',
          goal: '',
          goalOpen: true,
          repositoryId: null,
          overrideId: null,
          seeded: false,
          touched: false,
        },
        context,
      ),
      task: '  alpha  ',
      goal: 'keep goal',
      repositoryId: mac,
      overrideId: 'saved' as const,
      touched: true,
    }
    const removed = {
      ...context,
      repositories: context.repositories.filter((item) => item.id !== mac),
    }
    const { rerender } = render(
      <WorkflowRunForm
        workflows={[]}
        context={removed}
        draft={draft}
        onOpen={vi.fn()}
        onTask={vi.fn()}
        onGoal={vi.fn()}
        onGoalOpen={vi.fn()}
        onRepository={vi.fn()}
        onOverride={vi.fn()}
      />,
    )
    expect(screen.getByLabelText(/Task/)).toHaveValue('  alpha  ')
    expect(screen.getByLabelText('Goal')).toHaveValue('keep goal')
    expect(screen.getByRole('button', { name: 'Repository' })).toBeInTheDocument()
    expect(
      screen.getByText('Permissions for this choice are unavailable.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Sandboxed/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Network: not controlled/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Run workflow' })).toBeDisabled()

    rerender(
      <WorkflowRunForm
        workflows={[]}
        context={{
          ...context,
          overrides: context.overrides.map((item) =>
            item.id === 'saved' ? { ...item, available: false } : item,
          ),
        }}
        draft={draft}
        onOpen={vi.fn()}
        onTask={vi.fn()}
        onGoal={vi.fn()}
        onGoalOpen={vi.fn()}
        onRepository={vi.fn()}
        onOverride={vi.fn()}
      />,
    )
    expect(screen.getByLabelText(/Task/)).toHaveValue('  alpha  ')
    expect(screen.getByLabelText('Goal')).toHaveValue('keep goal')
    expect(screen.getByRole('button', { name: 'HarflowMac' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Orchestrator: saved' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Permissions for this choice are unavailable.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Read-only/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Run workflow' })).toBeDisabled()
  })
})
