import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CONFIG_PY_PATH,
  QUEUE_PY_PATH,
  emptyDiffChangesLoad,
  taskChangesLoadFor,
  unavailableDiffChangesLoad,
} from '../adapters/mock/taskChangesFixtures'
import { RETRY_BUDGET_DONE_TASK_ID } from '../adapters/mock/taskFixtures'
import { TaskChangesPane } from './TaskChangesPane'

afterEach(() => {
  cleanup()
})

describe('TaskChangesPane', () => {
  it('renders file rows, counts, and literal HTML-like / Unicode diff text', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onUnavailable = vi.fn()
    const load = taskChangesLoadFor({
      taskId: RETRY_BUDGET_DONE_TASK_ID,
      selectedPath: CONFIG_PY_PATH,
    })
    if (load.kind !== 'ready') throw new Error('expected ready')
    render(
      <TaskChangesPane
        load={load}
        files={load.observation.files}
        selectedPath={CONFIG_PY_PATH}
        onSelectFile={onSelect}
        onUnavailable={onUnavailable}
      />,
    )
    const files = screen.getByRole('list', { name: 'Changed files' })
    const configRow = within(files).getByRole('button', {
      name: CONFIG_PY_PATH,
    })
    expect(configRow).toHaveTextContent('+2')
    expect(configRow).toHaveTextContent('\u22120')
    const script = screen.getByText(/<script>alert\('x'\)<\/script>/)
    expect(script.tagName).not.toBe('SCRIPT')
    expect(screen.getByText(/café/)).toBeInTheDocument()
    expect(screen.getByText(/日本語/)).toBeInTheDocument()
    expect(document.querySelector('script')).toBeNull()

    await user.click(
      within(files).getByRole('button', { name: QUEUE_PY_PATH }),
    )
    expect(onSelect).toHaveBeenCalledWith(QUEUE_PY_PATH)
    expect(onUnavailable).not.toHaveBeenCalled()
  })

  it('keeps the file list mounted while the selected diff loads', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const ready = taskChangesLoadFor({
      taskId: RETRY_BUDGET_DONE_TASK_ID,
      selectedPath: QUEUE_PY_PATH,
    })
    if (ready.kind !== 'ready') throw new Error('expected ready')
    const { rerender } = render(
      <TaskChangesPane
        load={ready}
        files={ready.observation.files}
        selectedPath={QUEUE_PY_PATH}
        onSelectFile={onSelect}
        onUnavailable={() => undefined}
      />,
    )
    expect(
      screen.getByRole('group', { name: 'Diff of queue.py' }),
    ).toBeInTheDocument()

    const configButton = screen.getByRole('button', { name: CONFIG_PY_PATH })
    configButton.focus()
    expect(configButton).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith(CONFIG_PY_PATH)

    rerender(
      <TaskChangesPane
        load={{ kind: 'loading' }}
        files={ready.observation.files}
        selectedPath={CONFIG_PY_PATH}
        onSelectFile={onSelect}
        onUnavailable={() => undefined}
      />,
    )
    const files = screen.getByRole('list', { name: 'Changed files' })
    expect(
      within(files).getByRole('button', { name: CONFIG_PY_PATH }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('group', { name: 'Diff of queue.py' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(/Loading changes… \(proposal/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: CONFIG_PY_PATH }),
    ).toBeInTheDocument()

    const configReady = taskChangesLoadFor({
      taskId: RETRY_BUDGET_DONE_TASK_ID,
      selectedPath: CONFIG_PY_PATH,
    })
    rerender(
      <TaskChangesPane
        load={configReady}
        files={ready.observation.files}
        selectedPath={CONFIG_PY_PATH}
        onSelectFile={onSelect}
        onUnavailable={() => undefined}
      />,
    )
    expect(
      screen.getByRole('group', { name: 'Diff of config.py' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('group', { name: 'Diff of queue.py' }),
    ).not.toBeInTheDocument()
  })

  it('distinguishes empty from unavailable diff content', () => {
    const empty = emptyDiffChangesLoad(RETRY_BUDGET_DONE_TASK_ID)
    if (empty.kind !== 'ready') throw new Error('expected ready')
    const { rerender } = render(
      <TaskChangesPane
        load={empty}
        files={empty.observation.files}
        selectedPath={empty.observation.selectedPath}
        onSelectFile={() => undefined}
        onUnavailable={() => undefined}
      />,
    )
    expect(
      screen.getByText('No recorded diff lines for this file.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('group')).not.toBeInTheDocument()

    const missing = unavailableDiffChangesLoad(RETRY_BUDGET_DONE_TASK_ID)
    if (missing.kind !== 'ready') throw new Error('expected ready')
    rerender(
      <TaskChangesPane
        load={missing}
        files={missing.observation.files}
        selectedPath={missing.observation.selectedPath}
        onSelectFile={() => undefined}
        onUnavailable={() => undefined}
      />,
    )
    expect(
      screen.getByText('No recorded diff is mapped for this path.'),
    ).toBeInTheDocument()
  })
})
