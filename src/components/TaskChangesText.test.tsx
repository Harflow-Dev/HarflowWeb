import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BIG_MODULE_ENTRY,
  CONFIG_ENTRY,
  HARFLOW_MCP_ROOT,
  TEST_ENTRY,
  textSpecimenPanels,
} from '../adapters/mock/taskChangesFixtures'
import { singleDoc } from '../adapters/mock/taskChangesFixtureDocs'
import { rowStatesDoc } from '../adapters/mock/taskChangesFixtureDocs'
import {
  bigModuleText,
  configChunkText,
} from '../adapters/mock/taskChangesFixtureText'
import { retryBudgetCompletedObservation } from '../adapters/mock/taskFixtures'
import {
  asTaskId,
  type TaskChangesObservation,
  type TaskChangesTextObservation,
  type TaskChangesTextPanel,
} from '../model'
import { TaskChangesPane, type TaskChangesPaneProps } from './TaskChangesPane'

afterEach(() => {
  cleanup()
})

const TASK = asTaskId('task-text-mode')

function props(
  list: TaskChangesObservation,
  extra: Partial<TaskChangesPaneProps>,
): TaskChangesPaneProps {
  return {
    load: { kind: 'ready', observation: list },
    list,
    taskObservation: retryBudgetCompletedObservation(),
    selectedEntry: null,
    expandedRepos: [],
    turns: null,
    textPanels: null,
    onSelectEntry: () => undefined,
    onSelectTab: () => undefined,
    onSelectTurn: () => undefined,
    onToggleRepo: () => undefined,
    onClosePane: () => undefined,
    onUnavailable: () => undefined,
    ...extra,
  }
}

function withText(
  doc: TaskChangesObservation,
  text: TaskChangesTextObservation,
): TaskChangesObservation {
  return { ...doc, text }
}

describe('text mode in the Changes pane', () => {
  it('shows how much of a paged chunk was read and an unavailable Read more', async () => {
    const user = userEvent.setup()
    const onUnavailable = vi.fn()
    const doc = withText(singleDoc(TASK), configChunkText())
    render(
      <TaskChangesPane
        {...props(doc, { selectedEntry: CONFIG_ENTRY, onUnavailable })}
      />,
    )
    expect(screen.getByText('Read 32 KiB of 48 KiB stored')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Read more' }))
    expect(onUnavailable).toHaveBeenCalledWith('Read more')
  })

  it('ends a file-limit text with the stored-text tail and no Read more', () => {
    const doc = withText(rowStatesDoc(TASK), bigModuleText())
    render(
      <TaskChangesPane
        {...props(doc, {
          selectedEntry: BIG_MODULE_ENTRY,
          expandedRepos: [HARFLOW_MCP_ROOT],
        })}
      />,
    )
    expect(
      screen.getByText('Stored text ends here · 64 KiB of a larger patch'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Read more' })).toBeNull()
  })

  it('draws a plain chunk with no tail once every byte was read', () => {
    const complete: TaskChangesTextObservation = {
      ...configChunkText(),
      hasMore: false,
      returnedBytes: 49152,
    }
    render(
      <TaskChangesPane
        {...props(withText(singleDoc(TASK), complete), {
          selectedEntry: CONFIG_ENTRY,
        })}
      />,
    )
    expect(screen.queryByText(/stored/)).toBeNull()
    expect(screen.queryByRole('button', { name: 'Read more' })).toBeNull()
  })

  it('draws the seeded specimen stack: loading, chunk, then refusal', () => {
    const panels: readonly TaskChangesTextPanel[] = textSpecimenPanels()
    render(
      <TaskChangesPane
        {...props(singleDoc(TASK), { textPanels: panels })}
      />,
    )
    const pane = screen.getByRole('complementary', { name: 'Task details' })
    expect(
      within(pane).getByRole('group', { name: 'Reading diff' }),
    ).toHaveAttribute('aria-busy', 'true')
    expect(within(pane).getByText('Read 32 KiB of 48 KiB stored')).toBeInTheDocument()
    expect(within(pane).getByText("This diff couldn't be read")).toBeInTheDocument()
    expect(within(pane).getByText(TEST_ENTRY.path!)).toBeInTheDocument()
    // The specimen replaces the repository list.
    expect(within(pane).queryByText('Provenance')).toBeNull()
  })
})
