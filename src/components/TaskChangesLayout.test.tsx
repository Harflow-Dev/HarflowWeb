import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  HARFLOW_MCP_ROOT,
  HARFLOW_WEB_ROOT,
  TASK_CHANGES_TURNS_ID,
  turnsMembers,
} from '../adapters/mock/taskChangesFixtures'
import {
  incompleteDoc,
  multiDoc,
  singleDoc,
  unobservedCaptureDoc,
  zeroDoc,
} from '../adapters/mock/taskChangesFixtureDocs'
import { retryBudgetCompletedObservation } from '../adapters/mock/taskFixtures'
import { asTaskId, type TaskChangesObservation } from '../model'
import { CHANGES_ATTRIBUTION } from '../presentation/taskChangesCopy'
import { TaskChangesPane, type TaskChangesPaneProps } from './TaskChangesPane'

afterEach(() => {
  cleanup()
})

const TASK = asTaskId('task-layout')

function renderPane(
  doc: TaskChangesObservation,
  expandedRepos: readonly string[],
  turns: TaskChangesPaneProps['turns'] = null,
): void {
  const props: TaskChangesPaneProps = {
    load: { kind: 'ready', observation: doc },
    list: doc,
    taskObservation: retryBudgetCompletedObservation(),
    selectedEntry: null,
    expandedRepos,
    turns,
    textPanels: null,
    onSelectEntry: () => undefined,
    onSelectTab: () => undefined,
    onSelectTurn: () => undefined,
    onToggleRepo: () => undefined,
    onClosePane: () => undefined,
    onUnavailable: () => undefined,
  }
  render(<TaskChangesPane {...props} />)
}

describe('Changes pane layout by repository count', () => {
  it('summary layout: attribution once, no per-repository Provenance', () => {
    renderPane(multiDoc(TASK), [HARFLOW_MCP_ROOT])
    expect(screen.getAllByText(CHANGES_ATTRIBUTION)).toHaveLength(1)
    expect(screen.queryByText('Provenance')).toBeNull()
    expect(
      screen.getByText(/The tab counts rows across repositories and scopes/),
    ).toBeInTheDocument()
  })

  it('below four repositories each repository carries attribution and Provenance', () => {
    const two: TaskChangesObservation = {
      ...multiDoc(TASK),
      repositories: multiDoc(TASK).repositories.slice(0, 2),
    }
    renderPane(two, two.repositories.map((repo) => repo.repositoryRoot))
    expect(screen.getAllByText(CHANGES_ATTRIBUTION)).toHaveLength(2)
    expect(screen.getAllByText('Provenance')).toHaveLength(2)
    expect(screen.queryByText(/The tab counts rows/)).toBeNull()
  })

  it('does not caption a tab count that is not drawn', () => {
    const limited: TaskChangesObservation = {
      ...multiDoc(TASK),
      capture: { state: 'incomplete', reason: null },
    }
    renderPane(limited, [])
    expect(screen.queryByText(/The tab counts rows/)).toBeNull()
  })

  it('omits the repository count under the complete-zero caption', () => {
    renderPane(zeroDoc(TASK), [HARFLOW_WEB_ROOT])
    expect(screen.getByText(/Complete capture: every page read/)).toBeInTheDocument()
    const summary = screen.getByText('HarflowWeb').closest('summary')!
    expect(summary).not.toHaveTextContent('0')
  })

  it('reads an incomplete scope count without a plus and keeps Conflicts unknown', () => {
    renderPane(incompleteDoc(TASK), [HARFLOW_MCP_ROOT])
    expect(screen.getByText('Conflicts unknown')).toBeInTheDocument()
    expect(
      screen.getByText(
        'No rows in this scope. Conflicts were not examined, so this is not a clean bill.',
      ),
    ).toBeInTheDocument()
  })

  it('shows a not-observed note for a task-level refusal with no repositories', () => {
    renderPane(unobservedCaptureDoc(TASK), [])
    expect(screen.getByText('Changes not captured')).toBeInTheDocument()
    expect(
      screen.getByText(/never observed this run's outcome/),
    ).toBeInTheDocument()
    expect(screen.getByText('Task-level, no repositories')).toBeInTheDocument()
  })

  it('draws no turn picker without seeded lineage', () => {
    renderPane(singleDoc(TASK), [HARFLOW_WEB_ROOT])
    expect(screen.queryByLabelText('Turn')).toBeNull()
  })

  it('draws the turn picker with the current task id shortened', () => {
    renderPane(singleDoc(TASK_CHANGES_TURNS_ID), [HARFLOW_WEB_ROOT], turnsMembers())
    expect(screen.getByLabelText('Turn')).toHaveValue(TASK_CHANGES_TURNS_ID)
    expect(screen.getByText('task 7be02d91')).toBeInTheDocument()
    expect(screen.getByText('Turn 3 of 3 · current')).toBeInTheDocument()
  })
})
