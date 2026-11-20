import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { idleObservation } from '../adapters/mock/mockObservation'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import {
  createLoadContextUseCase,
  createLoadHarnessesUseCase,
  createLoadNeedsYouUseCase,
  createLoadSettingsGeneralUseCase,
  createLoadParallelGroupUseCase,
  createLoadMessagingCapabilityUseCase,
  createLoadPendingLaunchCapabilityUseCase,
  createLoadPendingLaunchInventoryUseCase,
  createLoadPendingLaunchStatusUseCase,
  createLoadResourcesUseCase,
  createLoadStatisticsUseCase,
  createLoadTaskChangesUseCase,
  createLoadTaskEventsUseCase,
  createLoadTaskUseCase,
  createLoadWorkflowEditorUseCase,
  createLoadWorkflowExecutionUseCase,
  createLoadWorkflowRunUseCase,
  createLoadWorkflowsUseCase,
  createStartTaskUseCase,
  createAnswerWorkflowAttentionCheckpointUseCase,
  createRefreshTaskApprovalUseCase,
  createRefreshWorkflowAttentionCheckpointUseCase,
  createRespondTaskApprovalUseCase,

  type EnginePort,
} from '../application'
import {
  asObservationId,
  asParallelGroupId,
  asRepositoryId,
  asTaskId,
  asWorkflowId,
  asWorkflowNodeId,
  asWorkflowRunId,
  type ContextLoad,
  type HarnessesLoad,
  type ObservationHandle,
  type ParallelGroupId,
  type ParallelGroupLoad,
  type ResourcesLoad,
  type SettingsGeneralLoad,
  type StartTaskOutcome,
  type StartTaskRequest,
  type StatisticsLoad,
  type StatisticsRangeId,
  type TaskChangesLoad,
  type TaskChangesQuery,
  type NeedsYouLoad,
  type TaskId,
  type TaskLoad,
  type WorkflowEditorLoad,
  type WorkflowId,
  type WorkflowRunContextLoad,
  type WorkflowsLoad,
} from '../model'
import { createControllablePromise } from '../adapters/mock/controllable'
import { populatedComposer, populatedSidebar } from '../adapters/mock/fixtures'
import { populatedHarnessesLoad } from '../adapters/mock/harnessFixtures'
import { populatedSettingsGeneralLoad } from '../adapters/mock/settingsGeneralFixtures'
import {
  emptyNeedsYouLoad,
  partialNeedsYouObservation,
  unavailableNeedsYouLoad,
  waitingNeedsYouLoad,
} from '../adapters/mock/needsYouFixtures'
import {
  parallelGroupLoadFor,
  PRELOAD_PARALLEL_GROUP_ID,
} from '../adapters/mock/parallelGroupFixtures'
import { stubCapabilityPorts } from '../adapters/mock/stubCapabilityPorts'
import { SLOT_RELEASE_TASK_ID } from '../adapters/mock/taskFixtures'
import {
  workflowEditorLoadFor,
} from '../adapters/mock/workflowEditorFixtures'
import {
  nightlyAuditRun,
  workflowExecutionLoadFor,
} from '../adapters/mock/workflowExecutionFixtures'
import {
  NIGHTLY_WORKFLOW_ID,
  RELEASE_WORKFLOW_ID,
  workflowRunLoadFor,
} from '../adapters/mock/workflowRunFixtures'
import { populatedResourcesLoad } from '../adapters/mock/resourceFixtures'
import { statisticsLoadFor } from '../adapters/mock/statisticsFixtures'
import { taskChangesKey } from '../adapters/mock/mockEngineCore'
import {
  CONFIG_ENTRY,
  CONFIG_PY_PATH,
  QUEUE_ENTRY,
  QUEUE_PY_PATH,
  taskChangesLoadFor,
} from '../adapters/mock/taskChangesFixtures'
import { taskEventsLoadFor } from '../adapters/mock/taskEventsFixtures'
import {
  EVENTS_READER_FAILED_TASK_ID,
  PRELOAD_TASK_ID,
  RETRY_BUDGET_DONE_TASK_ID,
  taskLoadFor,
} from '../adapters/mock/taskFixtures'
import { POPULATED_WORKFLOWS } from '../adapters/mock/workflowFixtures'
import { createAppPresenter } from '../presentation'
import { AppFeature } from './AppFeature'

function readyContext(): ContextLoad {
  return {
    kind: 'ready',
    composer: populatedComposer(),
    sidebar: populatedSidebar(),
  }
}

function createTestEngine(options?: {
  holdStart?: boolean
  workflows?: WorkflowsLoad
  deferContext?: boolean
  sidebarListingLoading?: boolean
  deferSettingsGeneral?: boolean
  deferWorkflows?: boolean
  deferWorkflowEditor?: boolean
  deferWorkflowExecution?: boolean
  deferResources?: boolean
  deferHarnesses?: boolean
  deferStatisticsRanges?: readonly StatisticsRangeId[]
  deferTaskIds?: readonly TaskId[]
  deferParallelGroupIds?: readonly ParallelGroupId[]
  deferChanges?: boolean
  deferWorkflowRun?: boolean
}): {
  port: EnginePort
  starts: StartTaskRequest[]
  resolveStart: (outcome: StartTaskOutcome) => void
  publishContext: (load: ContextLoad) => void
  publishStatistics: (range: StatisticsRangeId, load: StatisticsLoad) => void
  publishResources: (load: ResourcesLoad) => void
  publishHarnesses: (load: HarnessesLoad) => void
  publishSettingsGeneral: (load: SettingsGeneralLoad) => void
  publishTask: (taskId: TaskId, load: TaskLoad) => void
  publishTaskChanges: (query: TaskChangesQuery, load: TaskChangesLoad) => void
  publishNeedsYou: (load: NeedsYouLoad) => void
  publishParallelGroup: (
    groupId: ParallelGroupId,
    load: ParallelGroupLoad,
  ) => void
  captureChangesCallback: () => ((load: TaskChangesLoad) => void) | null
  publishWorkflowRun: (id: WorkflowId, load: WorkflowRunContextLoad) => void
  captureWorkflowRun: (
    id: WorkflowId,
  ) => ((load: WorkflowRunContextLoad) => void) | null
  publishWorkflows: (load: WorkflowsLoad) => void
  publishWorkflowEditor: (id: WorkflowId, load: WorkflowEditorLoad) => void
  captureWorkflowEditor: (
    id: WorkflowId,
  ) => ((load: WorkflowEditorLoad) => void) | null
  publishWorkflowExecution: (
    id: import('../model').WorkflowRunId,
    load: import('../model').WorkflowRunLoad,
  ) => void
  captureParallelGroup: (
    id: ParallelGroupId,
  ) => ((load: ParallelGroupLoad) => void) | null
} {
  const starts: StartTaskRequest[] = []
  let held = createControllablePromise<StartTaskOutcome>()
  const workflows: WorkflowsLoad = options?.workflows ?? {
    kind: 'ready',
    workflows: POPULATED_WORKFLOWS,
  }
  const resources: ResourcesLoad = populatedResourcesLoad()
  const deferred = new Set(options?.deferStatisticsRanges ?? [])
  const deferredTasks = new Set(options?.deferTaskIds ?? [])
  const deferredParallelGroups = new Set(options?.deferParallelGroupIds ?? [])
  const contextListeners = new Set<(load: ContextLoad) => void>()
  const workflowListeners = new Set<(load: WorkflowsLoad) => void>()
  const resourceListeners = new Set<(load: ResourcesLoad) => void>()
  const harnessListeners = new Set<(load: HarnessesLoad) => void>()
  const settingsGeneralListeners = new Set<
    (load: SettingsGeneralLoad) => void
  >()
  const statsListeners = new Map<
    StatisticsRangeId,
    (load: StatisticsLoad) => void
  >()
  const taskListeners = new Map<TaskId, (load: TaskLoad) => void>()
  const changesListeners = new Map<
    string,
    (load: TaskChangesLoad) => void
  >()
  const needsListeners = new Set<(load: NeedsYouLoad) => void>()
  const runListeners = new Map<
    WorkflowId,
    (load: WorkflowRunContextLoad) => void
  >()
  const editorListeners = new Map<
    WorkflowId,
    (load: WorkflowEditorLoad) => void
  >()
  const executionListeners = new Map<
    import('../model').WorkflowRunId,
    (load: import('../model').WorkflowRunLoad) => void
  >()
  const parallelGroupListeners = new Map<
    ParallelGroupId,
    (load: ParallelGroupLoad) => void
  >()
  let lastChangesCallback: ((load: TaskChangesLoad) => void) | null = null
  const initialContext = (): ContextLoad => {
    if (options?.deferContext) return { kind: 'loading' }
    return {
      kind: 'ready',
      composer: populatedComposer(),
      sidebar: populatedSidebar(),
      ...(options?.sidebarListingLoading === true
        ? { sidebarListingLoading: true as const }
        : {}),
    }
  }
  const port: EnginePort = {
    observeContext(onUpdate) {
      contextListeners.add(onUpdate)
      queueMicrotask(() => onUpdate(initialContext()))
      const handle: ObservationHandle = {
        id: asObservationId('ui-ctx'),
        cancel() {
          contextListeners.delete(onUpdate)
        },
      }
      return handle
    },
    observeWorkflows(onUpdate) {
      workflowListeners.add(onUpdate)
      queueMicrotask(() =>
        onUpdate(
          options?.deferWorkflows ? { kind: 'loading' } : workflows,
        ),
      )
      return {
        id: asObservationId('ui-wf'),
        cancel() {
          workflowListeners.delete(onUpdate)
        },
      }
    },
    observeWorkflowRun(workflowId, onUpdate) {
      runListeners.set(workflowId, onUpdate)
      if (!options?.deferWorkflowRun) {
        queueMicrotask(() => onUpdate(workflowRunLoadFor(workflowId)))
      }
      return {
        id: asObservationId('ui-workflow-run'),
        cancel() {
          if (runListeners.get(workflowId) === onUpdate) {
            runListeners.delete(workflowId)
          }
        },
      }
    },
    observeWorkflowEditor(workflowId, onUpdate) {
      editorListeners.set(workflowId, onUpdate)
      if (!options?.deferWorkflowEditor) {
        queueMicrotask(() => onUpdate(workflowEditorLoadFor(workflowId)))
      }
      return {
        id: asObservationId('ui-workflow-editor'),
        cancel() {
          if (editorListeners.get(workflowId) === onUpdate) {
            editorListeners.delete(workflowId)
          }
        },
      }
    },
    observeWorkflowExecution(runId, onUpdate) {
      executionListeners.set(runId, onUpdate)
      if (!options?.deferWorkflowExecution) {
        queueMicrotask(() => onUpdate(workflowExecutionLoadFor(runId)))
      }
      return {
        id: asObservationId('ui-workflow-execution'),
        cancel() {
          if (executionListeners.get(runId) === onUpdate) {
            executionListeners.delete(runId)
          }
        },
      }
    },
    observeParallelGroup(groupId, onUpdate) {
      parallelGroupListeners.set(groupId, onUpdate)
      if (!deferredParallelGroups.has(groupId)) {
        queueMicrotask(() => onUpdate(parallelGroupLoadFor(groupId)))
      }
      return {
        id: asObservationId('ui-parallel-group'),
        cancel() {
          if (parallelGroupListeners.get(groupId) === onUpdate) {
            parallelGroupListeners.delete(groupId)
          }
        },
      }
    },
    ...stubCapabilityPorts(),
    observeResources(onUpdate) {
      resourceListeners.add(onUpdate)
      queueMicrotask(() =>
        onUpdate(
          options?.deferResources ? { kind: 'loading' } : resources,
        ),
      )
      return {
        id: asObservationId('ui-res'),
        cancel() {
          resourceListeners.delete(onUpdate)
        },
      }
    },
    observeStatistics(range, onUpdate) {
      statsListeners.set(range, onUpdate)
      if (!deferred.has(range)) {
        queueMicrotask(() => onUpdate(statisticsLoadFor(range)))
      }
      return {
        id: asObservationId('ui-stats'),
        cancel() {
          if (statsListeners.get(range) === onUpdate) {
            statsListeners.delete(range)
          }
        },
      }
    },
    observeTask(taskId, onUpdate) {
      taskListeners.set(taskId, onUpdate)
      if (!deferredTasks.has(taskId)) {
        queueMicrotask(() => onUpdate(taskLoadFor(taskId)))
      }
      return {
        id: asObservationId('ui-task'),
        cancel() {
          if (taskListeners.get(taskId) === onUpdate) {
            taskListeners.delete(taskId)
          }
        },
      }
    },
    observeTaskChanges(query, onUpdate) {
      const key = taskChangesKey(query)
      lastChangesCallback = onUpdate
      changesListeners.set(key, onUpdate)
      if (!options?.deferChanges) {
        queueMicrotask(() => onUpdate(taskChangesLoadFor(query)))
      }
      return {
        id: asObservationId('ui-changes'),
        cancel() {
          if (changesListeners.get(key) === onUpdate) {
            changesListeners.delete(key)
          }
        },
      }
    },
    observeTaskEventsOlder() {
      return idleObservation()
    },
    observeTaskEvents(query, onUpdate) {
      queueMicrotask(() => onUpdate(taskEventsLoadFor(query)))
      return {
        id: asObservationId('ui-events'),
        cancel() {
          /* no-op */
        },
      }
    },
    observeHarnesses(onUpdate) {
      harnessListeners.add(onUpdate)
      queueMicrotask(() =>
        onUpdate(
          options?.deferHarnesses
            ? { kind: 'loading' }
            : populatedHarnessesLoad(),
        ),
      )
      return {
        id: asObservationId('ui-harnesses'),
        cancel() {
          harnessListeners.delete(onUpdate)
        },
      }
    },
    observeSettingsGeneral(onUpdate) {
      settingsGeneralListeners.add(onUpdate)
      queueMicrotask(() =>
        onUpdate(
          options?.deferSettingsGeneral
            ? { kind: 'loading' }
            : populatedSettingsGeneralLoad(),
        ),
      )
      return {
        id: asObservationId('ui-settings-general'),
        cancel() {
          settingsGeneralListeners.delete(onUpdate)
        },
      }
    },
    observeNeedsYou(onUpdate) {
      needsListeners.add(onUpdate)
      queueMicrotask(() => onUpdate(waitingNeedsYouLoad()))
      return {
        id: asObservationId('ui-needs'),
        cancel() {
          needsListeners.delete(onUpdate)
        },
      }
    },
    async startTask(request) {
      starts.push(request)
      if (options?.holdStart) {
        held = createControllablePromise<StartTaskOutcome>()
        return held.promise
      }
      return { kind: 'accepted', taskId: asTaskId('ui-task') }
    },
    async respondTaskApproval() {
      return { kind: 'unknown', message: 'stub' }
    },
    async refreshTaskApproval() {
      return null
    },
    async answerWorkflowAttentionCheckpoint() {
      return { kind: 'unknown' as const }
    },
    async refreshWorkflowAttentionCheckpoint() {
      return { kind: 'failed' as const }
    },
  }
  return {
    port,
    starts,
    resolveStart(outcome) {
      held.resolve(outcome)
    },
    publishContext(load) {
      for (const listener of contextListeners) listener(load)
    },
    publishWorkflows(load) {
      for (const listener of workflowListeners) listener(load)
    },
    publishStatistics(range, load) {
      statsListeners.get(range)?.(load)
    },
    publishResources(load) {
      for (const listener of resourceListeners) listener(load)
    },
    publishHarnesses(load) {
      for (const listener of harnessListeners) listener(load)
    },
    publishSettingsGeneral(load) {
      for (const listener of settingsGeneralListeners) listener(load)
    },
    publishWorkflowExecution(id, load) {
      executionListeners.get(id)?.(load)
    },
    publishTask(taskId, load) {
      taskListeners.get(taskId)?.(load)
    },
    publishTaskChanges(query, load) {
      const key = taskChangesKey(query)
      changesListeners.get(key)?.(load)
    },
    publishNeedsYou(load) {
      for (const listener of needsListeners) listener(load)
    },
    captureChangesCallback: () => lastChangesCallback,
    publishWorkflowRun(id, load) {
      runListeners.get(id)?.(load)
    },
    captureWorkflowRun(id) {
      return runListeners.get(id) ?? null
    },
    publishWorkflowEditor(id, load) {
      editorListeners.get(id)?.(load)
    },
    captureWorkflowEditor(id) {
      return editorListeners.get(id) ?? null
    },
    publishParallelGroup(groupId, load) {
      parallelGroupListeners.get(groupId)?.(load)
    },
    captureParallelGroup(id) {
      return parallelGroupListeners.get(id) ?? null
    },
  }
}

function renderApp(engine: EnginePort) {
  const presenter = createAppPresenter({
    loadContext: createLoadContextUseCase(engine),
    startTask: createStartTaskUseCase(engine),
    loadWorkflows: createLoadWorkflowsUseCase(engine),
    loadResources: createLoadResourcesUseCase(engine),
    loadStatistics: createLoadStatisticsUseCase(engine),
    loadTask: createLoadTaskUseCase(engine),
    loadTaskChanges: createLoadTaskChangesUseCase(engine),
    loadTaskEvents: createLoadTaskEventsUseCase(engine),
    respondTaskApproval: createRespondTaskApprovalUseCase(engine),
    refreshTaskApproval: createRefreshTaskApprovalUseCase(engine),
    answerWorkflowAttentionCheckpoint:
      createAnswerWorkflowAttentionCheckpointUseCase(engine),
    refreshWorkflowAttentionCheckpoint:
      createRefreshWorkflowAttentionCheckpointUseCase(engine),
    loadHarnesses: createLoadHarnessesUseCase(engine),
    loadNeedsYou: createLoadNeedsYouUseCase(engine),
    loadSettingsGeneral: createLoadSettingsGeneralUseCase(engine),
    loadWorkflowRun: createLoadWorkflowRunUseCase(engine),
    loadWorkflowEditor: createLoadWorkflowEditorUseCase(engine),
    loadWorkflowExecution: createLoadWorkflowExecutionUseCase(engine),
    loadParallelGroup: createLoadParallelGroupUseCase(engine),
    loadMessagingCapability: createLoadMessagingCapabilityUseCase(engine),
    loadPendingLaunchCapability:
      createLoadPendingLaunchCapabilityUseCase(engine),
    loadPendingLaunchInventory: createLoadPendingLaunchInventoryUseCase(engine),
    loadPendingLaunchStatus: createLoadPendingLaunchStatusUseCase(engine),
  })
  const view = render(<AppFeature presenter={presenter} />)
  return { presenter, ...view }
}

async function flush(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

afterEach(() => {
  cleanup()
})

describe('AppFeature navigation', () => {
  it('navigates between New task and Workflows without losing the draft', async () => {
    const user = userEvent.setup()
    const { port } = createTestEngine()
    renderApp(port)
    await flush()

    const prompt = await screen.findByLabelText('Task prompt')
    await user.type(prompt, 'draft across pages')
    expect(prompt).toHaveValue('draft across pages')

    await user.click(screen.getByRole('button', { name: 'Workflows' }))
    const main = screen.getByRole('main')
    expect(
      await within(main).findByRole('heading', { name: 'Workflows' }),
    ).toBeInTheDocument()
    expect(within(main).getByText('Nightly dependency audit')).toBeInTheDocument()
    expect(screen.queryByLabelText('Task prompt')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /New task/ }))
    const restored = await screen.findByLabelText('Task prompt')
    expect(restored).toHaveValue('draft across pages')
  })

  it('shows the empty workflows specimen and keeps create actions inert', async () => {
    const user = userEvent.setup()
    const { port, starts } = createTestEngine({
      workflows: { kind: 'ready', workflows: [] },
    })
    renderApp(port)
    await flush()

    await user.click(screen.getByRole('button', { name: 'Workflows' }))
    expect(await screen.findByText('No workflows yet')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', {
        name: 'New workflow (unavailable in this slice)',
      }),
    )
    expect(
      screen.getByText(/New workflow is unavailable in this exploratory slice/),
    ).toBeInTheDocument()
    expect(starts).toHaveLength(0)

    await user.click(
      screen.getByRole('button', {
        name: 'Describe one to an agent (unavailable in this slice)',
      }),
    )
    expect(starts).toHaveLength(0)
  })

  it('opens a workflow run form and keeps Edit from launching', async () => {
    const user = userEvent.setup()
    const { port, starts } = createTestEngine()
    renderApp(port)
    await flush()

    await user.click(screen.getByRole('button', { name: 'Workflows' }))
    const row = await screen.findByText('Release checklist')
    const listItem = row.closest('[role="listitem"]')
    expect(listItem).not.toBeNull()
    expect(screen.getByText('5 nodes')).toBeInTheDocument()
    await user.click(
      within(listItem as HTMLElement).getByRole('button', {
        name: 'Run Release checklist',
      }),
    )
    expect(
      await screen.findByRole('heading', { name: 'Run Release checklist' }),
    ).toBeInTheDocument()
    expect(starts).toHaveLength(0)
  })

  it('preserves appearance while switching pages', async () => {
    const user = userEvent.setup()
    const { port } = createTestEngine()
    const { container } = renderApp(port)
    await flush()

    await user.click(screen.getByRole('button', { name: 'Dark' }))
    expect(container.querySelector('.hd-app')?.getAttribute('data-theme')).toBe(
      'dark',
    )

    await user.click(screen.getByRole('button', { name: 'Workflows' }))
    expect(container.querySelector('.hd-app')?.getAttribute('data-theme')).toBe(
      'dark',
    )
    await user.click(screen.getByRole('button', { name: /New task/ }))
    expect(container.querySelector('.hd-app')?.getAttribute('data-theme')).toBe(
      'dark',
    )
  })

  it('opens Resources with slot cards and keeps Install/Open task inert', async () => {
    const user = userEvent.setup()
    const { port, starts } = createTestEngine()
    renderApp(port)
    await flush()

    await user.click(screen.getByRole('button', { name: 'Resources' }))
    expect(
      await screen.findByRole('heading', { name: 'Resources' }),
    ).toBeInTheDocument()
    expect(screen.getByText('2 of 3 in use')).toBeInTheDocument()
    expect(screen.getByText('0 of 2 in use')).toBeInTheDocument()
    expect(screen.getByText('1 waiting')).toBeInTheDocument()
    expect(screen.getByText('No tasks holding a slot.')).toBeInTheDocument()
    expect(screen.getByText('Not installed')).toBeInTheDocument()
    expect(screen.getByText('Waiting for a Codex slot')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', {
        name: 'Install Antigravity (unavailable in this slice)',
      }),
    )
    expect(starts).toHaveLength(0)
    await user.click(
      screen.getByRole('button', {
        name: 'Open task Write contract fixtures for v1 tasks (unavailable in this slice)',
      }),
    )
    expect(starts).toHaveLength(0)
  })

  it('opens Statistics with accessible chart data and distinct range values', async () => {
    const user = userEvent.setup()
    const { port, starts } = createTestEngine()
    const { presenter } = renderApp(port)
    await flush()

    await user.click(screen.getByRole('button', { name: 'Statistics' }))
    expect(
      await screen.findByRole('heading', { name: 'Statistics' }),
    ).toBeInTheDocument()
    expect(screen.getByText('284')).toBeInTheDocument()
    expect(
      screen.getByRole('img', {
        name: /Tasks per day for 30 days, done and failed stacked, scale 0 to 20/,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('table', { name: /Tasks per day for 30 days/ }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '7 days' }))
    expect(await screen.findByText('76')).toBeInTheDocument()
    expect(screen.queryByText('284')).not.toBeInTheDocument()
    expect(presenter.getState().statistics.selectedRange).toBe('7d')
    expect(screen.getByText('$0.00')).toBeInTheDocument()
    expect(starts).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'All time' }))
    expect(await screen.findByText(/Incomplete coverage/)).toBeInTheDocument()
    expect(
      screen.getByText('Retained history (not all-time)'),
    ).toBeInTheDocument()
    expect(screen.queryByText('91%')).not.toBeInTheDocument()
    expect(screen.queryByText('06:12')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Resources' }))
    expect(presenter.getState().statistics.selectedRange).toBe('all')
    expect(starts).toHaveLength(0)
  })

  it('keeps range-selector focus across deferred loading and result delivery', async () => {
    const user = userEvent.setup()
    const { port, publishStatistics } = createTestEngine({
      deferStatisticsRanges: ['7d'],
    })
    const { presenter } = renderApp(port)
    await flush()

    await user.click(screen.getByRole('button', { name: 'Statistics' }))
    expect(await screen.findByText('284')).toBeInTheDocument()

    const seven = screen.getByRole('button', { name: '7 days' })
    seven.focus()
    expect(seven).toHaveFocus()
    await user.click(seven)

    expect(presenter.getState().statistics.selectedRange).toBe('7d')
    expect(presenter.getState().statistics.load.kind).toBe('loading')
    expect(screen.queryByText('284')).not.toBeInTheDocument()
    expect(
      screen.getByRole('group', { name: 'Loading Statistics' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '7 days' })).toHaveFocus()

    publishStatistics('7d', statisticsLoadFor('7d'))
    expect(await screen.findByText('76')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '7 days' })).toHaveFocus()
    expect(screen.queryByText('284')).not.toBeInTheDocument()

    // Replace with unavailable while keeping the same focused control mounted.
    presenter.selectStatisticsRange('30d')
    await flush()
    const sevenAgain = screen.getByRole('button', { name: '7 days' })
    await user.click(sevenAgain)
    expect(presenter.getState().statistics.load.kind).toBe('loading')
    expect(screen.getByRole('button', { name: '7 days' })).toHaveFocus()
    publishStatistics('7d', {
      kind: 'unavailable',
      message: 'Statistics unavailable for review (proposal).',
    })
    expect(
      await screen.findByText('Statistics unavailable for review (proposal).'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '7 days' })).toHaveFocus()
    expect(screen.queryByText('76')).not.toBeInTheDocument()
    expect(screen.queryByText('284')).not.toBeInTheDocument()
  })

  it('returns to the accepted launch state after navigating during a held start', async () => {
    const user = userEvent.setup()
    const { port, starts, resolveStart } = createTestEngine({ holdStart: true })
    renderApp(port)
    await flush()

    await user.type(screen.getByLabelText('Task prompt'), 'held launch')
    await user.click(screen.getByRole('button', { name: 'Start task' }))
    // centered-starting-plain: no visible status row under the composer.
    expect(document.querySelector('.hw-compose-status')).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Starting task' }),
    ).toBeDisabled()
    const live = document.querySelector('.hw-status')
    expect(live?.textContent).toBe('Starting task…')
    expect(live).toHaveAttribute('role', 'status')
    expect(screen.getAllByRole('status').map((el) => el.textContent)).toEqual([
      'Starting task…',
    ])
    expect(starts).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Workflows' }))
    expect(screen.getByRole('status')).toHaveTextContent('Starting task…')

    resolveStart({ kind: 'accepted', taskId: asTaskId('nav-ok') })
    await flush()
    expect(
      screen.getByText(/Accepted mock task nav-ok/),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /New task/ }))
    expect(
      screen.getByText(/Accepted mock task nav-ok/),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Task prompt')).toHaveValue('')
    expect(starts).toHaveLength(1)
  })

  it('opens mapped running tasks with literal transcript content', async () => {
    const user = userEvent.setup()
    const { port, starts } = createTestEngine()
    renderApp(port)
    await flush()

    await user.click(
      screen.getByRole('button', { name: /Fix flaky slot release test/ }),
    )
    const main = screen.getByRole('main')
    expect(
      await within(main).findByText('Fix flaky slot release test'),
    ).toBeInTheDocument()
    expect(
      within(main).getByText(
        /The test_release_frees_slot test in tests\/test_slots.py/,
      ),
    ).toBeInTheDocument()
    expect(within(main).getByText('Running tests…')).toBeInTheDocument()
    const toolDetails = within(main)
      .getByText(/release --count 20/)
      .closest('details')
    if (toolDetails) toolDetails.open = true
    const toolBody = main.querySelector('.hd-tool__body')
    expect(toolBody?.textContent).toContain(
      'FAILED tests/test_slots.py::test_release_frees_slot[7]',
    )
    expect(starts).toHaveLength(0)
  })

  it('keeps unmapped sidebar rows and follow-up actions from launching', async () => {
    const user = userEvent.setup()
    const { port, starts } = createTestEngine()
    renderApp(port)
    await flush()

    await user.click(
      screen.getByRole('button', {
        name: 'Nightly dependency audit (unavailable in this slice)',
      }),
    )
    expect(
      screen.getByText(
        /Nightly dependency audit is unavailable in this exploratory slice/,
      ),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Task prompt')).toBeInTheDocument()
    expect(starts).toHaveLength(0)

    await user.click(
      screen.getByRole('button', { name: /Fix flaky slot release test/ }),
    )
    expect(await screen.findByText('Running tests…')).toBeInTheDocument()

    const stop = screen.getByRole('button', { name: 'Stop' })
    expect(stop).not.toHaveAttribute('aria-disabled')
    await user.click(stop)
    expect(
      screen.getByRole('dialog', { name: 'Stop this task?' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Send follow-up (unavailable in this slice)',
      }),
    ).toBeDisabled()
    expect(starts).toHaveLength(0)
  })

  it('expands and collapses tool rows with pointer and keyboard', async () => {
    const user = userEvent.setup()
    const { port } = createTestEngine()
    renderApp(port)
    await flush()

    await user.click(
      screen.getByRole('button', { name: /Fix flaky slot release test/ }),
    )
    expect(await screen.findByText('Running tests…')).toBeInTheDocument()
    const details = screen
      .getByText(/release --count 20/)
      .closest('details')
    expect(details).not.toBeNull()
    if (!details) return
    // Native <details> disclosure; the M05 column draws tool output open.
    expect(details.open).toBe(true)
    expect(details.querySelector('.hd-tool__body')?.textContent).toContain(
      '2 failed, 18 passed',
    )
    await user.click(screen.getByText(/release --count 20/))
    expect(details.open).toBe(false)
    await user.click(screen.getByText(/release --count 20/))
    expect(details.open).toBe(true)
    await user.click(screen.getByText(/release --count 20/))
    expect(details.open).toBe(false)

    const summary = details.querySelector('summary')
    expect(summary).not.toBeNull()
    // Summary is keyboard-focusable; reopen with a second pointer activation
    // (jsdom does not toggle native <details> from synthetic Space/Enter).
    summary?.focus()
    expect(document.activeElement).toBe(summary)
    await user.click(summary!)
    expect(details.open).toBe(true)
  })

  it('does not show task A content under task B while B is loading', async () => {
    const user = userEvent.setup()
    const { port, publishTask } = createTestEngine({
      deferTaskIds: [EVENTS_READER_FAILED_TASK_ID],
    })
    const { presenter } = renderApp(port)
    await flush()

    await user.click(
      screen.getByRole('button', { name: /Fix flaky slot release test/ }),
    )
    expect(await screen.findByText('Running tests…')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /Migrate events.jsonl reader/ }),
    )
    const main = screen.getByRole('main')
    expect(
      within(main).getByText('Migrate events.jsonl reader'),
    ).toBeInTheDocument()
    expect(
      within(main).getByRole('group', { name: 'Loading Task' }),
    ).toBeInTheDocument()
    expect(within(main).queryByText('Running tests…')).not.toBeInTheDocument()
    expect(
      within(main).queryByText(/test_release_frees_slot/),
    ).not.toBeInTheDocument()

    publishTask(
      EVENTS_READER_FAILED_TASK_ID,
      taskLoadFor(EVENTS_READER_FAILED_TASK_ID),
    )
    expect(
      await within(main).findByText(
        'Task failed: the harness exited with code 1',
      ),
    ).toBeInTheDocument()
    expect(within(main).queryByText('Running tests…')).not.toBeInTheDocument()

    presenter.openTask(PRELOAD_TASK_ID)
    await flush()
    expect(
      await within(main).findByText(
        /Include notes on <script>alert\("x"\)<\/script>/,
      ),
    ).toBeInTheDocument()
  })

  it('opens the Parallel group from the Running sidebar row', async () => {
    const user = userEvent.setup()
    const engine = createTestEngine()
    const { presenter } = renderApp(engine.port)
    await flush()

    const row = screen.getByRole('button', { name: /Review preload bridge/ })
    expect(
      within(row).getByLabelText('Parallel group, running'),
    ).toBeInTheDocument()
    expect(within(row).getByText('1/3')).toBeInTheDocument()

    await user.click(row)
    await flush()
    expect(presenter.getState().route).toBe('parallel-group')
    expect(presenter.getState().parallelGroup.groupId).toBe(
      PRELOAD_PARALLEL_GROUP_ID,
    )
    expect(row).toHaveClass('is-active')
    expect(row).toHaveAttribute('aria-current', 'page')

    const main = screen.getByRole('main')
    expect(
      within(main).getByText('Review preload bridge'),
    ).toBeInTheDocument()
    expect(within(main).getByText('1 running · 2 done')).toBeInTheDocument()
    expect(
      within(main).getAllByText(
        'Enforced for every agent here: Network: not controlled.',
      )[0],
    ).toBeInTheDocument()
    expect(
      within(main).getByRole('region', { name: 'Claude Code' }),
    ).toBeInTheDocument()
    expect(within(main).getByRole('region', { name: 'Codex' })).toBeInTheDocument()
    expect(
      within(main).getByRole('region', { name: 'Opencode' }),
    ).toBeInTheDocument()
  })

  it('reaches the Parallel group sidebar row by keyboard', async () => {
    const user = userEvent.setup()
    renderApp(createTestEngine().port)
    await flush()

    const start = screen.getByRole('button', { name: 'Collapse sidebar' })
    start.focus()
    expect(start).toHaveFocus()
    const row = screen.getByRole('button', { name: /Review preload bridge/ })
    for (let i = 0; i < 40 && document.activeElement !== row; i += 1) {
      await user.tab()
    }
    expect(row).toHaveFocus()
    await user.keyboard('{Enter}')
    await flush()
    const main = screen.getByRole('main')
    expect(
      within(main).getByText('1 running · 2 done'),
    ).toBeInTheDocument()
  })

  it('shows unavailable for a missing Parallel group without borrowing lanes', async () => {
    const { presenter } = renderApp(createTestEngine().port)
    await flush()
    presenter.openParallelGroup(asParallelGroupId('parallel-group-missing'))
    await flush()
    expect(
      screen.getByText('This parallel group is unavailable.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Claude Code')).not.toBeInTheDocument()
    expect(screen.queryByText('Reading src/preload/bridge.ts…')).not.toBeInTheDocument()
  })

  it('preserves draft, statistics range, and held launch across task navigation', async () => {
    const user = userEvent.setup()
    const engine = createTestEngine({ holdStart: true })
    const { presenter } = renderApp(engine.port)
    const { starts, resolveStart } = engine
    await flush()

    await user.type(screen.getByLabelText('Task prompt'), 'draft beside task')
    await user.click(screen.getByRole('button', { name: 'Start task' }))
    expect(starts).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Statistics' }))
    await user.click(screen.getByRole('button', { name: '7 days' }))
    expect(presenter.getState().statistics.selectedRange).toBe('7d')

    await user.click(
      screen.getByRole('button', { name: /Fix flaky slot release test/ }),
    )
    expect(await screen.findByText('Running tests…')).toBeInTheDocument()
    expect(presenter.getState().newTask.prompt).toBe('draft beside task')
    expect(presenter.getState().statistics.selectedRange).toBe('7d')
    expect(presenter.getState().newTask.submission.kind).toBe('pending')
    expect(starts).toHaveLength(1)

    resolveStart({ kind: 'accepted', taskId: asTaskId('kept-from-task') })
    await flush()
    await user.click(screen.getByRole('button', { name: /New task/ }))
    expect(
      screen.getByText(/Accepted mock task kept-from-task/),
    ).toBeInTheDocument()
    expect(starts).toHaveLength(1)
  })

  it('opens the failed task without running chrome and keeps actions inert', async () => {
    const user = userEvent.setup()
    const { port, starts } = createTestEngine()
    renderApp(port)
    await flush()

    await user.click(
      screen.getByRole('button', { name: /Migrate events.jsonl reader/ }),
    )
    const main = screen.getByRole('main')
    expect(
      await within(main).findByText('Migrate events.jsonl reader'),
    ).toBeInTheDocument()
    expect(within(main).getByText('Failed 07:48')).toBeInTheDocument()
    expect(
      within(main).getByText('Task failed: the harness exited with code 1'),
    ).toBeInTheDocument()
    const alert = within(main).getByRole('group', {
      name: 'Task failed: the harness exited with code 1',
    })
    expect(within(main).queryByRole('alert')).not.toBeInTheDocument()
    expect(alert.textContent).toContain(
      'json.decoder.JSONDecodeError: Unterminated string starting at: line 1 column 38',
    )
    expect(within(main).queryByText('Running tests…')).not.toBeInTheDocument()
    expect(
      within(main).queryByRole('button', { name: 'Stop' }),
    ).not.toBeInTheDocument()
    expect(within(main).queryByText(/^Running /)).not.toBeInTheDocument()
    expect(main.querySelector('.hd-badge--running')).toBeNull()
    expect(main.querySelector('.hd-working')).toBeNull()

    const continueSession = screen.getByRole('button', {
      name: 'Continue in a new session',
    })
    expect(continueSession).toHaveAttribute('aria-disabled', 'true')
    await user.click(continueSession)
    expect(
      screen.getByText(
        /Continue in a new session is unavailable in this exploratory slice/,
      ),
    ).toBeInTheDocument()
    const copyResume = screen.getByRole('button', {
      name: 'Copy resume command',
    })
    expect(copyResume).toHaveAttribute('aria-disabled', 'true')
    await user.click(copyResume)
    expect(
      screen.getByText(
        /Copy resume command is unavailable in this exploratory slice/,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Send follow-up (unavailable in this slice)',
      }),
    ).toBeDisabled()
    expect(starts).toHaveLength(0)
  })

  it('clears running content when navigating to the failed task', async () => {
    const user = userEvent.setup()
    const { port, publishTask } = createTestEngine({
      deferTaskIds: [EVENTS_READER_FAILED_TASK_ID],
    })
    renderApp(port)
    await flush()

    await user.click(
      screen.getByRole('button', { name: /Fix flaky slot release test/ }),
    )
    expect(await screen.findByText('Running tests…')).toBeInTheDocument()
    expect(screen.getByText('Running 04:12')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /Migrate events.jsonl reader/ }),
    )
    const main = screen.getByRole('main')
    expect(
      within(main).getByText('Migrate events.jsonl reader'),
    ).toBeInTheDocument()
    expect(
      within(main).getByRole('group', { name: 'Loading Task' }),
    ).toBeInTheDocument()
    expect(within(main).queryByText('Running tests…')).not.toBeInTheDocument()
    expect(within(main).queryByText('Running 04:12')).not.toBeInTheDocument()
    expect(
      within(main).queryByText(/test_release_frees_slot/),
    ).not.toBeInTheDocument()

    publishTask(
      EVENTS_READER_FAILED_TASK_ID,
      taskLoadFor(EVENTS_READER_FAILED_TASK_ID),
    )
    expect(
      await within(main).findByText(
        'Task failed: the harness exited with code 1',
      ),
    ).toBeInTheDocument()
    expect(within(main).getByText('Failed 07:48')).toBeInTheDocument()
    expect(within(main).queryByText('Running tests…')).not.toBeInTheDocument()
    expect(
      within(main).queryByRole('button', { name: 'Stop' }),
    ).not.toBeInTheDocument()
  })

  it('opens the completed task with summary and without running/failure chrome', async () => {
    const user = userEvent.setup()
    const { port, starts } = createTestEngine()
    renderApp(port)
    await flush()

    await user.click(
      screen.getByRole('button', {
        name: /Add retry budget to delivery queue/,
      }),
    )
    const main = screen.getByRole('main')
    expect(
      await within(main).findByText('Add retry budget to delivery queue'),
    ).toBeInTheDocument()
    expect(within(main).getByText('Done 21:04')).toBeInTheDocument()
    expect(within(main).getByText('Summary')).toBeInTheDocument()
    expect(
      within(main).getByText(/retry budget of 5 attempts per hour/),
    ).toBeInTheDocument()
    const toolDetails = within(main)
      .getByText(/pytest tests\/test_queue.py/)
      .closest('details')
    if (toolDetails) toolDetails.open = true
    const toolBody = main.querySelector('.hd-tool__body')
    expect(toolBody?.textContent).toContain('11 passed in 2.04s')
    expect(main.querySelector('.hd-badge--running')).toBeNull()
    expect(main.querySelector('.hd-badge--failed')).toBeNull()
    expect(within(main).queryByRole('alert')).not.toBeInTheDocument()
    expect(
      within(main).queryByRole('button', { name: 'Stop' }),
    ).not.toBeInTheDocument()
    expect(
      within(main).queryByRole('button', {
        name: 'Continue in a new session',
      }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Send follow-up (unavailable in this slice)',
      }),
    ).toBeDisabled()
    expect(starts).toHaveLength(0)
  })

  it('navigates running → failed → completed without stale titles or content', async () => {
    const user = userEvent.setup()
    const { port, publishTask } = createTestEngine({
      deferTaskIds: [RETRY_BUDGET_DONE_TASK_ID],
    })
    renderApp(port)
    await flush()

    await user.click(
      screen.getByRole('button', { name: /Fix flaky slot release test/ }),
    )
    expect(await screen.findByText('Running tests…')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /Migrate events.jsonl reader/ }),
    )
    expect(
      await screen.findByText('Task failed: the harness exited with code 1'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Running tests…')).not.toBeInTheDocument()
    expect(screen.getByText('Failed 07:48')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', {
        name: /Add retry budget to delivery queue/,
      }),
    )
    const main = screen.getByRole('main')
    expect(
      within(main).getByText('Add retry budget to delivery queue'),
    ).toBeInTheDocument()
    expect(
      within(main).getByRole('group', { name: 'Loading Task' }),
    ).toBeInTheDocument()
    expect(
      within(main).queryByText('Task failed: the harness exited with code 1'),
    ).not.toBeInTheDocument()
    expect(within(main).queryByText('Failed 07:48')).not.toBeInTheDocument()
    expect(within(main).queryByText('Running tests…')).not.toBeInTheDocument()

    publishTask(
      RETRY_BUDGET_DONE_TASK_ID,
      taskLoadFor(RETRY_BUDGET_DONE_TASK_ID),
    )
    expect(await within(main).findByText('Done 21:04')).toBeInTheDocument()
    expect(within(main).getByText('Summary')).toBeInTheDocument()
    expect(
      within(main).queryByText('Task failed: the harness exited with code 1'),
    ).not.toBeInTheDocument()
    expect(within(main).queryByText('Running 04:12')).not.toBeInTheDocument()
  })

  it('opens and closes the Changes pane and selects two fixture files', async () => {
    const user = userEvent.setup()
    const { port, starts } = createTestEngine()
    renderApp(port)
    await flush()

    await user.click(
      screen.getByRole('button', {
        name: /Add retry budget to delivery queue/,
      }),
    )
    const main = screen.getByRole('main')
    expect(await within(main).findByText('Done 21:04')).toBeInTheDocument()
    // A completed task with an observed exit opens on Changes by default.
    expect(
      await within(main).findByRole('complementary', { name: 'Task details' }),
    ).toBeInTheDocument()
    const toggle = within(main).getByRole('button', {
      name: /Show right pane|Hide right pane/,
    })
    await user.click(toggle)
    expect(
      within(main).queryByRole('complementary', { name: 'Task details' }),
    ).not.toBeInTheDocument()
    await user.click(toggle)
    const pane = await within(main).findByRole('complementary', {
      name: 'Task details',
    })
    expect(within(pane).getByRole('tab', { name: /Changes/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(pane).getAllByText(QUEUE_PY_PATH).length).toBeGreaterThan(0)
    expect(within(pane).getByText('+24')).toBeInTheDocument()
    expect(within(pane).getByText('\u22123')).toBeInTheDocument()
    // No row is selected until the user picks one.
    expect(
      within(pane).queryByRole('group', { name: `Diff of ${QUEUE_PY_PATH}` }),
    ).not.toBeInTheDocument()
    await user.click(
      within(pane).getByRole('button', { name: new RegExp(QUEUE_PY_PATH) }),
    )
    expect(
      await within(pane).findByRole('group', {
        name: `Diff of ${QUEUE_PY_PATH}`,
      }),
    ).toBeInTheDocument()
    expect(
      within(pane).getByText('@@ -41,9 +41,18 @@ class DeliveryQueue'),
    ).toBeInTheDocument()

    await user.click(
      within(pane).getByRole('button', {
        name: new RegExp(CONFIG_PY_PATH),
      }),
    )
    expect(
      await within(pane).findByRole('group', {
        name: `Diff of ${CONFIG_PY_PATH}`,
      }),
    ).toBeInTheDocument()
    expect(
      within(pane).getByText(/<script>alert\('x'\)<\/script>/),
    ).toBeInTheDocument()
    expect(within(pane).getByText(/日本語/)).toBeInTheDocument()
    expect(
      within(pane).queryByText('@@ -41,9 +41,18 @@ class DeliveryQueue'),
    ).not.toBeInTheDocument()

    await user.click(
      within(pane).getByRole('tab', { name: 'Artifacts' }),
    )
    expect(
      screen.getByText(/Artifacts is unavailable in this exploratory slice/),
    ).toBeInTheDocument()
    expect(starts).toHaveLength(0)

    await user.click(
      within(main).getByRole('button', { name: /Show right pane|Hide right pane/ }),
    )
    expect(
      within(main).queryByRole('complementary', { name: 'Task details' }),
    ).not.toBeInTheDocument()
  })

  it('keeps keyboard focus on the file list while a deferred diff loads', async () => {
    const user = userEvent.setup()
    const { port, captureChangesCallback, publishTaskChanges } =
      createTestEngine({ deferChanges: true })
    const { presenter } = renderApp(port)
    await flush()

    await user.click(
      screen.getByRole('button', {
        name: /Add retry budget to delivery queue/,
      }),
    )
    await within(screen.getByRole('main')).findByText('Done 21:04')
    const main = screen.getByRole('main')
    const queryNull = {
      taskId: RETRY_BUDGET_DONE_TASK_ID,
      selectedEntry: null,
      turnTaskId: null,
    }
    publishTaskChanges(queryNull, taskChangesLoadFor(queryNull))
    const pane = await within(main).findByRole('complementary', {
      name: 'Task details',
    })
    await user.click(
      within(pane).getByRole('button', { name: new RegExp(QUEUE_PY_PATH) }),
    )
    const queryQueue = {
      taskId: RETRY_BUDGET_DONE_TASK_ID,
      selectedEntry: QUEUE_ENTRY,
      turnTaskId: null,
    }
    publishTaskChanges(queryQueue, taskChangesLoadFor(queryQueue))
    expect(
      await within(pane).findByRole('group', {
        name: `Diff of ${QUEUE_PY_PATH}`,
      }),
    ).toBeInTheDocument()

    const stale = captureChangesCallback()
    expect(stale).not.toBeNull()
    expect(typeof stale).toBe('function')

    const configRow = within(pane).getByRole('button', {
      name: new RegExp(CONFIG_PY_PATH),
    })
    configRow.focus()
    expect(configRow).toHaveFocus()
    await user.keyboard('{Enter}')
    await flush()
    expect(presenter.getState().task.changesLoad.kind).toBe('loading')
    expect(presenter.getState().task.selectedChangeEntry).toEqual(CONFIG_ENTRY)
    expect(
      within(pane).getByRole('button', { name: new RegExp(CONFIG_PY_PATH) }),
    ).toBeInTheDocument()
    expect(
      within(pane).queryByRole('group', { name: `Diff of ${QUEUE_PY_PATH}` }),
    ).not.toBeInTheDocument()
    expect(
      within(pane).getByRole('group', { name: 'Reading diff' }),
    ).toHaveAttribute('aria-busy', 'true')
    expect(
      within(pane).getByRole('button', { name: new RegExp(CONFIG_PY_PATH) }),
    ).toHaveFocus()

    stale!(taskChangesLoadFor(queryQueue))
    expect(presenter.getState().task.changesLoad.kind).toBe('loading')
    expect(
      within(pane).queryByRole('group', { name: `Diff of ${QUEUE_PY_PATH}` }),
    ).not.toBeInTheDocument()

    const queryConfig = {
      taskId: RETRY_BUDGET_DONE_TASK_ID,
      selectedEntry: CONFIG_ENTRY,
      turnTaskId: null,
    }
    publishTaskChanges(queryConfig, taskChangesLoadFor(queryConfig))
    expect(
      await within(pane).findByRole('group', {
        name: `Diff of ${CONFIG_PY_PATH}`,
      }),
    ).toBeInTheDocument()
    expect(
      within(pane).getByRole('button', { name: new RegExp(CONFIG_PY_PATH) }),
    ).toBeInTheDocument()
  })

  it('closes Changes when navigating completed → running → failed', async () => {
    const user = userEvent.setup()
    const { port, captureChangesCallback, publishTaskChanges } =
      createTestEngine({ deferChanges: true })
    const { presenter } = renderApp(port)
    await flush()

    await user.click(
      screen.getByRole('button', {
        name: /Add retry budget to delivery queue/,
      }),
    )
    await screen.findByText('Done 21:04')
    const queryNull = {
      taskId: RETRY_BUDGET_DONE_TASK_ID,
      selectedEntry: null,
      turnTaskId: null,
    }
    publishTaskChanges(queryNull, taskChangesLoadFor(queryNull))
    expect(
      await screen.findByRole('complementary', { name: 'Task details' }),
    ).toBeInTheDocument()
    const stale = captureChangesCallback()
    expect(stale).not.toBeNull()

    await user.click(
      screen.getByRole('button', { name: /Fix flaky slot release test/ }),
    )
    expect(await screen.findByText('Running 04:12')).toBeInTheDocument()
    expect(presenter.getState().task.changesPaneOpen).toBe(false)
    expect(
      screen.queryByRole('complementary', { name: 'Task details' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Show right pane|Hide right pane/ }),
    ).toBeInTheDocument()
    stale!(taskChangesLoadFor(queryNull))
    expect(presenter.getState().task.changesPaneOpen).toBe(false)

    await user.click(
      screen.getByRole('button', { name: /Migrate events.jsonl reader/ }),
    )
    expect(
      await screen.findByText('Task failed: the harness exited with code 1'),
    ).toBeInTheDocument()
    expect(presenter.getState().task.changesPaneOpen).toBe(false)
    expect(
      screen.queryByRole('complementary', { name: 'Task details' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Show right pane|Hide right pane/ }),
    ).toBeInTheDocument()
  })

  it('keeps follow-up and unavailable destinations from mutating or launching', async () => {
    const user = userEvent.setup()
    const { port, starts } = createTestEngine()
    const { presenter } = renderApp(port)
    await flush()
    await user.click(
      screen.getByRole('button', {
        name: /Add retry budget to delivery queue/,
      }),
    )
    await screen.findByText('Done 21:04')
    await screen.findByRole('complementary', { name: 'Task details' })
    const artifacts = screen.getByRole('tab', { name: 'Artifacts' })
    const events = screen.getByRole('tab', { name: 'Events' })
    const beforeTab = presenter.getState().task.paneTab
    await user.click(artifacts)
    expect(presenter.getState().task.paneTab).toBe(beforeTab)
    await user.click(events)
    events.focus()
    await user.keyboard('{Enter}')
    expect(presenter.getState().task.paneTab).toBe('events')
    expect(
      screen.getByRole('button', {
        name: 'Send follow-up (unavailable in this slice)',
      }),
    ).toBeDisabled()
    expect(starts).toHaveLength(0)
  })

  it('opens Settings and keeps appearance in agreement with the sidebar', async () => {
    const user = userEvent.setup()
    const { port, starts } = createTestEngine()
    const { container, presenter } = renderApp(port)
    await flush()

    await user.click(screen.getByRole('button', { name: 'Settings' }))
    const main = screen.getByRole('main')
    expect(
      await within(main).findByRole('heading', { name: 'Settings' }),
    ).toBeInTheDocument()
    expect(
      within(main).getByRole('tab', { name: 'General' }),
    ).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    const theme = within(main).getByRole('group', { name: 'Theme' })
    const light = within(theme).getByRole('button', { name: 'Light' })
    light.focus()
    expect(light).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(presenter.getState().newTask.appearance).toBe('light')
    expect(light).toHaveAttribute('aria-pressed', 'true')
    expect(
      within(screen.getByRole('group', { name: 'Appearance' })).getByRole(
        'button',
        { name: 'Light' },
      ),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(container.querySelector('.hd-app')?.getAttribute('data-theme')).toBe(
      'light',
    )

    await user.click(within(theme).getByRole('button', { name: 'Dark' }))
    expect(presenter.getState().newTask.appearance).toBe('dark')
    expect(container.querySelector('.hd-app')?.getAttribute('data-theme')).toBe(
      'dark',
    )

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }))
    expect(
      screen.getByRole('button', { name: 'Appearance: Dark. Switch to System' }),
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Appearance: Dark. Switch to System' }),
    )
    expect(presenter.getState().newTask.appearance).toBe('system')
    expect(container.querySelector('.hd-app')?.getAttribute('data-theme')).toBe(
      'light',
    )

    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }))
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    const openNotify = within(main).getByRole('switch', {
      name: 'Open the window when a task starts',
    })
    expect(openNotify).toBeDisabled()
    expect(openNotify).toHaveAccessibleDescription(
      /not saved preferences or active notification settings/,
    )
    expect(openNotify).toHaveAttribute('aria-checked', 'false')
    expect(
      screen.queryByText(
        /Open the window when a task starts is unavailable in this exploratory slice/,
      ),
    ).not.toBeInTheDocument()
    await user.click(
      within(main).getByRole('button', { name: 'Check for updates' }),
    )
    await user.click(
      within(main).getByRole('button', { name: 'Inspect task store' }),
    )
    await user.click(
      within(main).getByRole('button', { name: 'Show backup in Finder' }),
    )
    const harnesses = within(main).getByRole('tab', { name: 'Harnesses' })
    harnesses.focus()
    expect(harnesses).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(harnesses).toHaveAttribute('aria-selected', 'true')
    expect(
      (await within(main).findAllByText('Claude Code')).length,
    ).toBeGreaterThan(0)
    expect(within(main).getByText('Server: ~/.harflow/bin/harflow-mcp')).toBeInTheDocument()
    expect(
      within(main).getByText('Fixture label. Not a path on this computer.'),
    ).toBeInTheDocument()
    const refresh = within(main).getByRole('button', { name: 'Refresh' })
    expect(refresh).toBeDisabled()
    expect(refresh).toHaveAccessibleDescription(/does not install, register, refresh/)
    const remove = within(main).getByRole('button', { name: 'Remove Claude Code' })
    expect(remove).toBeDisabled()
    fireEvent.click(remove)
    fireEvent.click(refresh)
    expect(presenter.getState().newTask.appearance).toBe('system')
    expect(starts).toHaveLength(0)
    expect(screen.queryByText(/Harnesses is unavailable/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Dark' }))
    expect(presenter.getState().newTask.appearance).toBe('dark')
    expect(container.querySelector('.hd-app')?.getAttribute('data-theme')).toBe(
      'dark',
    )
    await user.click(within(main).getByRole('tab', { name: 'General' }))
    expect(
      within(within(main).getByRole('group', { name: 'Theme' })).getByRole(
        'button',
        { name: 'Dark' },
      ),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('preserves draft, task, statistics range, and a held launch across Settings', async () => {
    const user = userEvent.setup()
    const engine = createTestEngine({ holdStart: true })
    const { presenter } = renderApp(engine.port)
    await flush()

    await user.type(screen.getByLabelText('Task prompt'), 'draft beside settings')
    await user.click(screen.getByRole('button', { name: 'Start task' }))
    expect(engine.starts).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Statistics' }))
    await user.click(screen.getByRole('button', { name: '7 days' }))
    await user.click(
      screen.getByRole('button', { name: /Fix flaky slot release test/ }),
    )
    expect(await screen.findByText('Running tests…')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Settings' }))
    expect(
      await screen.findByRole('heading', { name: 'Settings' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Harnesses' }))
    expect((await screen.findAllByText('Claude Code')).length).toBeGreaterThan(0)
    expect(presenter.getState().newTask.prompt).toBe('draft beside settings')
    expect(presenter.getState().statistics.selectedRange).toBe('7d')
    expect(presenter.getState().task.selectedTaskId).toBeTruthy()
    expect(presenter.getState().newTask.submission.kind).toBe('pending')
    expect(engine.starts).toHaveLength(1)

    await user.click(
      screen.getByRole('button', { name: /Fix flaky slot release test/ }),
    )
    expect(await screen.findByText('Running tests…')).toBeInTheDocument()
    engine.resolveStart({ kind: 'accepted', taskId: asTaskId('kept-settings') })
    await flush()
    await user.click(screen.getByRole('button', { name: /New task/ }))
    expect(
      screen.getByText(/Accepted mock task kept-settings/),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Task prompt')).toHaveValue('')
    expect(engine.starts).toHaveLength(1)
    expect(presenter.getState().statistics.selectedRange).toBe('7d')
  })

  it('resolves System appearance from the Settings theme control', async () => {
    const user = userEvent.setup()
    let matches = false
    const listeners = new Set<() => void>()
    const original = window.matchMedia.bind(window)
    window.matchMedia = (() =>
      ({
        get matches() {
          return matches
        },
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener(_type: string, listener: EventListener) {
          listeners.add(listener as () => void)
        },
        removeEventListener(_type: string, listener: EventListener) {
          listeners.delete(listener as () => void)
        },
        addListener() {
          /* no-op */
        },
        removeListener() {
          /* no-op */
        },
        dispatchEvent() {
          return false
        },
      }) as MediaQueryList) as typeof window.matchMedia
    try {
      const { port } = createTestEngine()
      const { container } = renderApp(port)
      await flush()
      await user.click(screen.getByRole('button', { name: 'Settings' }))
      const theme = within(screen.getByRole('main')).getByRole('group', {
        name: 'Theme',
      })
      const system = within(theme).getByRole('button', { name: 'System' })
      system.focus()
      expect(system).toHaveFocus()
      await user.keyboard(' ')
      expect(system).toHaveAttribute('aria-pressed', 'true')
      expect(
        container.querySelector('.hd-app')?.getAttribute('data-theme'),
      ).toBe('light')
      matches = true
      await act(async () => {
        for (const listener of listeners) listener()
      })
      expect(
        container.querySelector('.hd-app')?.getAttribute('data-theme'),
      ).toBe('dark')
      expect(
        within(screen.getByRole('group', { name: 'Appearance' })).getByRole(
          'button',
          { name: 'System' },
        ),
      ).toHaveAttribute('aria-pressed', 'true')
    } finally {
      window.matchMedia = original
    }
  })

  it('keeps the unmapped Needs you question off the failed-task transcript', async () => {
    const user = userEvent.setup()
    const { port, starts } = createTestEngine()
    const { presenter } = renderApp(port)
    await flush()

    const nav = screen.getByRole('navigation', { name: 'Main' })
    await user.click(within(nav).getByRole('button', { name: /Needs you/ }))
    const question = await screen.findByRole('region', { name: 'Asks a question' })
    const openQuestion = within(question).getByRole('button', {
      name: 'Open task Migrate events.jsonl reader',
    })
    expect(openQuestion).toBeDisabled()
    expect(openQuestion).toHaveAttribute('aria-disabled', 'true')
    expect(openQuestion).toHaveAccessibleDescription(
      /Question replies are not available/,
    )
    await user.click(openQuestion)
    fireEvent.keyDown(openQuestion, { key: 'Enter' })
    expect(presenter.getState().route).toBe('needs-you')
    expect(presenter.getState().task.selectedTaskId).toBeNull()
    expect(screen.queryByText('Failed 07:48')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Task failed: the harness exited with code 1'),
    ).not.toBeInTheDocument()
    expect(starts).toHaveLength(0)

    const approval = screen.getByRole('region', { name: 'Wants to run a command' })
    await user.click(
      within(approval).getByRole('button', {
        name: 'Open task Fix flaky slot release test',
      }),
    )
    expect(presenter.getState().route).toBe('task')
    expect(presenter.getState().task.selectedTaskId).toBe(SLOT_RELEASE_TASK_ID)
    expect(await screen.findByText('Running tests…')).toBeInTheDocument()
    expect(screen.queryByText('Failed 07:48')).not.toBeInTheDocument()
    expect(starts).toHaveLength(0)
  })

  it('keeps the Needs you badge, page, and surrounding state on one observation', async () => {
    const user = userEvent.setup()
    const engine = createTestEngine({ holdStart: true })
    const { presenter } = renderApp(engine.port)
    await flush()

    await user.type(
      screen.getByLabelText('Task prompt'),
      'draft beside needs you',
    )
    await user.click(screen.getByRole('button', { name: 'Start task' }))
    await user.click(screen.getByRole('button', { name: 'Statistics' }))
    await user.click(screen.getByRole('button', { name: '7 days' }))
    await user.click(
      screen.getByRole('button', { name: /Fix flaky slot release test/ }),
    )
    const selectedTask = presenter.getState().task.selectedTaskId
    expect(await screen.findByText('Running tests…')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await user.click(screen.getByRole('tab', { name: 'Harnesses' }))
    const sidebar = screen.getByRole('complementary', { name: 'Sidebar' })
    await user.click(within(sidebar).getByRole('button', { name: 'Dark' }))

    const nav = screen.getByRole('navigation', { name: 'Main' })
    const needs = within(nav).getByRole('button', { name: /Needs you/ })
    expect(within(nav).getByText('3')).toBeInTheDocument()
    needs.focus()
    expect(needs).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(
      await screen.findByRole('heading', { name: 'Needs you' }),
    ).toBeInTheDocument()
    expect(screen.getByText('3 waiting')).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Wants to run a command' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Wants to publish' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Asks a question' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Nothing needs you')).not.toBeInTheDocument()
    expect(presenter.getState().newTask.prompt).toBe('draft beside needs you')
    expect(presenter.getState().statistics.selectedRange).toBe('7d')
    expect(presenter.getState().task.selectedTaskId).toBe(selectedTask)
    expect(presenter.getState().settingsSection).toBe('harnesses')
    expect(presenter.getState().newTask.appearance).toBe('dark')
    expect(presenter.getState().newTask.submission.kind).toBe('pending')
    expect(engine.starts).toHaveLength(1)

    const command = screen.getByRole('region', { name: 'Wants to run a command' })
    expect(
      within(command).getByRole('button', { name: 'Approve once' }),
    ).toBeEnabled()
    expect(
      within(command).getByRole('button', { name: 'Reject' }),
    ).toBeEnabled()
    const send = screen.getByRole('button', { name: 'Send' })
    expect(send).toBeDisabled()
    await user.click(send)
    const openRun = screen.getByRole('button', {
      name: 'Open run Nightly dependency audit',
    })
    expect(openRun).toBeEnabled()
    await user.click(openRun)
    expect(engine.starts).toHaveLength(1)
    expect(presenter.getState().route).toBe('workflows')
    expect(presenter.getState().workflowExecution.runId).toBe(
      'run-nightly-dependency-audit',
    )
    const step = screen.getByRole('complementary', { name: 'Selected step' })
    expect(step).toHaveTextContent('Open pull request')
    expect(step).toHaveTextContent('Publish changes')
    expect(screen.getByRole('list', { name: /Scan lockfiles/ })).toBeInTheDocument()
    await user.click(within(nav).getByRole('button', { name: 'Workflows' }))
    expect(presenter.getState().workflowExecution.runId).toBeNull()
    await user.click(within(nav).getByRole('button', { name: /Needs you/ }))
    expect(presenter.getState().route).toBe('needs-you')

    const openTask = screen.getByRole('button', {
      name: 'Open task Fix flaky slot release test',
    })
    openTask.focus()
    await user.keyboard('{Enter}')
    expect(presenter.getState().route).toBe('task')
    expect(presenter.getState().task.selectedTaskId).toBe(SLOT_RELEASE_TASK_ID)
    expect(engine.starts).toHaveLength(1)

    await user.click(within(nav).getByRole('button', { name: /Needs you/ }))
    engine.publishNeedsYou({
      kind: 'ready',
      observation: partialNeedsYouObservation(),
    })
    await flush()
    expect(within(nav).getByText('1+')).toBeInTheDocument()
    expect(screen.getByText(/Coverage is incomplete/)).toBeInTheDocument()
    expect(screen.queryByText('Nothing needs you')).not.toBeInTheDocument()
    expect(screen.queryByText('1 waiting')).not.toBeInTheDocument()

    engine.publishNeedsYou(emptyNeedsYouLoad())
    await flush()
    expect(screen.getByText('Nothing needs you')).toBeInTheDocument()
    expect(within(nav).queryByText('3')).not.toBeInTheDocument()
    expect(screen.queryByText(/waiting/)).not.toBeInTheDocument()

    engine.publishNeedsYou({ kind: 'loading' })
    await flush()
    expect(screen.queryByText('Nothing needs you')).not.toBeInTheDocument()
    expect(
      screen.getByRole('group', { name: 'Loading Needs you' }),
    ).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByText('3 waiting')).not.toBeInTheDocument()
    expect(within(nav).queryByText('3')).not.toBeInTheDocument()
    expect(within(nav).queryByText('0')).not.toBeInTheDocument()
    expect(
      within(sidebar).getByRole('button', {
        name: /Fix flaky slot release test/,
      }),
    ).toBeInTheDocument()
    expect(
      within(sidebar).getByRole('button', { name: /Review preload bridge/ }),
    ).toBeInTheDocument()

    engine.publishNeedsYou(unavailableNeedsYouLoad())
    await flush()
    expect(screen.queryByText('Nothing needs you')).not.toBeInTheDocument()
    expect(screen.getByText('Needs you is unavailable.')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Loading Needs you' })).toBeNull()
    expect(within(nav).queryByText('0')).not.toBeInTheDocument()
    expect(presenter.getState().settingsSection).toBe('harnesses')
    expect(presenter.getState().newTask.appearance).toBe('dark')
    expect(presenter.getState().statistics.selectedRange).toBe('7d')
    expect(presenter.getState().newTask.prompt).toBe('draft beside needs you')
    expect(engine.starts).toHaveLength(1)
  })

  it('opens the security reviewer inspector from the run strip and closes it', async () => {
    const user = userEvent.setup()
    const engine = createTestEngine()
    const { presenter } = renderApp(engine.port)
    await flush()
    const nav = screen.getByRole('navigation', { name: 'Main' })
    await user.click(within(nav).getByRole('button', { name: /Needs you/ }))
    await user.click(
      screen.getByRole('button', { name: 'Open run Nightly dependency audit' }),
    )
    await user.click(
      await screen.findByRole('button', {
        name: 'Security reviewer, on demand node, done, not selected',
      }),
    )
    expect(
      screen.getByRole('complementary', { name: 'Selected on-demand node' }),
    ).toHaveTextContent('Done · no advisories · 01:12')
    expect(presenter.getState().workflowExecution.selectedNodeId).toBe(
      'run-security-reviewer',
    )
    const ready = presenter.getState().workflowExecution.load
    expect(ready.kind).toBe('ready')
    if (ready.kind === 'ready') {
      expect(ready.run.selectedNodeId).toBe('run-open-pull-request')
    }
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.getByRole('complementary', { name: 'Selected step' })).toHaveTextContent(
      'Publish changes',
    )
    expect(presenter.getState().workflowExecution.selectedNodeId).toBeNull()
    expect(
      screen.getByRole('button', {
        name: 'Docs checker, on demand node, not called, not selected',
      }),
    ).toBeDisabled()
  })

  it('shows the workflow list on the first Workflows click after leaving the run', async () => {
    const user = userEvent.setup()
    const engine = createTestEngine()
    const { presenter } = renderApp(engine.port)
    await flush()
    const nav = screen.getByRole('navigation', { name: 'Main' })
    await user.click(within(nav).getByRole('button', { name: /Needs you/ }))
    await user.click(
      screen.getByRole('button', { name: 'Open run Nightly dependency audit' }),
    )
    expect(
      await screen.findByRole('complementary', { name: 'Selected step' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    expect(presenter.getState().workflowExecution.runId).toBeNull()
    await user.click(within(nav).getByRole('button', { name: 'Workflows' }))
    expect(screen.getByRole('heading', { name: 'Workflows' })).toBeInTheDocument()
    expect(
      screen.queryByRole('complementary', { name: 'Selected step' }),
    ).not.toBeInTheDocument()
    expect(presenter.getState().route).toBe('workflows')
    expect(presenter.getState().workflowExecution.runId).toBeNull()
  })

  it('keeps workflow run drafts isolated and leaves final Run unavailable', async () => {
    const user = userEvent.setup()
    const engine = createTestEngine({ holdStart: true })
    const { presenter } = renderApp(engine.port)
    await flush()

    await user.type(
      screen.getByLabelText('Task prompt'),
      'draft beside workflow run',
    )
    await user.click(screen.getByRole('button', { name: 'Start task' }))
    await user.click(screen.getByRole('button', { name: 'Statistics' }))
    await user.click(screen.getByRole('button', { name: '7 days' }))
    await user.click(
      screen.getByRole('button', { name: /Fix flaky slot release test/ }),
    )
    const selectedTask = presenter.getState().task.selectedTaskId
    expect(await screen.findByText('Running tests…')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await user.click(screen.getByRole('tab', { name: 'Harnesses' }))
    const sidebar = screen.getByRole('complementary', { name: 'Sidebar' })
    await user.click(within(sidebar).getByRole('button', { name: 'Dark' }))

    const nav = screen.getByRole('navigation', { name: 'Main' })
    await user.click(within(nav).getByRole('button', { name: 'Workflows' }))
    const releaseRow = (await screen.findByText('Release checklist')).closest(
      '[role="listitem"]',
    )
    expect(releaseRow).not.toBeNull()
    const runRelease = within(releaseRow as HTMLElement).getByRole('button', {
      name: 'Run Release checklist',
    })
    runRelease.focus()
    expect(runRelease).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(
      await screen.findByRole('heading', { name: 'Run Release checklist' }),
    ).toBeInTheDocument()

    const task = screen.getByLabelText(/Task/)
    expect((task as HTMLTextAreaElement).value).toContain('0.4.3')
    fireEvent.change(task, { target: { value: '  alpha  ' } })
    expect(
      presenter.getState().workflows.drafts['wf-release-checklist']?.task,
    ).toBe('  alpha  ')

    const goalToggle = screen.getByRole('button', { name: 'Goal (optional)' })
    expect(goalToggle).toHaveAttribute('aria-expanded', 'true')
    fireEvent.change(screen.getByLabelText('Goal'), {
      target: { value: 'keep goal' },
    })
    goalToggle.focus()
    await user.keyboard('{Enter}')
    expect(goalToggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByLabelText('Goal')).not.toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(screen.getByLabelText('Goal')).toHaveValue('keep goal')

    await user.click(screen.getByRole('button', { name: 'HarflowMCP' }))
    const mac = screen.getByRole('menuitem', { name: /HarflowMac/ })
    mac.focus()
    expect(mac).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(
      screen.getByText('Codex · Read-only · Network: not controlled'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Can edit this repo/)).not.toBeInTheDocument()
    expect(screen.getByText(/do not claim enforcement/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Orchestrator: saved' }))
    const custom = screen.getByRole('menuitem', { name: /Custom orchestrator/ })
    expect(custom).toBeDisabled()
    expect(custom).toHaveAccessibleDescription(
      /does not replace the saved orchestrator/,
    )
    await user.click(custom)
    expect(
      presenter.getState().workflows.drafts['wf-release-checklist']?.overrideId,
    ).toBe('saved')

    const submit = screen.getByRole('button', { name: 'Run workflow' })
    expect(submit).toBeDisabled()
    expect(submit).toHaveAccessibleDescription(/does not run, save, delete/)
    await user.click(submit)
    fireEvent.keyDown(submit, { key: 'Enter' })
    expect(engine.starts).toHaveLength(1)

    const main = screen.getByRole('main')
    await user.click(within(main).getByRole('button', { name: 'Workflows' }))
    const list = within(main).getByRole('list')
    const nightlyRow = within(list)
      .getByText('Nightly dependency audit')
      .closest('[role="listitem"]')
    expect(nightlyRow).not.toBeNull()
    await user.click(
      within(nightlyRow as HTMLElement).getByRole('button', {
        name: 'Run Nightly dependency audit',
      }),
    )
    expect(
      await screen.findByRole('heading', { name: 'Run Nightly dependency audit' }),
    ).toBeInTheDocument()
    expect((screen.getByLabelText(/Task/) as HTMLTextAreaElement).value).toContain(
      "tonight's",
    )
    expect(screen.queryByDisplayValue('  alpha  ')).not.toBeInTheDocument()
    expect(screen.queryByDisplayValue('keep goal')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'HarflowMCP' })).toBeInTheDocument()
    expect(
      screen.getByText('Opencode · Read-only · Network: not controlled'),
    ).toBeInTheDocument()

    await user.click(within(main).getByRole('button', { name: 'Workflows' }))
    const releaseList = within(main).getByRole('list')
    const releaseAgain = within(releaseList)
      .getByText('Release checklist')
      .closest('[role="listitem"]')
    expect(releaseAgain).not.toBeNull()
    await user.click(
      within(releaseAgain as HTMLElement).getByRole('button', {
        name: 'Run Release checklist',
      }),
    )
    expect(await screen.findByLabelText(/Task/)).toHaveValue('  alpha  ')
    expect(screen.getByLabelText('Goal')).toHaveValue('keep goal')
    expect(screen.getByRole('button', { name: 'HarflowMac' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Task/), { target: { value: '   ' } })
    expect(screen.getByLabelText(/Task/)).toHaveValue('   ')
    expect(screen.getByRole('alert')).toHaveTextContent('Task is required.')
    expect(
      presenter.getState().workflows.drafts['wf-release-checklist']?.task,
    ).toBe('   ')

    expect(presenter.getState().newTask.prompt).toBe('draft beside workflow run')
    expect(presenter.getState().newTask.submission.kind).toBe('pending')
    expect(presenter.getState().statistics.selectedRange).toBe('7d')
    expect(presenter.getState().task.selectedTaskId).toBe(selectedTask)
    expect(presenter.getState().settingsSection).toBe('harnesses')
    expect(presenter.getState().newTask.appearance).toBe('dark')
    expect(engine.starts).toHaveLength(1)
  })

  it('shows an unmapped workflow as unavailable without a fallback form', async () => {
    const { port, starts } = createTestEngine()
    const { presenter } = renderApp(port)
    await flush()
    act(() => {
      presenter.openWorkflowRun(asWorkflowId('wf-missing'))
    })
    expect(
      await screen.findByText('This workflow is unavailable.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Run / })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Task/)).not.toBeInTheDocument()
    expect(starts).toHaveLength(0)
  })

  it('keeps run identity, reloads the draft, and hides invalid permissions', async () => {
    const user = userEvent.setup()
    const engine = createTestEngine({ deferWorkflowRun: true })
    const { presenter } = renderApp(engine.port)
    await flush()
    const nav = screen.getByRole('navigation', { name: 'Main' })
    await user.click(within(nav).getByRole('button', { name: 'Workflows' }))
    const main = screen.getByRole('main')
    const releaseRow = within(main)
      .getByText('Release checklist')
      .closest('[role="listitem"]')
    expect(releaseRow).not.toBeNull()
    await user.click(
      within(releaseRow as HTMLElement).getByRole('button', {
        name: 'Run Release checklist',
      }),
    )
    expect(screen.getByText(/Loading run context/)).toBeInTheDocument()
    const release = workflowRunLoadFor(RELEASE_WORKFLOW_ID)
    if (release.kind !== 'ready') throw new Error('release fixture')
    act(() => {
      engine.publishWorkflowRun(RELEASE_WORKFLOW_ID, release)
    })
    expect(
      screen.getByRole('heading', { name: 'Run Release checklist' }),
    ).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Task/), { target: { value: '  alpha  ' } })
    fireEvent.change(screen.getByLabelText('Goal'), { target: { value: 'keep goal' } })
    await user.click(screen.getByRole('button', { name: 'HarflowMCP' }))
    await user.click(screen.getByRole('menuitem', { name: /HarflowMac/ }))
    expect(
      screen.getByText('Codex · Read-only · Network: not controlled'),
    ).toBeInTheDocument()

    await user.click(within(main).getByRole('button', { name: 'Workflows' }))
    const nightlyRow = within(main)
      .getByText('Nightly dependency audit')
      .closest('[role="listitem"]')
    expect(nightlyRow).not.toBeNull()
    await user.click(
      within(nightlyRow as HTMLElement).getByRole('button', {
        name: 'Run Nightly dependency audit',
      }),
    )
    expect(screen.getByText(/Loading run context/)).toBeInTheDocument()
    expect(screen.queryByText(/Can edit this repo/)).not.toBeInTheDocument()
    act(() => {
      engine.publishWorkflowRun(
        NIGHTLY_WORKFLOW_ID,
        workflowRunLoadFor(NIGHTLY_WORKFLOW_ID),
      )
    })
    fireEvent.change(screen.getByLabelText(/Task/), { target: { value: 'beta' } })
    act(() => {
      engine.publishWorkflowRun(
        NIGHTLY_WORKFLOW_ID,
        workflowRunLoadFor(RELEASE_WORKFLOW_ID),
      )
    })
    expect(
      screen.getByRole('heading', { name: 'Run Nightly dependency audit' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/Task/)).toHaveValue('beta')
    expect(screen.queryByDisplayValue('  alpha  ')).not.toBeInTheDocument()
    expect(presenter.getState().workflows.drafts[RELEASE_WORKFLOW_ID]?.task).toBe(
      '  alpha  ',
    )
    expect(presenter.getState().workflows.drafts[RELEASE_WORKFLOW_ID]?.goal).toBe(
      'keep goal',
    )
    expect(
      presenter.getState().workflows.drafts[RELEASE_WORKFLOW_ID]?.repositoryId,
    ).toBe(asRepositoryId('repo-mac'))
    expect(presenter.getState().workflows.drafts[NIGHTLY_WORKFLOW_ID]?.task).toBe(
      'beta',
    )
    expect(engine.starts).toHaveLength(0)

    await user.click(within(main).getByRole('button', { name: 'Workflows' }))
    const pendingRow = within(main)
      .getByText('Release checklist')
      .closest('[role="listitem"]')
    expect(pendingRow).not.toBeNull()
    await user.click(
      within(pendingRow as HTMLElement).getByRole('button', {
        name: 'Run Release checklist',
      }),
    )
    expect(screen.getByText(/Loading run context/)).toBeInTheDocument()
    const stale = engine.captureWorkflowRun(RELEASE_WORKFLOW_ID)
    act(() => {
      presenter.dispose()
      presenter.start()
    })
    expect(screen.getByText(/Loading run context/)).toBeInTheDocument()
    expect(presenter.getState().workflows.drafts[RELEASE_WORKFLOW_ID]?.task).toBe(
      '  alpha  ',
    )
    act(() => {
      stale?.(release)
    })
    expect(screen.getByText(/Loading run context/)).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Run Release checklist' }),
    ).not.toBeInTheDocument()
    act(() => {
      engine.publishWorkflowRun(RELEASE_WORKFLOW_ID, release)
    })
    expect(screen.getByLabelText(/Task/)).toHaveValue('  alpha  ')
    expect(screen.getByLabelText('Goal')).toHaveValue('keep goal')
    expect(screen.getByRole('button', { name: 'HarflowMac' })).toBeInTheDocument()

    const mac = asRepositoryId('repo-mac')
    act(() => {
      engine.publishWorkflowRun(RELEASE_WORKFLOW_ID, {
        kind: 'ready',
        context: {
          ...release.context,
          repositories: release.context.repositories.filter((item) => item.id !== mac),
        },
      })
    })
    expect(screen.getByLabelText(/Task/)).toHaveValue('  alpha  ')
    expect(screen.getByLabelText('Goal')).toHaveValue('keep goal')
    expect(screen.getByRole('button', { name: 'Repository' })).toBeInTheDocument()
    expect(
      screen.getByText('Permissions for this choice are unavailable.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Network: not controlled/)).not.toBeInTheDocument()
    expect(presenter.getState().workflows.drafts[RELEASE_WORKFLOW_ID]?.repositoryId).toBe(
      mac,
    )
    act(() => {
      engine.publishWorkflowRun(RELEASE_WORKFLOW_ID, {
        kind: 'ready',
        context: {
          ...release.context,
          overrides: release.context.overrides.map((item) =>
            item.id === 'saved' ? { ...item, available: false } : item,
          ),
        },
      })
    })
    expect(screen.getByLabelText(/Task/)).toHaveValue('  alpha  ')
    expect(screen.getByLabelText('Goal')).toHaveValue('keep goal')
    expect(screen.getByRole('button', { name: 'HarflowMac' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Orchestrator: saved' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Permissions for this choice are unavailable.'),
    ).toBeInTheDocument()
    expect(presenter.getState().workflows.drafts[RELEASE_WORKFLOW_ID]?.overrideId).toBe(
      'saved',
    )
    expect(screen.getByRole('button', { name: 'Run workflow' })).toBeDisabled()
    expect(engine.starts).toHaveLength(0)
  })

  it('inspects mapped workflow graphs without editing, launching, or stealing focus', async () => {
    const user = userEvent.setup()
    const engine = createTestEngine()
    const { presenter } = renderApp(engine.port)
    await flush()
    await user.type(screen.getByLabelText('Task prompt'), 'draft beside editor')
    const nav = screen.getByRole('navigation', { name: 'Main' })
    await user.click(within(nav).getByRole('button', { name: 'Workflows' }))
    const main = screen.getByRole('main')
    const releaseRow = within(main)
      .getByText('Release checklist')
      .closest('[role="listitem"]')
    expect(releaseRow).not.toBeNull()
    await user.click(
      within(releaseRow as HTMLElement).getByRole('button', { name: 'Edit Release checklist' }),
    )
    expect((await screen.findAllByText('Revision 7'))[0]).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'NODE' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Node name' })).toHaveValue('Review')
    const canvas = screen.getByLabelText('Workflow canvas')
    expect(canvas.className).toContain('hd-thin-scroll')
    expect(Number(canvas.dataset.contentWidth)).toBeGreaterThanOrEqual(1126)
    expect(within(canvas).queryByRole('button', { name: 'Orchestrator, locked' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Orchestrator, locked' }))
    expect(screen.getByRole('complementary', { name: 'Orchestrator settings' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'LIMITS' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete node' })).not.toBeInTheDocument()
    await user.click(within(canvas).getByRole('button', { name: /^Review$/ }))
    expect(canvas.querySelectorAll('path[data-loop="true"]')).toHaveLength(0)
    expect(canvas.querySelectorAll('path[data-loop]')).toHaveLength(8)

    const plan = screen.getByRole('button', { name: /^Plan$/ })
    plan.focus()
    await user.keyboard('{Enter}')
    expect(plan).toHaveFocus()
    expect(screen.getByRole('textbox', { name: 'Node name' })).toHaveValue('Plan')
    canvas.scrollLeft = 48
    expect(plan).toHaveFocus()
    expect(canvas.scrollLeft).toBe(48)
    expect(screen.getByRole('textbox', { name: 'Node name' })).toHaveValue('Plan')
    const releaseCallback = engine.captureWorkflowEditor(
      asWorkflowId('wf-release-checklist'),
    )
    act(() => {
      engine.publishWorkflowEditor(
        asWorkflowId('wf-release-checklist'),
        workflowEditorLoadFor(asWorkflowId('wf-release-checklist')),
      )
    })
    expect(plan).toHaveFocus()
    expect(screen.getByRole('textbox', { name: 'Node name' })).toHaveValue('Plan')

    const ready = workflowEditorLoadFor(asWorkflowId('wf-release-checklist'))
    if (ready.kind !== 'ready') throw new Error('release fixture')
    const review = asWorkflowNodeId('release-review')
    act(() => {
      presenter.selectWorkflowNode(review)
    })
    expect(screen.getByRole('textbox', { name: 'Node name' })).toHaveValue('Review')
    act(() => {
      engine.publishWorkflowEditor(asWorkflowId('wf-release-checklist'), {
        kind: 'ready',
        definition: {
          ...ready.definition,
          nodes: ready.definition.nodes.filter((node) => node.id !== review),
          edges: ready.definition.edges.filter(
            (edge) => edge.from !== review && edge.to !== review,
          ),
        },
      })
    })
    expect(screen.getByText('This node is unavailable.')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('Plan')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Plan$/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )

    await user.click(within(main).getByRole('button', { name: 'Workflows' }))
    const nightlyRow = within(main)
      .getByText('Nightly dependency audit')
      .closest('[role="listitem"]')
    expect(nightlyRow).not.toBeNull()
    await user.click(
      within(nightlyRow as HTMLElement).getByRole('button', {
        name: 'Edit Nightly dependency audit',
      }),
    )
    expect((await screen.findAllByText('Revision 2'))[0]).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Node name' })).toHaveValue('Audit lockfiles')
    const nightlyCanvas = screen.getByLabelText('Workflow canvas')
    const loop = nightlyCanvas.querySelector('path[data-loop="true"]')
    expect(loop).not.toBeNull()
    expect(loop?.getAttribute('d') ?? '').not.toMatch(/-/)
    expect(nightlyCanvas.className).toContain('hd-thin-scroll')
    act(() => {
      releaseCallback?.(workflowEditorLoadFor(asWorkflowId('wf-release-checklist')))
    })
    expect(screen.getByRole('textbox', { name: 'Node name' })).toHaveValue('Audit lockfiles')
    expect(screen.queryByDisplayValue('Review')).not.toBeInTheDocument()

    const save = screen.getByRole('button', { name: 'Save' })
    expect(save).toBeDisabled()
    expect(save).toHaveAccessibleDescription(/does not edit, save, delete, connect, or run/)
    await user.click(save)
    await user.click(screen.getByRole('button', { name: /^Run$/ }))
    await user.click(screen.getByRole('button', { name: 'Edit with agent' }))
    expect(engine.starts).toHaveLength(0)
    expect(presenter.getState().newTask.prompt).toBe('draft beside editor')

    await user.click(within(main).getByRole('button', { name: 'Workflows' }))
    const docsRow = within(main).getByText('Docs link check').closest('[role="listitem"]')
    expect(docsRow).not.toBeNull()
    await user.click(
      within(docsRow as HTMLElement).getByRole('button', { name: 'Edit Docs link check' }),
    )
    expect(await screen.findByText('This workflow is unavailable.')).toBeInTheDocument()
    expect(within(main).queryByLabelText('Workflow canvas')).not.toBeInTheDocument()
    expect(within(main).queryByText('Release checklist')).not.toBeInTheDocument()
    expect(engine.starts).toHaveLength(0)
  })
})

describe('AppFeature first-load skeletons', () => {
  it('shows new-task loading, replaces on ready, and drops it after navigate away', async () => {
    const user = userEvent.setup()
    const engine = createTestEngine({ deferContext: true })
    const { presenter } = renderApp(engine.port)
    await flush()
    expect(screen.getByRole('group', { name: 'Loading New task' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(screen.getByRole('group', { name: 'Loading tasks' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByText('Fix flaky slot release test')).toBeNull()

    engine.publishContext(readyContext())
    await flush()
    expect(screen.queryByRole('group', { name: 'Loading New task' })).toBeNull()
    expect(screen.getByText('Fix flaky slot release test')).toBeInTheDocument()

    engine.publishContext({ kind: 'loading' })
    await flush()
    expect(screen.getByRole('group', { name: 'Loading New task' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Workflows' }))
    expect(presenter.getState().route).toBe('workflows')
    expect(screen.queryByRole('group', { name: 'Loading New task' })).toBeNull()
  })

  it('keeps the composer operable while sidebar listing loads', async () => {
    const engine = createTestEngine({ sidebarListingLoading: true })
    renderApp(engine.port)
    await flush()
    expect(screen.getByRole('group', { name: 'Loading tasks' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByText('Fix flaky slot release test')).toBeNull()
    expect(screen.getByRole('textbox', { name: 'Task prompt' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'More task options' })).toBeEnabled()

    engine.publishContext(readyContext())
    await flush()
    expect(screen.queryByRole('group', { name: 'Loading tasks' })).toBeNull()
    expect(screen.getByText('Fix flaky slot release test')).toBeInTheDocument()
  })

  it('shows task loading while deferred, replaces on ready, clears after leave', async () => {
    const user = userEvent.setup()
    const engine = createTestEngine({ deferTaskIds: [SLOT_RELEASE_TASK_ID] })
    const { presenter } = renderApp(engine.port)
    await flush()
    await user.click(
      screen.getByRole('button', { name: /Fix flaky slot release test/ }),
    )
    expect(screen.getByRole('group', { name: 'Loading Task' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(screen.queryByText(/Running tests/)).toBeNull()

    engine.publishTask(SLOT_RELEASE_TASK_ID, taskLoadFor(SLOT_RELEASE_TASK_ID))
    await flush()
    expect(screen.queryByRole('group', { name: 'Loading Task' })).toBeNull()
    expect(presenter.getState().task.load.kind).toBe('ready')

    engine.publishTask(SLOT_RELEASE_TASK_ID, { kind: 'loading' })
    await flush()
    expect(screen.getByRole('group', { name: 'Loading Task' })).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Main' })
    await user.click(within(nav).getByRole('button', { name: /New task/ }))
    expect(presenter.getState().route).toBe('new-task')
    expect(screen.queryByRole('group', { name: 'Loading Task' })).toBeNull()
  })

  it('shows workflows loading then replaces it when the list arrives', async () => {
    const user = userEvent.setup()
    const engine = createTestEngine({ deferWorkflows: true })
    const { presenter } = renderApp(engine.port)
    await flush()
    await user.click(screen.getByRole('button', { name: 'Workflows' }))
    expect(screen.getByRole('group', { name: 'Loading Workflows' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(screen.queryByText('Release checklist')).toBeNull()
    engine.publishWorkflows({
      kind: 'ready',
      workflows: POPULATED_WORKFLOWS,
    })
    await flush()
    expect(screen.queryByRole('group', { name: 'Loading Workflows' })).toBeNull()
    expect(screen.getByText('Release checklist')).toBeInTheDocument()
    expect(presenter.getState().workflows.load.kind).toBe('ready')
  })

  it('announces the main screen loading label in the single live region', async () => {
    const user = userEvent.setup()
    const engine = createTestEngine({ deferWorkflows: true })
    renderApp(engine.port)
    await flush()
    const live = screen.getByRole('status')
    expect(live).toHaveTextContent('')
    await user.click(screen.getByRole('button', { name: 'Workflows' }))
    expect(live).toHaveTextContent('Loading workflows')
    expect(screen.getAllByRole('status')).toHaveLength(1)
    engine.publishWorkflows({ kind: 'ready', workflows: POPULATED_WORKFLOWS })
    await flush()
    expect(live).toHaveTextContent('')
  })

  it('announces a new first load even when an older submission outcome is retained', async () => {
    const user = userEvent.setup()
    const engine = createTestEngine({ deferWorkflows: true })
    renderApp(engine.port)
    await flush()
    await user.type(await screen.findByLabelText('Task prompt'), 'do it')
    await user.click(screen.getByRole('button', { name: 'Start task' }))
    await flush()
    expect(screen.getByRole('status')).toHaveTextContent(/Accepted mock task/)
    await user.click(screen.getByRole('button', { name: 'Workflows' }))
    expect(screen.getByRole('status')).toHaveTextContent('Loading workflows')
    engine.publishWorkflows({ kind: 'ready', workflows: POPULATED_WORKFLOWS })
    await flush()
    expect(screen.getByRole('status')).toHaveTextContent('')
  })

  it('announces a submission outcome that arrives while a screen is loading', async () => {
    const user = userEvent.setup()
    const engine = createTestEngine({ holdStart: true, deferWorkflows: true })
    renderApp(engine.port)
    await flush()
    await user.type(await screen.findByLabelText('Task prompt'), 'do it')
    await user.click(screen.getByRole('button', { name: 'Start task' }))
    await flush()
    await user.click(screen.getByRole('button', { name: 'Workflows' }))
    expect(screen.getByRole('status')).toHaveTextContent('Loading workflows')
    engine.resolveStart({ kind: 'accepted', taskId: asTaskId('late-ok') })
    await flush()
    expect(screen.getByRole('status')).toHaveTextContent(/Accepted mock task late-ok/)
  })

  it('shows workflow editor loading and clears after close mid-load', async () => {
    const user = userEvent.setup()
    const engine = createTestEngine({ deferWorkflowEditor: true })
    const { presenter } = renderApp(engine.port)
    await flush()
    await user.click(screen.getByRole('button', { name: 'Workflows' }))
    presenter.openWorkflowEditor(RELEASE_WORKFLOW_ID)
    await flush()
    expect(
      screen.getByRole('group', { name: 'Loading Workflow editor' }),
    ).toHaveAttribute('aria-busy', 'true')
    const nav = screen.getByRole('navigation', { name: 'Main' })
    await user.click(within(nav).getByRole('button', { name: /New task/ }))
    expect(screen.queryByRole('group', { name: 'Loading Workflow editor' })).toBeNull()
  })

  it('shows workflow run graph and parallel loading skeletons', async () => {
    const user = userEvent.setup()
    const engine = createTestEngine({ deferWorkflowExecution: true })
    const { presenter } = renderApp(engine.port)
    await flush()
    const runId = asWorkflowRunId('run-nightly-dependency-audit')
    presenter.navigate('workflows')
    presenter.openWorkflowExecution(runId)
    await flush()
    expect(screen.getByRole('group', { name: 'Loading Workflow run' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(screen.getByLabelText('Loading workflow graph')).toBeInTheDocument()
    presenter.setWorkflowRunViewMode('parallel')
    await flush()
    expect(screen.getByLabelText('Parallel lanes')).toBeInTheDocument()
    engine.publishWorkflowExecution(runId, workflowExecutionLoadFor(runId))
    await flush()
    expect(screen.queryByRole('group', { name: 'Loading Workflow run' })).toBeNull()
    await user.click(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('button', { name: /New task/ }))
    expect(presenter.getState().workflowExecution.runId).toBeNull()
  })

  it('falls back to Graph when a Parallel preference set while loading meets a run without lanes', async () => {
    const engine = createTestEngine({ deferWorkflowExecution: true })
    const { presenter } = renderApp(engine.port)
    await flush()
    const runId = asWorkflowRunId('run-nightly-dependency-audit')
    presenter.navigate('workflows')
    presenter.openWorkflowExecution(runId)
    presenter.setWorkflowRunViewMode('parallel')
    await flush()
    expect(screen.getByLabelText('Parallel lanes')).toBeInTheDocument()
    expect(presenter.getState().workflowExecution.viewMode).toBe('parallel')
    engine.publishWorkflowExecution(runId, {
      kind: 'ready',
      run: { ...nightlyAuditRun(), parallel: null },
    })
    await flush()
    expect(presenter.getState().workflowExecution.viewMode).toBe('graph')
    expect(screen.queryByLabelText('Parallel lanes')).toBeNull()
    expect(screen.getByRole('region', { name: 'Workflow graph' })).toBeInTheDocument()
  })

  it('shows parallel group loading then replaces on ready', async () => {
    const user = userEvent.setup()
    const engine = createTestEngine({
      deferParallelGroupIds: [PRELOAD_PARALLEL_GROUP_ID],
    })
    const { presenter } = renderApp(engine.port)
    await flush()
    await user.click(screen.getByRole('button', { name: /Review preload bridge/ }))
    expect(
      screen.getByRole('group', { name: 'Loading Parallel group' }),
    ).toHaveAttribute('aria-busy', 'true')
    engine.publishParallelGroup(
      PRELOAD_PARALLEL_GROUP_ID,
      parallelGroupLoadFor(PRELOAD_PARALLEL_GROUP_ID),
    )
    await flush()
    expect(screen.queryByRole('group', { name: 'Loading Parallel group' })).toBeNull()
    expect(presenter.getState().parallelGroup.load.kind).toBe('ready')
  })

  it('shows resources loading then replaces it when slots arrive', async () => {
    const user = userEvent.setup()
    const engine = createTestEngine({ deferResources: true })
    const { presenter } = renderApp(engine.port)
    await flush()
    await user.click(screen.getByRole('button', { name: 'Resources' }))
    expect(screen.getByRole('group', { name: 'Loading Resources' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    engine.publishResources(populatedResourcesLoad())
    await flush()
    expect(screen.queryByRole('group', { name: 'Loading Resources' })).toBeNull()
    expect(presenter.getState().resources.load.kind).toBe('ready')
    await user.click(
      within(screen.getByRole('navigation', { name: 'Main' })).getByRole(
        'button',
        { name: /New task/ },
      ),
    )
    expect(screen.queryByRole('group', { name: 'Loading Resources' })).toBeNull()
  })

  it('shows statistics loading while deferred, replaces on ready, clears after leave', async () => {
    const user = userEvent.setup()
    const engine = createTestEngine({ deferStatisticsRanges: ['30d'] })
    const { presenter } = renderApp(engine.port)
    await flush()
    await user.click(screen.getByRole('button', { name: 'Statistics' }))
    expect(screen.getByRole('group', { name: 'Loading Statistics' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    engine.publishStatistics('30d', statisticsLoadFor('30d'))
    await flush()
    expect(screen.queryByRole('group', { name: 'Loading Statistics' })).toBeNull()
    expect(presenter.getState().statistics.load.kind).toBe('ready')
    await user.click(
      within(screen.getByRole('navigation', { name: 'Main' })).getByRole(
        'button',
        { name: /New task/ },
      ),
    )
    expect(screen.queryByRole('group', { name: 'Loading Statistics' })).toBeNull()
  })

  it('shows settings general loading without remounting the theme control', async () => {
    const user = userEvent.setup()
    const engine = createTestEngine({ deferSettingsGeneral: true })
    const { presenter } = renderApp(engine.port)
    await flush()
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    const runtime = screen.getByRole('region', { name: 'Harflow runtime' })
    expect(runtime).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('tabpanel')).not.toHaveAttribute('aria-busy')
    expect(screen.getByRole('status')).toHaveTextContent('Loading settings')
    expect(screen.getByText('Behaviour')).toBeInTheDocument()
    const theme = within(screen.getByRole('main')).getByRole('group', {
      name: 'Theme',
    })
    engine.publishSettingsGeneral(populatedSettingsGeneralLoad())
    await flush()
    expect(screen.getByRole('region', { name: 'Harflow runtime' })).not.toHaveAttribute('aria-busy')
    expect(screen.getByRole('status')).toHaveTextContent('')
    expect(
      within(screen.getByRole('main')).getByRole('group', { name: 'Theme' }),
    ).toBe(theme)
    expect(screen.getByText('Harflow runtime 0.9.3 is ready')).toBeInTheDocument()
    expect(screen.getByText('Task store is compatible')).toBeInTheDocument()
    expect(presenter.getState().settingsGeneral.load.kind).toBe('ready')
  })

  it('keeps the expanded harness through loading and shows its approvals when ready', async () => {
    const user = userEvent.setup()
    const engine = createTestEngine({ deferHarnesses: true })
    const { presenter } = renderApp(engine.port)
    await flush()
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await user.click(screen.getByRole('tab', { name: 'Harnesses' }))
    const loading = screen.getByRole('group', { name: 'Loading Harnesses' })
    expect(loading).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByTestId('mcp-approvals-skeleton')).toBeNull()
    expect(screen.getByText('Harness qualification')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled()

    presenter.setExpandedHarness('claude-code')
    await flush()
    expect(
      screen.getByRole('group', { name: 'Loading MCP approvals' }),
    ).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByTestId('mcp-approvals-skeleton')).toBeInTheDocument()

    engine.publishHarnesses(populatedHarnessesLoad())
    await flush()
    expect(screen.queryByTestId('mcp-approvals-skeleton')).toBeNull()
    expect(presenter.getState().harnesses.expandedId).toBe('claude-code')
    expect(
      screen.getByRole('button', { name: 'MCP approvals for Claude Code' }),
    ).toHaveAttribute('aria-expanded', 'true')
    const region = screen.getByRole('region', {
      name: 'MCP approvals for Claude Code',
    })
    expect(within(region).getByText('harflow/*')).toBeInTheDocument()
    expect(within(region).getByText('linear/get_issue')).toBeInTheDocument()

    await user.click(
      within(screen.getByRole('navigation', { name: 'Main' })).getByRole(
        'button',
        { name: /New task/ },
      ),
    )
    expect(screen.queryByRole('group', { name: 'Loading Harnesses' })).toBeNull()
  })
})
