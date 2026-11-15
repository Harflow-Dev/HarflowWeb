import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { type ScenarioId } from '../adapters/mock'
import { LOADING_SCENARIOS } from '../adapters/mock/scenarioCatalogLoading'
import { MINIMUM_LOADING_SCENARIOS } from '../adapters/mock/scenarioCatalogMinimum'
import { TASK_CHANGES_LOADING_SCENARIO } from '../adapters/mock/scenarioCatalogTaskChanges'
import { populatedHarnessesLoad } from '../adapters/mock/harnessFixtures'
import { PRELOAD_PARALLEL_GROUP_ID, parallelGroupLoadFor } from '../adapters/mock/parallelGroupFixtures'
import { populatedResourcesLoad } from '../adapters/mock/resourceFixtures'
import { populatedSettingsGeneralLoad } from '../adapters/mock/settingsGeneralFixtures'
import { statisticsLoadFor } from '../adapters/mock/statisticsFixtures'
import {
  RETRY_BUDGET_DONE_TASK_ID,
  SLOT_RELEASE_TASK_ID,
  taskLoadFor,
} from '../adapters/mock/taskFixtures'
import { workflowEditorLoadFor } from '../adapters/mock/workflowEditorFixtures'
import { populatedWorkflowsLoad } from '../adapters/mock/workflowFixtures'
import { RELEASE_WORKFLOW_ID } from '../adapters/mock/workflowRunFixtures'
import { createApp, PreviewShell } from '../composition'
import { asWorkflowRunId } from '../model'
import { AppFeature } from './AppFeature'

const RUN_ID = asWorkflowRunId('run-nightly-dependency-audit')

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

/** Boots the real app composition against a deferred catalog scenario. */
async function mount(scenario: ScenarioId) {
  const app = createApp(scenario)
  render(<AppFeature presenter={app.presenter} />)
  await settle()
  return app
}

async function settle(): Promise<void> {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

async function deliver(send: () => void): Promise<void> {
  await act(async () => {
    send()
    await Promise.resolve()
  })
}

describe('mid-load navigation', () => {
  it('task: a late answer for A never fills B, and B keeps loading', async () => {
    const app = await mount('task-loading')
    await act(async () => app.presenter.openTask(SLOT_RELEASE_TASK_ID))
    expect(screen.getByRole('group', { name: 'Loading Task' })).toBeInTheDocument()
    await act(async () => app.presenter.openTask(RETRY_BUDGET_DONE_TASK_ID))
    await deliver(() =>
      app.mock.publishTask(SLOT_RELEASE_TASK_ID, taskLoadFor(SLOT_RELEASE_TASK_ID)),
    )
    const state = app.presenter.getState().task
    expect(state.selectedTaskId).toBe(RETRY_BUDGET_DONE_TASK_ID)
    expect(state.load.kind).toBe('loading')
    expect(screen.getByRole('group', { name: 'Loading Task' })).toBeInTheDocument()
    expect(
      within(screen.getByRole('main')).queryByText('Fix flaky slot release test'),
    ).toBeNull()

    await deliver(() =>
      app.mock.publishTask(
        RETRY_BUDGET_DONE_TASK_ID,
        taskLoadFor(RETRY_BUDGET_DONE_TASK_ID),
      ),
    )
    expect(screen.queryByRole('group', { name: 'Loading Task' })).toBeNull()
    expect(
      within(screen.getByRole('main')).getAllByText('Add retry budget to delivery queue')
        .length,
    ).toBeGreaterThan(0)
  })

  it('task: leaving while deferred keeps the selection and shows the late result on return', async () => {
    const app = await mount('task-loading')
    await act(async () => app.presenter.openTask(SLOT_RELEASE_TASK_ID))
    await act(async () => app.presenter.navigate('new-task'))
    await deliver(() =>
      app.mock.publishTask(SLOT_RELEASE_TASK_ID, taskLoadFor(SLOT_RELEASE_TASK_ID)),
    )
    await act(async () => app.presenter.openTask(SLOT_RELEASE_TASK_ID))
    expect(screen.queryByRole('group', { name: 'Loading Task' })).toBeNull()
    expect(app.presenter.getState().route).toBe('task')
    expect(app.presenter.getState().task.load.kind).toBe('ready')
  })

  it('workflows list: a result delivered while away is shown on return', async () => {
    const app = await mount('workflows-loading')
    await act(async () => app.presenter.navigate('workflows'))
    expect(screen.getByRole('group', { name: 'Loading Workflows' })).toBeInTheDocument()
    await act(async () => app.presenter.navigate('new-task'))
    await deliver(() => app.mock.publishWorkflows(populatedWorkflowsLoad()))
    await act(async () => app.presenter.navigate('workflows'))
    expect(screen.queryByRole('group', { name: 'Loading Workflows' })).toBeNull()
    expect(screen.getByText('Release checklist')).toBeInTheDocument()
  })

  it('workflow editor: Back leaves the loading editor and a late result does not reopen it', async () => {
    const user = userEvent.setup()
    const app = await mount('workflow-editor-loading')
    await act(async () => app.presenter.navigate('workflows'))
    await act(async () => app.presenter.openWorkflowEditor(RELEASE_WORKFLOW_ID))
    expect(
      screen.getByRole('group', { name: 'Loading Workflow editor' }),
    ).toBeInTheDocument()
    const main = screen.getByRole('main')
    await user.click(within(main).getByRole('button', { name: 'Workflows' }))
    expect(app.presenter.getState().workflowEditor.workflowId).toBeNull()
    expect(screen.queryByRole('group', { name: 'Loading Workflow editor' })).toBeNull()
    expect(within(main).getByText('Release checklist')).toBeInTheDocument()

    await deliver(() =>
      app.mock.publishWorkflowEditor(
        RELEASE_WORKFLOW_ID,
        workflowEditorLoadFor(RELEASE_WORKFLOW_ID),
      ),
    )
    expect(app.presenter.getState().workflowEditor.workflowId).toBeNull()
    expect(screen.queryByLabelText('Workflow canvas')).toBeNull()
    expect(within(main).getByText('Release checklist')).toBeInTheDocument()
  })

  it('workflow editor: the editor is retained through sidebar navigation', async () => {
    const app = await mount('workflow-editor-loading')
    await act(async () => app.presenter.navigate('workflows'))
    await act(async () => app.presenter.openWorkflowEditor(RELEASE_WORKFLOW_ID))
    await act(async () => app.presenter.navigate('new-task'))
    await deliver(() =>
      app.mock.publishWorkflowEditor(
        RELEASE_WORKFLOW_ID,
        workflowEditorLoadFor(RELEASE_WORKFLOW_ID),
      ),
    )
    await act(async () => app.presenter.navigate('workflows'))
    expect(screen.queryByRole('group', { name: 'Loading Workflow editor' })).toBeNull()
    expect(screen.getByLabelText('Workflow canvas')).toBeInTheDocument()
  })

  it('workflow run: leaving closes the run, so a late result never reopens it', async () => {
    const app = await mount('workflow-run-loading')
    await act(async () => app.presenter.navigate('workflows'))
    await act(async () => app.presenter.openWorkflowExecution(RUN_ID))
    expect(screen.getByRole('group', { name: 'Loading Workflow run' })).toBeInTheDocument()
    await act(async () => app.presenter.navigate('new-task'))
    expect(app.presenter.getState().workflowExecution.runId).toBeNull()
    await deliver(() => app.mock.setScenario('populated'))
    await act(async () => app.presenter.navigate('workflows'))
    expect(app.presenter.getState().workflowExecution.runId).toBeNull()
    expect(screen.queryByRole('group', { name: 'Loading Workflow run' })).toBeNull()
    expect(screen.queryByLabelText('Workflow graph')).toBeNull()
    expect(
      within(screen.getByRole('main')).getByRole('heading', { name: 'Workflows' }),
    ).toBeInTheDocument()
  })

  it('parallel group: leaving closes the group, so a late result never reopens it', async () => {
    const app = await mount('parallel-group-loading')
    await act(async () => app.presenter.openParallelGroup(PRELOAD_PARALLEL_GROUP_ID))
    expect(
      screen.getByRole('group', { name: 'Loading Parallel group' }),
    ).toBeInTheDocument()
    await act(async () => app.presenter.navigate('workflows'))
    expect(app.presenter.getState().parallelGroup.groupId).toBeNull()
    await deliver(() =>
      app.mock.publishParallelGroup(
        PRELOAD_PARALLEL_GROUP_ID,
        parallelGroupLoadFor(PRELOAD_PARALLEL_GROUP_ID),
      ),
    )
    expect(app.presenter.getState().route).toBe('workflows')
    expect(app.presenter.getState().parallelGroup.groupId).toBeNull()
    expect(screen.queryByRole('region', { name: 'Parallel group lanes' })).toBeNull()
    expect(
      screen.queryByRole('group', { name: 'Loading Parallel group' }),
    ).toBeNull()
  })

  it('resources: a result delivered while away is shown on return', async () => {
    const app = await mount('resources-loading')
    await act(async () => app.presenter.navigate('resources'))
    expect(screen.getByRole('group', { name: 'Loading Resources' })).toBeInTheDocument()
    await act(async () => app.presenter.navigate('new-task'))
    await deliver(() => app.mock.publishResources(populatedResourcesLoad()))
    await act(async () => app.presenter.navigate('resources'))
    expect(screen.queryByRole('group', { name: 'Loading Resources' })).toBeNull()
    expect(screen.getByTestId('resource-card-claude')).toBeInTheDocument()
  })

  it('statistics: a result delivered while away is shown on return', async () => {
    const app = await mount('statistics-loading')
    await act(async () => app.presenter.navigate('statistics'))
    expect(screen.getByRole('group', { name: 'Loading Statistics' })).toBeInTheDocument()
    const range = app.presenter.getState().statistics.selectedRange
    await act(async () => app.presenter.navigate('new-task'))
    await deliver(() => app.mock.publishStatistics(range, statisticsLoadFor(range)))
    await act(async () => app.presenter.navigate('statistics'))
    expect(screen.queryByRole('group', { name: 'Loading Statistics' })).toBeNull()
    expect(app.presenter.getState().statistics.load.kind).toBe('ready')
  })

  it('harnesses: a result delivered while away keeps the expanded harness on return', async () => {
    const app = await mount('settings-loading-mcp-approvals')
    await act(async () => {
      app.presenter.navigate('settings')
      app.presenter.selectSettingsSection('harnesses')
      app.presenter.setExpandedHarness('claude-code')
    })
    expect(
      screen.getByRole('group', { name: 'Loading MCP approvals' }),
    ).toBeInTheDocument()
    await act(async () => app.presenter.navigate('new-task'))
    await deliver(() => app.mock.publishHarnesses(populatedHarnessesLoad()))
    await act(async () => app.presenter.navigate('settings'))
    expect(screen.queryByTestId('mcp-approvals-skeleton')).toBeNull()
    expect(
      screen.getByRole('region', { name: 'MCP approvals for Claude Code' }),
    ).toBeInTheDocument()
  })

  it('settings general: a result delivered while away is shown on return', async () => {
    const app = await mount('settings-loading-general')
    await act(async () => app.presenter.navigate('settings'))
    expect(screen.getByRole('region', { name: 'Task store' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    await act(async () => app.presenter.navigate('new-task'))
    await deliver(() => app.mock.publishSettingsGeneral(populatedSettingsGeneralLoad()))
    await act(async () => app.presenter.navigate('settings'))
    expect(screen.getByRole('region', { name: 'Task store' })).not.toHaveAttribute(
      'aria-busy',
    )
    expect(screen.getByText('Harflow runtime 0.9.3 is ready')).toBeInTheDocument()
  })
})

type Expected =
  | { readonly role: 'group'; readonly name: string }
  | { readonly role: 'region'; readonly name: string }

const CATALOG_LOADING = [
  ...LOADING_SCENARIOS,
  ...MINIMUM_LOADING_SCENARIOS,
  TASK_CHANGES_LOADING_SCENARIO,
]

const BUSY: Readonly<Record<string, Expected>> = {
  'new-task-loading': { role: 'group', name: 'Loading New task' },
  'sidebar-loading': { role: 'group', name: 'Loading tasks' },
  'task-loading': { role: 'group', name: 'Loading Task' },
  'workflows-loading': { role: 'group', name: 'Loading Workflows' },
  'workflow-editor-loading': { role: 'group', name: 'Loading Workflow editor' },
  'workflow-run-loading': { role: 'group', name: 'Loading Workflow run' },
  'workflow-run-loading-parallel': { role: 'group', name: 'Loading Workflow run' },
  'parallel-group-loading': { role: 'group', name: 'Loading Parallel group' },
  'parallel-group-loading-two': { role: 'group', name: 'Loading Parallel group' },
  'resources-loading': { role: 'group', name: 'Loading Resources' },
  'statistics-loading': { role: 'group', name: 'Loading Statistics' },
  'settings-loading-general': { role: 'region', name: 'Task store' },
  'settings-loading-harnesses': { role: 'group', name: 'Loading Harnesses' },
  'settings-loading-mcp-approvals': { role: 'group', name: 'Loading MCP approvals' },
  'needs-you-loading-minimum': { role: 'group', name: 'Loading Needs you' },
  'parallel-group-loading-minimum': {
    role: 'group',
    name: 'Loading Parallel group',
  },
  'workflow-run-loading-parallel-minimum': {
    role: 'group',
    name: 'Loading Workflow run',
  },
  'workflow-editor-loading-minimum': {
    role: 'group',
    name: 'Loading Workflow editor',
  },
  'task-changes-loading': { role: 'group', name: 'Reading stored changes' },
  'task-events-loading': { role: 'group', name: 'Loading Events' },
}

describe('loading scenario catalog through the preview seeding path', () => {
  beforeEach(() => {
    window.location.hash = ''
  })

  it('covers every catalog entry', () => {
    expect(Object.keys(BUSY).sort()).toEqual(
      CATALOG_LOADING.map((scenario) => scenario.id).sort(),
    )
  })

  it.each(CATALOG_LOADING.map((scenario) => [scenario.id]))(
    'boots %s and shows its busy region',
    async (id) => {
      const expected = BUSY[id as string]!
      window.location.hash = `#${id}`
      render(<PreviewShell />)
      const busy = await waitFor(() => {
        const found =
          expected.role === 'region'
            ? screen.getByRole('region', { name: expected.name })
            : screen.getByRole('group', { name: expected.name })
        expect(found).toHaveAttribute('aria-busy', 'true')
        return found
      })
      expect(busy).toBeInTheDocument()
      if (
        id === 'workflow-run-loading-parallel' ||
        id === 'workflow-run-loading-parallel-minimum' ||
        id === 'parallel-group-loading-minimum'
      ) {
        expect(screen.getByLabelText('Parallel lanes')).toBeInTheDocument()
      }
      if (id === 'parallel-group-loading-two') {
        expect(busy.querySelectorAll('.hd-lane')).toHaveLength(2)
      }
    },
  )
})
