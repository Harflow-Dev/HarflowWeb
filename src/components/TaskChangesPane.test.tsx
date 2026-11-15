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
  pathBytesB64: null,
}

const CONFIG_ENTRY: TaskChangesEntryRef = {
  repositoryRoot: HARFLOW_WEB_ROOT,
  scope: 'committed_range',
  path: CONFIG_PY_PATH,
  pathBytesB64: null,
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
    turns: null,
    textPanels: null,
    onSelectEntry: () => undefined,
    onSelectTurn: () => undefined,
    onToggleRepo: () => undefined,
    onClosePane: () => undefined,
    onUnavailable: () => undefined,
    onSelectTab: () => undefined,
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

  it('marks Artifacts unavailable and lets Events switch the tab', async () => {
    const user = userEvent.setup()
    const onClosePane = vi.fn()
    const onUnavailable = vi.fn()
    const onSelectTab = vi.fn()
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
          selectedEntry: null,
          onClosePane,
          onUnavailable,
          onSelectTab,
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
    const events = screen.getByRole('tab', { name: 'Events' })
    expect(events).not.toHaveAttribute('aria-disabled')
    expect(events).toHaveAttribute('aria-selected', 'false')
    await user.click(events)
    expect(onSelectTab).toHaveBeenCalledWith('events')
    expect(onUnavailable).not.toHaveBeenCalledWith('Open Events')
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
          selectedEntry: QUEUE_ENTRY,
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
          selectedEntry: QUEUE_ENTRY,
        })}
      />,
    )
    expect(screen.getByText("This diff couldn't be read")).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Reload changes' }),
    ).toBeInTheDocument()
  })
})

describe('TaskChangesPane tablist', () => {
  function renderTabs(
    onUnavailable = vi.fn(),
    extra: Partial<TaskChangesPaneProps> = {},
  ) {
    const load = taskChangesLoadFor({
      taskId: RETRY_BUDGET_DONE_TASK_ID,
      selectedEntry: null,
      turnTaskId: null,
    })
    if (load.kind !== 'ready') throw new Error('expected ready')
    const onSelectTab = extra.onSelectTab ?? vi.fn()
    render(
      <TaskChangesPane
        {...paneProps({
          load,
          list: load.observation,
          onUnavailable,
          onSelectTab,
          ...extra,
        })}
      />,
    )
    return {
      changes: screen.getByRole('tab', { name: /Changes/ }),
      artifacts: screen.getByRole('tab', { name: 'Artifacts' }),
      events: screen.getByRole('tab', { name: 'Events' }),
      onUnavailable,
      onSelectTab,
    }
  }

  it('wires the selected tab to a labelled tabpanel with one tab stop', () => {
    const { changes, artifacts, events } = renderTabs()
    const panel = screen.getByRole('tabpanel')
    expect(changes).toHaveAttribute('aria-controls', panel.id)
    expect(panel).toHaveAttribute('aria-labelledby', changes.id)
    expect(changes).toHaveAttribute('tabindex', '0')
    expect(events).toHaveAttribute('tabindex', '-1')
    expect(artifacts).toHaveAttribute('tabindex', '-1')
  })

  it('moves focus through every tab, disabled ones included', async () => {
    const user = userEvent.setup()
    const { changes, artifacts, events } = renderTabs()
    changes.focus()
    await user.keyboard('{ArrowRight}')
    expect(artifacts).toHaveFocus()
    expect(artifacts).toHaveAttribute('tabindex', '0')
    expect(changes).toHaveAttribute('tabindex', '-1')
    await user.keyboard('{ArrowRight}')
    expect(events).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(changes).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(events).toHaveFocus()
    await user.keyboard('{Home}')
    expect(changes).toHaveFocus()
    await user.keyboard('{End}')
    expect(events).toHaveFocus()
  })

  it('activating Events by key selects the tab; Artifacts stay unavailable', async () => {
    const user = userEvent.setup()
    const { changes, artifacts, events, onUnavailable, onSelectTab } =
      renderTabs()
    events.focus()
    await user.keyboard('{Enter}')
    expect(onSelectTab).toHaveBeenCalledWith('events')
    await user.keyboard(' ')
    expect(onSelectTab).toHaveBeenCalledTimes(2)
    artifacts.focus()
    await user.keyboard(' ')
    expect(onUnavailable).toHaveBeenLastCalledWith('Artifacts')
    expect(changes).toHaveAttribute('aria-selected', 'true')
    expect(events).toHaveAttribute('aria-selected', 'false')
  })

  it('marks Events selected and labels the panel when paneTab is events', () => {
    const { changes, events } = renderTabs(vi.fn(), { paneTab: 'events' })
    const panel = screen.getByRole('tabpanel')
    expect(events).toHaveAttribute('aria-selected', 'true')
    expect(changes).toHaveAttribute('aria-selected', 'false')
    expect(panel).toHaveAttribute('aria-labelledby', events.id)
  })
})
