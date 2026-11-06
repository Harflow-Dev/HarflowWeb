import { describe, expect, it } from 'vitest'
import {
  createLoadContextUseCase,
  createStartTaskUseCase,
  type EnginePort,
} from '../application'
import {
  asHarnessId,
  asModelId,
  asObservationId,
  asRepositoryId,
  asTaskId,
  type ContextLoad,
  type ObservationHandle,
  type StartTaskOutcome,
  type StartTaskRequest,
  type WorkflowsLoad,
} from '../model'
import { createControllablePromise } from '../adapters/mock/controllable'
import {
  emptySidebar,
  MOCK_ACCESS,
  MOCK_HARNESSES,
  MOCK_REPOSITORIES,
  populatedComposer,
  populatedSidebar,
} from '../adapters/mock/fixtures'
import type { ComposerContext } from '../model'
import { createNewTaskPresenter } from './presenter'

function readyContext(): ContextLoad {
  return {
    kind: 'ready',
    composer: populatedComposer(),
    sidebar: populatedSidebar(),
  }
}

function readyWith(
  composer: ComposerContext,
  sidebar = populatedSidebar(),
): ContextLoad {
  return { kind: 'ready', composer, sidebar }
}

function createTestEngine(options?: {
  holdStart?: boolean
  outcome?: StartTaskOutcome
}): {
  port: EnginePort
  starts: StartTaskRequest[]
  resolveStart: (outcome: StartTaskOutcome) => void
  publish: (load: ContextLoad) => void
} {
  const starts: StartTaskRequest[] = []
  const listeners = new Set<(load: ContextLoad) => void>()
  let held = createControllablePromise<StartTaskOutcome>()
  const port: EnginePort = {
    observeContext(onUpdate) {
      listeners.add(onUpdate)
      queueMicrotask(() => onUpdate(readyContext()))
      const handle: ObservationHandle = {
        id: asObservationId('test-obs'),
        cancel() {
          listeners.delete(onUpdate)
        },
      }
      return handle
    },
    observeWorkflows(onUpdate) {
      queueMicrotask(() =>
        onUpdate({ kind: 'ready', workflows: [] } satisfies WorkflowsLoad),
      )
      return {
        id: asObservationId('test-wf-obs'),
        cancel() {
          /* no-op for new-task unit tests */
        },
      }
    },
    observeResources(onUpdate) {
      queueMicrotask(() =>
        onUpdate({
          kind: 'unavailable',
          message: 'unused in new-task tests',
        }),
      )
      return {
        id: asObservationId('test-res-obs'),
        cancel() {
          /* no-op */
        },
      }
    },
    observeStatistics(_range, onUpdate) {
      queueMicrotask(() =>
        onUpdate({
          kind: 'unavailable',
          message: 'unused in new-task tests',
        }),
      )
      return {
        id: asObservationId('test-stats-obs'),
        cancel() {
          /* no-op */
        },
      }
    },
    observeTask(_taskId, onUpdate) {
      queueMicrotask(() =>
        onUpdate({
          kind: 'unavailable',
          message: 'unused in new-task tests',
        }),
      )
      return {
        id: asObservationId('test-task-obs'),
        cancel() {
          /* no-op */
        },
      }
    },
    observeTaskChanges(_query, onUpdate) {
      queueMicrotask(() =>
        onUpdate({
          kind: 'unavailable',
          message: 'unused in new-task tests',
        }),
      )
      return {
        id: asObservationId('test-changes-obs'),
        cancel() {
          /* no-op */
        },
      }
    },
    observeHarnesses(onUpdate) {
      queueMicrotask(() =>
        onUpdate({
          kind: 'unavailable',
          message: 'unused in new-task tests',
        }),
      )
      return {
        id: asObservationId('test-harnesses-obs'),
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
      return (
        options?.outcome ?? {
          kind: 'accepted',
          taskId: asTaskId('task-1'),
        }
      )
    },
  }
  return {
    port,
    starts,
    resolveStart(outcome) {
      held.resolve(outcome)
    },
    publish(load) {
      for (const listener of listeners) listener(load)
    },
  }
}

function createPresenter(engine: EnginePort) {
  return createNewTaskPresenter({
    loadContext: createLoadContextUseCase(engine),
    startTask: createStartTaskUseCase(engine),
  })
}

async function flush(): Promise<void> {
  // Cover queueMicrotask context emit + async startTask → then chains.
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

describe('NewTaskPresenter', () => {
  it('blocks empty and whitespace-only prompts', async () => {
    const { port, starts } = createTestEngine()
    const presenter = createPresenter(port)
    presenter.start()
    await flush()
    presenter.setPrompt('   ')
    presenter.submit()
    expect(starts).toHaveLength(0)
    expect(presenter.getState().canSubmit).toBe(false)
    presenter.dispose()
  })

  it('preserves exact multiline Unicode prompt on submission', async () => {
    const { port, starts } = createTestEngine()
    const presenter = createPresenter(port)
    presenter.start()
    await flush()
    const prompt = 'Line one\nLine two 日本語 🎵'
    presenter.setPrompt(prompt)
    presenter.submit()
    await flush()
    expect(starts).toHaveLength(1)
    expect(starts[0]?.prompt).toBe(prompt)
    presenter.dispose()
  })

  it('accepts a start, clears the prompt, and blocks duplicate while pending', async () => {
    const { port, starts, resolveStart } = createTestEngine({ holdStart: true })
    const presenter = createPresenter(port)
    presenter.start()
    await flush()
    presenter.setPrompt('Do the thing')
    presenter.submit()
    presenter.submit()
    expect(starts).toHaveLength(1)
    expect(presenter.getState().submission.kind).toBe('pending')
    resolveStart({ kind: 'accepted', taskId: asTaskId('t') })
    await flush()
    expect(presenter.getState().submission).toEqual({
      kind: 'accepted',
      taskId: asTaskId('t'),
    })
    expect(presenter.getState().prompt).toBe('')
    presenter.dispose()
  })

  it('preserves draft on refused and unknown; never auto-retries unknown', async () => {
    const refused = createTestEngine({
      outcome: {
        kind: 'refused',
        code: 'invalid_params',
        reason: 'fixture refusal',
      },
    })
    const p1 = createPresenter(refused.port)
    p1.start()
    await flush()
    p1.setPrompt('Keep me')
    p1.submit()
    await flush()
    expect(p1.getState().prompt).toBe('Keep me')
    expect(p1.getState().submission).toEqual({
      kind: 'refused',
      code: 'invalid_params',
      reason: 'fixture refusal',
    })
    p1.dispose()

    const unknown = createTestEngine({
      outcome: {
        kind: 'unknown',
        message: 'fixture: owner did not report; a task may exist',
      },
    })
    const p2 = createPresenter(unknown.port)
    p2.start()
    await flush()
    p2.setPrompt('Keep unknown')
    p2.submit()
    await flush()
    expect(p2.getState().prompt).toBe('Keep unknown')
    expect(p2.getState().submission.kind).toBe('unknown')
    expect(unknown.starts).toHaveLength(1)
    p2.dispose()
  })

  it('rejects stale responses after disposal', async () => {
    const { port, resolveStart } = createTestEngine({ holdStart: true })
    const presenter = createPresenter(port)
    presenter.start()
    await flush()
    presenter.setPrompt('first')
    presenter.submit()
    presenter.dispose()
    resolveStart({ kind: 'accepted', taskId: asTaskId('late') })
    await flush()
    // Disposed presenter must not apply the late accept.
    expect(presenter.getState().submission.kind).toBe('pending')
  })

  it('gates harness and access selections by fixture capabilities', async () => {
    const { port } = createTestEngine()
    const presenter = createPresenter(port)
    presenter.start()
    await flush()
    presenter.selectHarness(asHarnessId('antigravity'))
    expect(presenter.getState().selectedHarnessId).toBe(asHarnessId('claude'))
    presenter.selectAccess('full')
    expect(presenter.getState().selectedAccess).toBe('edit_repo')
    presenter.selectHarness(asHarnessId('opencode'))
    expect(presenter.getState().selectedHarnessId).toBe(asHarnessId('opencode'))
    expect(presenter.getState().selectedModelId).toBe(asModelId('claude-sonnet-5'))
    presenter.dispose()
  })

  it('toggles sidebar collapse and appearance', async () => {
    const { port } = createTestEngine()
    const presenter = createPresenter(port)
    presenter.start()
    await flush()
    presenter.setSidebarCollapsed(true)
    expect(presenter.getState().sidebarCollapsed).toBe(true)
    presenter.setAppearance('dark')
    expect(presenter.getState().appearance).toBe('dark')
    presenter.cycleAppearance()
    expect(presenter.getState().appearance).toBe('system')
    presenter.dispose()
  })

  it('does not imply repository ids are filesystem paths', async () => {
    const { port, starts } = createTestEngine()
    const presenter = createPresenter(port)
    presenter.start()
    await flush()
    presenter.setPrompt('x')
    presenter.selectRepository(asRepositoryId('repo-mac'))
    presenter.submit()
    await flush()
    expect(starts[0]?.repositoryId).toBe(asRepositoryId('repo-mac'))
    expect(String(starts[0]?.repositoryId).includes('/')).toBe(false)
    presenter.dispose()
  })

  it('keeps applying context updates after a resolved submission', async () => {
    const { port, publish } = createTestEngine()
    const presenter = createPresenter(port)
    presenter.start()
    await flush()
    expect(presenter.getState().context.kind).toBe('ready')
    presenter.setPrompt('ship it')
    presenter.submit()
    await flush()
    expect(presenter.getState().submission.kind).toBe('accepted')

    publish({
      kind: 'unavailable',
      message: 'Mock engine context is unavailable.',
    })
    expect(presenter.getState().context).toEqual({
      kind: 'unavailable',
      message: 'Mock engine context is unavailable.',
    })
    expect(presenter.getState().canSubmit).toBe(false)
    presenter.dispose()
  })

  it('applies context updates while a submission is still pending', async () => {
    const { port, publish, resolveStart } = createTestEngine({ holdStart: true })
    const presenter = createPresenter(port)
    presenter.start()
    await flush()
    presenter.setPrompt('held')
    presenter.submit()
    expect(presenter.getState().submission.kind).toBe('pending')

    publish({
      kind: 'unavailable',
      message: 'Context dropped while starting.',
    })
    expect(presenter.getState().context.kind).toBe('unavailable')
    expect(presenter.getState().canSubmit).toBe(false)
    expect(presenter.getState().submission.kind).toBe('pending')

    resolveStart({ kind: 'accepted', taskId: asTaskId('after-context') })
    await flush()
    expect(presenter.getState().submission).toEqual({
      kind: 'accepted',
      taskId: asTaskId('after-context'),
    })
    presenter.dispose()
  })

  it('preserves user selections across a sidebar-only ready refresh', async () => {
    const { port, publish, starts } = createTestEngine()
    const presenter = createPresenter(port)
    presenter.start()
    await flush()

    presenter.selectRepository(asRepositoryId('repo-mac'))
    presenter.selectHarness(asHarnessId('codex'))
    presenter.selectModel(asModelId('gpt-6-astra'))
    presenter.selectAccess('publish')
    expect(presenter.getState().selectedRepositoryId).toBe(asRepositoryId('repo-mac'))
    expect(presenter.getState().selectedHarnessId).toBe(asHarnessId('codex'))
    expect(presenter.getState().selectedModelId).toBe(asModelId('gpt-6-astra'))
    expect(presenter.getState().selectedAccess).toBe('publish')

    const composer = populatedComposer()
    publish(
      readyWith(composer, {
        ...emptySidebar(),
        needsYouCount: 2,
      }),
    )

    expect(presenter.getState().selectedRepositoryId).toBe(asRepositoryId('repo-mac'))
    expect(presenter.getState().selectedHarnessId).toBe(asHarnessId('codex'))
    expect(presenter.getState().selectedModelId).toBe(asModelId('gpt-6-astra'))
    expect(presenter.getState().selectedAccess).toBe('publish')
    const afterRefresh = presenter.getState().context
    expect(afterRefresh.kind).toBe('ready')
    if (afterRefresh.kind !== 'ready') {
      throw new Error('expected ready context after sidebar refresh')
    }
    expect(afterRefresh.sidebar.needsYouCount).toBe(2)

    presenter.setPrompt('use preserved targets')
    presenter.submit()
    await flush()
    expect(starts).toHaveLength(1)
    expect(starts[0]).toEqual({
      prompt: 'use preserved targets',
      repositoryId: asRepositoryId('repo-mac'),
      harnessId: asHarnessId('codex'),
      modelId: asModelId('gpt-6-astra'),
      access: 'publish',
    })
    presenter.dispose()
  })

  it('reconciles removed or unavailable choices deterministically', async () => {
    const { port, publish } = createTestEngine()
    const presenter = createPresenter(port)
    presenter.start()
    await flush()

    presenter.selectRepository(asRepositoryId('repo-design'))
    presenter.selectHarness(asHarnessId('codex'))
    presenter.selectAccess('publish')

    const narrowed: ComposerContext = {
      repositories: MOCK_REPOSITORIES.filter((r) => r.id !== asRepositoryId('repo-design')),
      harnesses: MOCK_HARNESSES.map((h) =>
        h.id === asHarnessId('codex')
          ? { ...h, available: false, unavailableReason: 'Not installed' }
          : h,
      ),
      accessOptions: MOCK_ACCESS,
      selectedRepositoryId: asRepositoryId('repo-mcp'),
      selectedHarnessId: asHarnessId('claude'),
      selectedModelId: asModelId('opus-5.5'),
      selectedAccess: 'edit_repo',
    }
    publish(readyWith(narrowed))

    expect(presenter.getState().selectedRepositoryId).toBe(asRepositoryId('repo-mcp'))
    expect(presenter.getState().selectedHarnessId).toBe(asHarnessId('claude'))
    expect(presenter.getState().selectedModelId).toBe(asModelId('opus-5.5'))
    // publish remains valid on the fallback Claude harness.
    expect(presenter.getState().selectedAccess).toBe('publish')
    presenter.dispose()
  })

  it('keeps model and access compatible when the harness list changes', async () => {
    const { port, publish } = createTestEngine()
    const presenter = createPresenter(port)
    presenter.start()
    await flush()

    presenter.selectHarness(asHarnessId('claude'))
    presenter.selectModel(asModelId('haiku-5'))
    presenter.selectAccess('publish')

    const opencodeOnly: ComposerContext = {
      repositories: MOCK_REPOSITORIES,
      harnesses: MOCK_HARNESSES.filter((h) => h.id === asHarnessId('opencode')),
      accessOptions: MOCK_ACCESS,
      selectedRepositoryId: asRepositoryId('repo-mcp'),
      selectedHarnessId: asHarnessId('opencode'),
      selectedModelId: asModelId('claude-sonnet-5'),
      selectedAccess: 'edit_repo',
    }
    publish(readyWith(opencodeOnly))

    expect(presenter.getState().selectedHarnessId).toBe(asHarnessId('opencode'))
    expect(presenter.getState().selectedModelId).toBe(asModelId('claude-sonnet-5'))
    // publish is not admitted by opencode; fall back to adapter default edit_repo.
    expect(presenter.getState().selectedAccess).toBe('edit_repo')
    presenter.setPrompt('compatible')
    expect(presenter.getState().canSubmit).toBe(true)
    presenter.dispose()
  })
})
