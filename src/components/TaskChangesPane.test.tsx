import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CONFIG_PY_PATH,
  HARFLOW_WEB_ROOT,
  QUEUE_PY_PATH,
  emptyDiffChangesLoad,
  taskChangesLoadFor,
  unavailableDiffChangesLoad,
} from '../adapters/mock/taskChangesFixtures'
import {
  RETRY_BUDGET_DONE_TASK_ID,
  retryBudgetCompletedObservation,
  slotReleaseObservation,
} from '../adapters/mock/taskFixtures'
import type { TaskChangesEntryRef } from '../model'
import { TASK_ARTIFACTS_UNAVAILABLE_ID } from './taskUnavailable'
import { TaskChangesPane, type TaskChangesPaneProps } from './TaskChangesPane'

afterEach(() => {
  cleanup()
})

const QUEUE_ENTRY: TaskChangesEntryRef = {
  repositoryRoot: HARFLOW_WEB_ROOT,
  scope: 'committed_range',
  path: QUEUE_PY_PATH,
}

const CONFIG_ENTRY: TaskChangesEntryRef = {
  repositoryRoot: HARFLOW_WEB_ROOT,
  scope: 'committed_range',
  path: CONFIG_PY_PATH,
}

const doneTask = retryBudgetCompletedObservation()

function paneProps(
  overrides: Partial<TaskChangesPaneProps> = {},
): TaskChangesPaneProps {
  return {
    load: { kind: 'loading' },
    list: null,
    taskObservation: doneTask,
    selectedEntry: null,
    expandedRepos: [HARFLOW_WEB_ROOT],
    onSelectEntry: () => undefined,
    onSelectTab: () => undefined,
    onSelectTurn: () => undefined,
    onToggleRepo: () => undefined,
    onClosePane: () => undefined,
    onUnavailable: () => undefined,
    ...overrides,
  }
}

describe('TaskChangesPane', () => {
  it('shows the approved Changes loading skeleton before a list arrives', () => {
    render(<TaskChangesPane {...paneProps()} />)
    const busy = screen.getByRole('group', { name: 'Reading stored changes' })
    expect(busy).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByText(/proposal/)).toBeNull()
    expect(screen.queryByText(QUEUE_PY_PATH)).toBeNull()
  })

  it('renders file rows, the Changes count, and literal HTML-like / Unicode diff text', async () => {
    const user = userEvent.setup()
    const onSelectEntry = vi.fn()
    const onUnavailable = vi.fn()
    const load = taskChangesLoadFor({
      taskId: RETRY_BUDGET_DONE_TASK_ID,
      selectedEntry: CONFIG_ENTRY,
      turnTaskId: null,
    })
    if (load.kind !== 'ready') throw new Error('expected ready')
    render(
      <TaskChangesPane
        {...paneProps({
          load,
          list: load.observation,
          selectedEntry: CONFIG_ENTRY,
          onSelectEntry,
          onUnavailable,
        })}
      />,
    )
    expect(screen.getByRole('tab', { name: 'Changes 4' })).toBeInTheDocument()
    expect(screen.getByText(QUEUE_PY_PATH)).toBeInTheDocument()
    const configRow = screen.getByRole('button', { name: new RegExp(CONFIG_PY_PATH) })
    expect(configRow).toHaveTextContent('+2')
    expect(configRow).toHaveTextContent('\u22120')
    const script = screen.getByText(/<script>alert\('x'\)<\/script>/)
    expect(script.tagName).not.toBe('SCRIPT')
    expect(screen.getByText(/café/)).toBeInTheDocument()
    expect(screen.getByText(/日本語/)).toBeInTheDocument()
    expect(document.querySelector('script')).toBeNull()

    await user.click(screen.getByRole('button', { name: new RegExp(QUEUE_PY_PATH) }))
    expect(onSelectEntry).toHaveBeenCalledWith(QUEUE_ENTRY)
    expect(onUnavailable).not.toHaveBeenCalled()
  })

  it('keeps the file list mounted while the selected diff loads', async () => {
    const user = userEvent.setup()
    const onSelectEntry = vi.fn()
    const ready = taskChangesLoadFor({
      taskId: RETRY_BUDGET_DONE_TASK_ID,
      selectedEntry: QUEUE_ENTRY,
      turnTaskId: null,
    })
    if (ready.kind !== 'ready') throw new Error('expected ready')
    const { rerender } = render(
      <TaskChangesPane
        {...paneProps({
          load: ready,
          list: ready.observation,
          selectedEntry: QUEUE_ENTRY,
          onSelectEntry,
        })}
      />,
    )
    expect(
      screen.getByRole('group', { name: `Diff of ${QUEUE_PY_PATH}` }),
    ).toBeInTheDocument()

    const configButton = screen.getByRole('button', {
      name: new RegExp(CONFIG_PY_PATH),
    })
    configButton.focus()
    expect(configButton).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onSelectEntry).toHaveBeenCalledWith(CONFIG_ENTRY)

    rerender(
      <TaskChangesPane
        {...paneProps({
          load: { kind: 'loading' },
          list: ready.observation,
          selectedEntry: CONFIG_ENTRY,
          onSelectEntry,
        })}
      />,
    )
    expect(
      screen.getByRole('button', { name: new RegExp(CONFIG_PY_PATH) }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('group', { name: `Diff of ${QUEUE_PY_PATH}` }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('group', { name: 'Reading diff' }),
    ).toHaveAttribute('aria-busy', 'true')

    const configReady = taskChangesLoadFor({
      taskId: RETRY_BUDGET_DONE_TASK_ID,
      selectedEntry: CONFIG_ENTRY,
      turnTaskId: null,
    })
    rerender(
      <TaskChangesPane
        {...paneProps({
          load: configReady,
          list: ready.observation,
          selectedEntry: CONFIG_ENTRY,
          onSelectEntry,
        })}
      />,
    )
    expect(
      screen.getByRole('group', { name: `Diff of ${CONFIG_PY_PATH}` }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('group', { name: `Diff of ${QUEUE_PY_PATH}` }),
    ).not.toBeInTheDocument()
  })

  it('marks Artifacts unavailable, selects Events, and closes the pane', async () => {
    const user = userEvent.setup()
    const onSelectTab = vi.fn()
    const onClosePane = vi.fn()
    const onUnavailable = vi.fn()
    const load = taskChangesLoadFor({
      taskId: RETRY_BUDGET_DONE_TASK_ID,
      selectedEntry: null,
      turnTaskId: null,
    })
    if (load.kind !== 'ready') throw new Error('expected ready')
    render(
      <TaskChangesPane
        {...paneProps({
          load,
          list: load.observation,
          selectedEntry: load.observation.selectedEntry,
          onSelectTab,
          onClosePane,
          onUnavailable,
        })}
      />,
    )
    const artifacts = screen.getByRole('tab', { name: 'Artifacts' })
    expect(artifacts).toHaveAttribute('aria-disabled', 'true')
    expect(artifacts).toHaveAttribute(
      'aria-describedby',
      TASK_ARTIFACTS_UNAVAILABLE_ID,
    )
    await user.click(artifacts)
    expect(onUnavailable).toHaveBeenCalledWith('Artifacts')
    await user.click(screen.getByRole('tab', { name: 'Events' }))
    expect(onSelectTab).toHaveBeenCalledWith('events')
    await user.click(screen.getByRole('button', { name: 'Close right pane' }))
    expect(onClosePane).toHaveBeenCalled()
  })

  it('shows running copy instead of a capture while the task is live', () => {
    render(
      <TaskChangesPane
        {...paneProps({ taskObservation: slotReleaseObservation() })}
      />,
    )
    expect(
      screen.getByText('No changes to show while this runs'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Reading stored changes' })).toBeNull()
  })

  it('distinguishes empty diff lines from a text-mode refusal', () => {
    const empty = emptyDiffChangesLoad(RETRY_BUDGET_DONE_TASK_ID)
    if (empty.kind !== 'ready') throw new Error('expected ready')
    const { rerender } = render(
      <TaskChangesPane
        {...paneProps({
          load: empty,
          list: empty.observation,
          selectedEntry: empty.observation.selectedEntry,
        })}
      />,
    )
    expect(
      screen.getByRole('group', { name: `Diff of ${QUEUE_PY_PATH}` }),
    ).toBeInTheDocument()
    expect(
      screen.queryByText("This diff couldn't be read"),
    ).not.toBeInTheDocument()

    const missing = unavailableDiffChangesLoad(RETRY_BUDGET_DONE_TASK_ID)
    if (missing.kind !== 'ready') throw new Error('expected ready')
    rerender(
      <TaskChangesPane
        {...paneProps({
          load: missing,
          list: missing.observation,
          selectedEntry: missing.observation.selectedEntry,
        })}
      />,
    )
    expect(screen.getByText("This diff couldn't be read")).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Reload changes' }),
    ).toBeInTheDocument()
  })
})
