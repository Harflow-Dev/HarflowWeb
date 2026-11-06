import { describe, expect, it } from 'vitest'
import {
  createLoadResourcesUseCase,
  type EnginePort,
} from '../application'
import {
  asObservationId,
  asTaskId,
  type ObservationHandle,
  type ResourcesLoad,
  type StartTaskRequest,
} from '../model'
import { populatedResourcesLoad } from '../adapters/mock/resourceFixtures'
import { ResourcesSession } from './resourcesSession'

function createCapturingPort(initial: ResourcesLoad = populatedResourcesLoad()): {
  port: EnginePort
  capture: () => ((load: ResourcesLoad) => void) | null
  cancelCount: () => number
} {
  let latest: ((load: ResourcesLoad) => void) | null = null
  let cancels = 0
  const port: EnginePort = {
    observeContext() {
      return noopHandle('ctx')
    },
    observeWorkflows() {
      return noopHandle('wf')
    },
    observeResources(onUpdate) {
      latest = onUpdate
      queueMicrotask(() => onUpdate(initial))
      return {
        id: asObservationId('res-obs'),
        cancel() {
          cancels += 1
          if (latest === onUpdate) latest = null
        },
      }
    },
    observeStatistics() {
      return noopHandle('stats')
    },
    observeTask() {
      return noopHandle('task')
    },
    observeTaskChanges() {
      return noopHandle('changes')
    },
    observeHarnesses() {
      return noopHandle('harnesses')
    },
    async startTask(_request: StartTaskRequest) {
      return { kind: 'accepted', taskId: asTaskId('unused') }
    },
  }
  return {
    port,
    capture: () => latest,
    cancelCount: () => cancels,
  }
}

function noopHandle(id: string): ObservationHandle {
  return {
    id: asObservationId(id),
    cancel() {
      /* no-op */
    },
  }
}

async function flush(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

describe('ResourcesSession', () => {
  it('loads populated slot usage, holders, waiters, and valid zeros', async () => {
    const { port } = createCapturingPort()
    const session = new ResourcesSession(createLoadResourcesUseCase(port))
    session.start()
    await flush()
    const load = session.getState().load
    expect(load.kind).toBe('ready')
    if (load.kind !== 'ready') throw new Error('expected ready')
    const opencode = load.observation.harnesses.find(
      (h) => h.kind === 'installed' && h.label === 'Opencode',
    )
    expect(opencode).toEqual({
      kind: 'installed',
      harnessId: 'opencode',
      label: 'Opencode',
      capacity: 2,
      used: 0,
      waitingCount: 0,
      holders: [],
    })
    const codex = load.observation.harnesses.find(
      (h) => h.kind === 'installed' && h.label === 'Codex',
    )
    expect(codex?.kind).toBe('installed')
    if (codex?.kind !== 'installed') throw new Error('expected installed')
    expect(codex.used).toBe(2)
    expect(codex.capacity).toBe(2)
    expect(codex.waitingCount).toBe(1)
    expect(codex.holders).toHaveLength(2)
    const antigravity = load.observation.harnesses.find(
      (h) => h.kind === 'not_installed',
    )
    expect(antigravity).toEqual({
      kind: 'not_installed',
      harnessId: 'antigravity',
      label: 'Antigravity',
    })
    expect(load.observation.waiting).toEqual([
      {
        id: 'wait-1',
        title: 'Write contract fixtures for v1 tasks',
        detail: 'Waiting for a Codex slot',
        waitedMeta: 'Waited 4m',
      },
    ])
    session.dispose()
  })

  it('rejects a captured callback after dispose or replacement', async () => {
    const { port, capture, cancelCount } = createCapturingPort()
    const session = new ResourcesSession(createLoadResourcesUseCase(port))
    session.start()
    await flush()
    const firstCallback = capture()
    expect(firstCallback).not.toBeNull()

    session.start()
    await flush()
    expect(cancelCount()).toBe(1)
    const afterReplace = session.getState().load
    expect(afterReplace.kind).toBe('ready')

    firstCallback?.({
      kind: 'unavailable',
      message: 'stale replacement callback',
    })
    expect(session.getState().load).toEqual(afterReplace)

    const secondCallback = capture()
    session.dispose()
    expect(cancelCount()).toBe(2)
    secondCallback?.({
      kind: 'unavailable',
      message: 'stale dispose callback',
    })
    expect(session.getState().load).toEqual(afterReplace)
  })
})
