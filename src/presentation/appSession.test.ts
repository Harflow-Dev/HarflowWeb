import { describe, expect, it } from 'vitest'
import {
  createLoadContextUseCase,
  createLoadHarnessesUseCase,
  createLoadNeedsYouUseCase,
  createLoadResourcesUseCase,
  createLoadStatisticsUseCase,
  createLoadTaskChangesUseCase,
  createLoadTaskUseCase,
  createLoadWorkflowEditorUseCase,
  createLoadWorkflowRunUseCase,
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
  type WorkflowId,
  type WorkflowRunContext,
  type WorkflowRunContextLoad,
  type WorkflowSummary,
  type WorkflowsLoad,
  workflowPermissionFacts,
} from '../model'
import { createControllablePromise } from '../adapters/mock/controllable'
import { populatedComposer, populatedSidebar } from '../adapters/mock/fixtures'
import { populatedHarnessesLoad } from '../adapters/mock/harnessFixtures'
import { waitingNeedsYouLoad } from '../adapters/mock/needsYouFixtures'
import { workflowEditorLoadFor } from '../adapters/mock/workflowEditorFixtures'
import {
  NIGHTLY_WORKFLOW_ID,
  RELEASE_WORKFLOW_ID,
  workflowRunLoadFor,
} from '../adapters/mock/workflowRunFixtures'
import { populatedResourcesLoad } from '../adapters/mock/resourceFixtures'
import { statisticsLoadFor } from '../adapters/mock/statisticsFixtures'
import { taskChangesLoadFor } from '../adapters/mock/taskChangesFixtures'
import {
  PRELOAD_TASK_ID,
  SLOT_RELEASE_TASK_ID,
  taskLoadFor,
} from '../adapters/mock/taskFixtures'
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
  deferWorkflowRun?: boolean
}): {
  port: EnginePort
  starts: StartTaskRequest[]
  resolveStart: (outcome: StartTaskOutcome) => void
  publishWorkflows: (load: WorkflowsLoad) => void
  workflowListenerCount: () => number
  deliverWorkflowRun: (id: WorkflowId, load: WorkflowRunContextLoad) => void
  captureWorkflowRun: (
    id: WorkflowId,
  ) => ((load: WorkflowRunContextLoad) => void) | null
} {
  const starts: StartTaskRequest[] = []
  const contextListeners = new Set<(load: ContextLoad) => void>()
  const workflowListeners = new Set<(load: WorkflowsLoad) => void>()
  const runListeners = new Map<
    WorkflowId,
    (load: WorkflowRunContextLoad) => void
  >()
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
    observeWorkflowRun(workflowId, onUpdate) {
      runListeners.set(workflowId, onUpdate)
      if (!options?.deferWorkflowRun) {
        queueMicrotask(() => onUpdate(workflowRunLoadFor(workflowId)))
      }
      return {
        id: asObservationId('app-workflow-run'),
        cancel() {
          if (runListeners.get(workflowId) === onUpdate) {
            runListeners.delete(workflowId)
          }
        },
      }
    },
    observeWorkflowEditor(workflowId, onUpdate) {
      queueMicrotask(() => onUpdate(workflowEditorLoadFor(workflowId)))
      return {
        id: asObservationId('app-workflow-editor'),
        cancel() {
          /* editor lifetime is covered in its session tests */
        },
      }
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
    observeTask(taskId, onUpdate) {
      queueMicrotask(() => onUpdate(taskLoadFor(taskId)))
      return {
        id: asObservationId('app-task'),
        cancel() {
          /* no-op */
        },
      }
    },
    observeTaskChanges(query, onUpdate) {
      queueMicrotask(() => onUpdate(taskChangesLoadFor(query)))
      return {
        id: asObservationId('app-changes'),
        cancel() {
          /* no-op */
        },
      }
    },
    observeHarnesses(onUpdate) {
      queueMicrotask(() => onUpdate(populatedHarnessesLoad()))
      return {
        id: asObservationId('app-harnesses'),
        cancel() {
          /* no-op */
        },
      }
    },
    observeNeedsYou(onUpdate) {
      queueMicrotask(() => onUpdate(waitingNeedsYouLoad()))
      return {
        id: asObservationId('app-needs'),
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
    deliverWorkflowRun(id, load) {
      runListeners.get(id)?.(load)
    },
    captureWorkflowRun(id) {
      return runListeners.get(id) ?? null
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
    loadTask: createLoadTaskUseCase(engine),
    loadTaskChanges: createLoadTaskChangesUseCase(engine),
    loadHarnesses: createLoadHarnessesUseCase(engine),
    loadNeedsYou: createLoadNeedsYouUseCase(engine),
    loadWorkflowRun: createLoadWorkflowRunUseCase(engine),
    loadWorkflowEditor: createLoadWorkflowEditorUseCase(engine),
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
    const before = presenter.getState().workflows
    expect(presenter.getState().workflows).toEqual({
      load: before.load,
      runWorkflowId: null,
      drafts: {},
      runContext: { kind: 'loading' },
    })
    expect(starts).toHaveLength(0)
    presenter.navigate('workflows')
    expect(presenter.getState().workflows.load).toEqual(before.load)
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

  it('opens mapped tasks and preserves draft, range, and held launch', async () => {
    const { port, starts, resolveStart } = createTestEngine({ holdStart: true })
    const presenter = createPresenter(port)
    presenter.start()
    await flush()
    presenter.setPrompt('keep while reading task')
    presenter.setAppearance('dark')
    presenter.selectStatisticsRange('7d')
    await flush()
    presenter.submit()
    expect(presenter.getState().newTask.submission.kind).toBe('pending')

    presenter.openTask(SLOT_RELEASE_TASK_ID)
    await flush()
    expect(presenter.getState().route).toBe('task')
    expect(presenter.getState().task.selectedTaskId).toBe(SLOT_RELEASE_TASK_ID)
    const slotLoad = presenter.getState().task.load
    expect(slotLoad.kind).toBe('ready')
    if (slotLoad.kind === 'ready') {
      expect(slotLoad.observation.title).toBe('Fix flaky slot release test')
    }
    expect(presenter.getState().newTask.prompt).toBe('keep while reading task')
    expect(presenter.getState().statistics.selectedRange).toBe('7d')
    expect(presenter.getState().newTask.appearance).toBe('dark')
    expect(starts).toHaveLength(1)

    presenter.openTask(PRELOAD_TASK_ID)
    await flush()
    expect(presenter.getState().task.selectedTaskId).toBe(PRELOAD_TASK_ID)
    const preloadLoad = presenter.getState().task.load
    expect(preloadLoad.kind).toBe('ready')
    if (preloadLoad.kind === 'ready') {
      expect(preloadLoad.observation.title).toBe('Review preload bridge')
    }

    presenter.navigate('statistics')
    expect(presenter.getState().statistics.selectedRange).toBe('7d')
    resolveStart({ kind: 'accepted', taskId: asTaskId('held-ok') })
    await flush()
    presenter.navigate('new-task')
    expect(presenter.getState().newTask.submission).toEqual({
      kind: 'accepted',
      taskId: asTaskId('held-ok'),
    })
    expect(starts).toHaveLength(1)
    presenter.dispose()
  })

  it('keeps both run drafts when the current callback receives another definition', async () => {
    const engine = createTestEngine()
    const presenter = createPresenter(engine.port)
    presenter.start()
    await flush()
    presenter.openWorkflowRun(RELEASE_WORKFLOW_ID)
    await flush()
    presenter.setWorkflowRunTask('  alpha  ')
    presenter.setWorkflowRunGoal('keep goal')
    presenter.selectWorkflowRunRepository(asRepositoryId('repo-mac'))
    presenter.openWorkflowRun(NIGHTLY_WORKFLOW_ID)
    await flush()
    presenter.setWorkflowRunTask('beta')
    presenter.setWorkflowRunGoal('nightly goal')
    const releaseDraft = {
      ...presenter.getState().workflows.drafts[RELEASE_WORKFLOW_ID],
    }
    const nightlyDraft = {
      ...presenter.getState().workflows.drafts[NIGHTLY_WORKFLOW_ID],
    }
    const context = presenter.getState().workflows.runContext
    engine.deliverWorkflowRun(
      NIGHTLY_WORKFLOW_ID,
      workflowRunLoadFor(RELEASE_WORKFLOW_ID),
    )
    expect(presenter.getState().workflows.drafts[RELEASE_WORKFLOW_ID]).toEqual(
      releaseDraft,
    )
    expect(presenter.getState().workflows.drafts[NIGHTLY_WORKFLOW_ID]).toEqual(
      nightlyDraft,
    )
    expect(presenter.getState().workflows.runContext).toEqual(context)
    expect(presenter.getState().workflows.runWorkflowId).toBe(NIGHTLY_WORKFLOW_ID)
    expect(engine.starts).toHaveLength(0)
    presenter.dispose()
  })

  it('reloads a ready run after restart without the disposed callback', async () => {
    const engine = createTestEngine({ deferWorkflowRun: true })
    const presenter = createPresenter(engine.port)
    presenter.start()
    await flush()
    presenter.openWorkflowRun(RELEASE_WORKFLOW_ID)
    engine.deliverWorkflowRun(
      RELEASE_WORKFLOW_ID,
      workflowRunLoadFor(RELEASE_WORKFLOW_ID),
    )
    presenter.setWorkflowRunTask('  alpha  ')
    presenter.setWorkflowRunGoal('keep goal')
    const draft = {
      ...presenter.getState().workflows.drafts[RELEASE_WORKFLOW_ID],
    }
    const stale = engine.captureWorkflowRun(RELEASE_WORKFLOW_ID)
    presenter.dispose()
    stale?.(workflowRunLoadFor(NIGHTLY_WORKFLOW_ID))
    expect(presenter.getState().workflows.drafts[RELEASE_WORKFLOW_ID]).toEqual(draft)
    presenter.start()
    expect(presenter.getState().workflows.runContext.kind).toBe('loading')
    expect(presenter.getState().workflows.drafts[RELEASE_WORKFLOW_ID]).toEqual(draft)
    stale?.(workflowRunLoadFor(RELEASE_WORKFLOW_ID))
    expect(presenter.getState().workflows.runContext.kind).toBe('loading')
    expect(presenter.getState().workflows.drafts[RELEASE_WORKFLOW_ID]).toEqual(draft)
    engine.deliverWorkflowRun(
      RELEASE_WORKFLOW_ID,
      workflowRunLoadFor(RELEASE_WORKFLOW_ID),
    )
    expect(presenter.getState().workflows.runContext.kind).toBe('ready')
    expect(presenter.getState().workflows.drafts[RELEASE_WORKFLOW_ID]).toEqual(draft)
    expect(engine.starts).toHaveLength(0)
    presenter.dispose()
  })

  it('reloads a pending run after restart without the disposed callback', async () => {
    const engine = createTestEngine({ deferWorkflowRun: true })
    const presenter = createPresenter(engine.port)
    presenter.start()
    await flush()
    presenter.openWorkflowRun(RELEASE_WORKFLOW_ID)
    presenter.setWorkflowRunTask('  alpha  ')
    presenter.setWorkflowRunGoal('keep goal')
    const draft = {
      ...presenter.getState().workflows.drafts[RELEASE_WORKFLOW_ID],
    }
    expect(presenter.getState().workflows.runContext.kind).toBe('loading')
    const stale = engine.captureWorkflowRun(RELEASE_WORKFLOW_ID)
    presenter.dispose()
    presenter.start()
    expect(presenter.getState().workflows.runContext.kind).toBe('loading')
    expect(presenter.getState().workflows.drafts[RELEASE_WORKFLOW_ID]).toEqual(draft)
    stale?.(workflowRunLoadFor(RELEASE_WORKFLOW_ID))
    expect(presenter.getState().workflows.runContext.kind).toBe('loading')
    engine.deliverWorkflowRun(
      RELEASE_WORKFLOW_ID,
      workflowRunLoadFor(NIGHTLY_WORKFLOW_ID),
    )
    expect(presenter.getState().workflows.runContext.kind).toBe('loading')
    expect(presenter.getState().workflows.drafts[RELEASE_WORKFLOW_ID]).toEqual(draft)
    engine.deliverWorkflowRun(
      RELEASE_WORKFLOW_ID,
      workflowRunLoadFor(RELEASE_WORKFLOW_ID),
    )
    expect(presenter.getState().workflows.runContext.kind).toBe('ready')
    expect(presenter.getState().workflows.drafts[RELEASE_WORKFLOW_ID]).toEqual({
      ...draft,
      seeded: true,
    })
    expect(engine.starts).toHaveLength(0)
    presenter.dispose()
  })

  it('keeps an invalid repository or override and hides its permission facts', async () => {
    const engine = createTestEngine()
    const presenter = createPresenter(engine.port)
    presenter.start()
    await flush()
    presenter.openWorkflowRun(RELEASE_WORKFLOW_ID)
    await flush()
    presenter.setWorkflowRunTask('  alpha  ')
    presenter.setWorkflowRunGoal('keep goal')
    presenter.selectWorkflowRunRepository(asRepositoryId('repo-mac'))
    const ready = workflowRunLoadFor(RELEASE_WORKFLOW_ID)
    if (ready.kind !== 'ready') throw new Error('release fixture')
    const mac = asRepositoryId('repo-mac')
    engine.deliverWorkflowRun(RELEASE_WORKFLOW_ID, {
      kind: 'ready',
      context: {
        ...ready.context,
        repositories: ready.context.repositories.filter((item) => item.id !== mac),
      },
    })
    const removed = presenter.getState().workflows.drafts[RELEASE_WORKFLOW_ID]
    const removedContext = presenter.getState().workflows.runContext
    expect(removed?.task).toBe('  alpha  ')
    expect(removed?.goal).toBe('keep goal')
    expect(removed?.repositoryId).toBe(mac)
    expect(removed?.overrideId).toBe('saved')
    expect(removedContext.kind).toBe('ready')
    if (removedContext.kind === 'ready' && removed) {
      expect(
        removedContext.context.permissions.some(
          (item) => item.repositoryId === mac && item.overrideId === 'saved',
        ),
      ).toBe(true)
      expect(
        workflowPermissionFacts(
          removedContext.context,
          removed.repositoryId,
          removed.overrideId,
        ),
      ).toBeNull()
    }
    const disabled: WorkflowRunContext = {
      ...ready.context,
      overrides: ready.context.overrides.map((item) =>
        item.id === 'saved' ? { ...item, available: false } : item,
      ),
    }
    engine.deliverWorkflowRun(RELEASE_WORKFLOW_ID, {
      kind: 'ready',
      context: disabled,
    })
    const next = presenter.getState().workflows.drafts[RELEASE_WORKFLOW_ID]
    const nextContext = presenter.getState().workflows.runContext
    expect(next?.task).toBe('  alpha  ')
    expect(next?.goal).toBe('keep goal')
    expect(next?.repositoryId).toBe(mac)
    expect(next?.overrideId).toBe('saved')
    expect(nextContext.kind).toBe('ready')
    if (nextContext.kind === 'ready' && next) {
      expect(
        nextContext.context.permissions.some(
          (item) => item.repositoryId === mac && item.overrideId === 'saved',
        ),
      ).toBe(true)
      expect(
        workflowPermissionFacts(
          nextContext.context,
          next.repositoryId,
          next.overrideId,
        ),
      ).toBeNull()
    }
    expect(engine.starts).toHaveLength(0)
    presenter.dispose()
  })
})
