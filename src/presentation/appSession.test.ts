import { describe, expect, it } from 'vitest'
import {
  createLoadContextUseCase,
  createLoadResourcesUseCase,
  createLoadStatisticsUseCase,
  createLoadWorkflowsUseCase,
  createStartTaskUseCase,
  type EnginePort,
} from '../application'
import {
  asHarnessId,
  asModelId,
  asObservationId,
  asRepositoryId,
  asTaskId,
  asWorkflowId,
  type ContextLoad,
  type ObservationHandle,
  type ResourcesLoad,
  type StartTaskOutcome,
  type StartTaskRequest,
  type WorkflowSummary,
  type WorkflowsLoad,
} from '../model'
import { createControllablePromise } from '../adapters/mock/controllable'
import { populatedComposer, populatedSidebar } from '../adapters/mock/fixtures'
import { populatedResourcesLoad } from '../adapters/mock/resourceFixtures'
import { statisticsLoadFor } from '../adapters/mock/statisticsFixtures'
import { POPULATED_WORKFLOWS } from '../adapters/mock/workflowFixtures'
import { createAppPresenter } from './appPresenter'

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
}): {
  port: EnginePort
  starts: StartTaskRequest[]
  resolveStart: (outcome: StartTaskOutcome) => void
  publishWorkflows: (load: WorkflowsLoad) => void
  workflowListenerCount: () => number
} {
  const starts: StartTaskRequest[] = []
  const contextListeners = new Set<(load: ContextLoad) => void>()
  const workflowListeners = new Set<(load: WorkflowsLoad) => void>()
  let held = createControllablePromise<StartTaskOutcome>()
  const initialWorkflows: WorkflowsLoad = options?.workflows ?? {
    kind: 'ready',
    workflows: POPULATED_WORKFLOWS,
  }
  const initialResources: ResourcesLoad = populatedResourcesLoad()

  const port: EnginePort = {
    observeContext(onUpdate) {
      contextListeners.add(onUpdate)
      queueMicrotask(() => onUpdate(readyContext()))
      const handle: ObservationHandle = {
        id: asObservationId('app-ctx'),
        cancel() {
          contextListeners.delete(onUpdate)
        },
      }
      return handle
    },
    observeWorkflows(onUpdate) {
      workflowListeners.add(onUpdate)
      queueMicrotask(() => onUpdate(initialWorkflows))
      const handle: ObservationHandle = {
        id: asObservationId('app-wf'),
        cancel() {
          workflowListeners.delete(onUpdate)
        },
      }
      return handle
    },
    observeResources(onUpdate) {
      queueMicrotask(() => onUpdate(initialResources))
      return {
        id: asObservationId('app-res'),
        cancel() {
          /* no-op */
        },
      }
    },
    observeStatistics(range, onUpdate) {
      queueMicrotask(() => onUpdate(statisticsLoadFor(range)))
      return {
        id: asObservationId('app-stats'),
        cancel() {
          /* no-op */
        },
      }
    },
    async startTask(request) {
      starts.push(request)
      if (options?.holdStart) {
        held = createControllablePromise<StartTaskOutcome>()
        return held.promise
      }
      return { kind: 'accepted', taskId: asTaskId('task-1') }
    },
  }

  return {
    port,
    starts,
    resolveStart(outcome) {
      held.resolve(outcome)
    },
    publishWorkflows(load) {
      for (const listener of workflowListeners) listener(load)
    },
    workflowListenerCount() {
      return workflowListeners.size
    },
  }
}

function createPresenter(engine: EnginePort) {
  return createAppPresenter({
    loadContext: createLoadContextUseCase(engine),
    startTask: createStartTaskUseCase(engine),
    loadWorkflows: createLoadWorkflowsUseCase(engine),
    loadResources: createLoadResourcesUseCase(engine),
    loadStatistics: createLoadStatisticsUseCase(engine),
  })
}

async function flush(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

describe('AppPresenter workflows slice', () => {
  it('loads populated and empty workflow lists', async () => {
    const populated = createTestEngine({
      workflows: { kind: 'ready', workflows: POPULATED_WORKFLOWS },
    })
    const p1 = createPresenter(populated.port)
    p1.start()
    await flush()
    expect(p1.getState().workflows.load).toEqual({
      kind: 'ready',
      workflows: POPULATED_WORKFLOWS,
    })
    p1.dispose()

    const empty = createTestEngine({
      workflows: { kind: 'ready', workflows: [] },
    })
    const p2 = createPresenter(empty.port)
    p2.start()
    await flush()
    expect(p2.getState().workflows.load).toEqual({
      kind: 'ready',
      workflows: [],
    })
    p2.dispose()
  })

  it('preserves draft, selections, appearance, and sidebar across navigation', async () => {
    const { port } = createTestEngine()
    const presenter = createPresenter(port)
    presenter.start()
    await flush()

    presenter.setPrompt('keep this draft')
    presenter.selectRepository(asRepositoryId('repo-mac'))
    presenter.selectHarness(asHarnessId('codex'))
    presenter.selectModel(asModelId('gpt-6-astra'))
    presenter.selectAccess('publish')
    presenter.setAppearance('dark')
    presenter.setSidebarCollapsed(true)

    presenter.navigate('workflows')
    expect(presenter.getState().route).toBe('workflows')
    expect(presenter.getState().newTask.prompt).toBe('keep this draft')
    expect(presenter.getState().newTask.selectedRepositoryId).toBe(
      asRepositoryId('repo-mac'),
    )
    expect(presenter.getState().newTask.selectedHarnessId).toBe(
      asHarnessId('codex'),
    )
    expect(presenter.getState().newTask.selectedModelId).toBe(
      asModelId('gpt-6-astra'),
    )
    expect(presenter.getState().newTask.selectedAccess).toBe('publish')
    expect(presenter.getState().newTask.appearance).toBe('dark')
    expect(presenter.getState().newTask.sidebarCollapsed).toBe(true)

    presenter.navigate('new-task')
    expect(presenter.getState().route).toBe('new-task')
    expect(presenter.getState().newTask.prompt).toBe('keep this draft')
    expect(presenter.getState().newTask.appearance).toBe('dark')
    expect(presenter.getState().newTask.sidebarCollapsed).toBe(true)
    presenter.dispose()
  })

  it('keeps a held submission and shows the outcome after returning', async () => {
    const { port, starts, resolveStart } = createTestEngine({ holdStart: true })
    const presenter = createPresenter(port)
    presenter.start()
    await flush()
    presenter.setPrompt('inflight')
    presenter.submit()
    expect(presenter.getState().newTask.submission.kind).toBe('pending')
    expect(starts).toHaveLength(1)

    presenter.navigate('workflows')
    expect(presenter.getState().newTask.submission.kind).toBe('pending')

    resolveStart({ kind: 'accepted', taskId: asTaskId('survived') })
    await flush()
    expect(presenter.getState().route).toBe('workflows')
    expect(presenter.getState().newTask.submission).toEqual({
      kind: 'accepted',
      taskId: asTaskId('survived'),
    })
    expect(presenter.getState().newTask.prompt).toBe('')

    presenter.navigate('new-task')
    expect(presenter.getState().newTask.submission).toEqual({
      kind: 'accepted',
      taskId: asTaskId('survived'),
    })
    expect(starts).toHaveLength(1)
    presenter.dispose()
  })

  it('ignores stale workflow observations after dispose', async () => {
    const { port, publishWorkflows, workflowListenerCount } = createTestEngine()
    const presenter = createPresenter(port)
    presenter.start()
    await flush()
    expect(workflowListenerCount()).toBe(1)

    presenter.dispose()
    expect(workflowListenerCount()).toBe(0)

    const late: WorkflowSummary = {
      id: asWorkflowId('wf-late'),
      title: 'Should not appear',
      description: 'stale',
      nodeCount: 1,
    }
    publishWorkflows({ kind: 'ready', workflows: [late] })
    expect(presenter.getState().workflows.load).toEqual({
      kind: 'ready',
      workflows: POPULATED_WORKFLOWS,
    })
  })

  it('unavailable workflow actions do not mutate lists or launch tasks', async () => {
    const { port, starts } = createTestEngine()
    const presenter = createPresenter(port)
    presenter.start()
    await flush()
    const before = presenter.getState().workflows.load
    // UI calls onUnavailable only; presenter has no run/edit/create methods.
    expect(presenter.getState().workflows).toEqual({ load: before })
    expect(starts).toHaveLength(0)
    presenter.navigate('workflows')
    expect(presenter.getState().workflows.load).toEqual(before)
    expect(starts).toHaveLength(0)
    presenter.dispose()
  })

  it('navigates across pages and preserves held launch plus statistics range', async () => {
    const { port, starts, resolveStart } = createTestEngine({ holdStart: true })
    const presenter = createPresenter(port)
    presenter.start()
    await flush()
    presenter.setPrompt('across pages')
    presenter.submit()
    expect(presenter.getState().newTask.submission.kind).toBe('pending')

    presenter.navigate('workflows')
    presenter.navigate('resources')
    presenter.navigate('statistics')
    expect(presenter.getState().route).toBe('statistics')
    expect(presenter.getState().statistics.load.kind).toBe('ready')
    presenter.selectStatisticsRange('7d')
    await flush()
    expect(presenter.getState().statistics.selectedRange).toBe('7d')
    expect(presenter.getState().newTask.submission.kind).toBe('pending')
    expect(presenter.getState().newTask.prompt).toBe('across pages')

    presenter.navigate('workflows')
    expect(presenter.getState().statistics.selectedRange).toBe('7d')

    resolveStart({ kind: 'accepted', taskId: asTaskId('kept') })
    await flush()
    presenter.navigate('new-task')
    expect(presenter.getState().newTask.submission).toEqual({
      kind: 'accepted',
      taskId: asTaskId('kept'),
    })
    expect(starts).toHaveLength(1)
    presenter.dispose()
  })
})
