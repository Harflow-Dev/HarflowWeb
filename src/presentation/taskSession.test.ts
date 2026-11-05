import { describe, expect, it } from 'vitest'
import { createLoadTaskUseCase, type EnginePort } from '../application'
import {
  asObservationId,
  asTaskId,
  type ObservationHandle,
  type StartTaskRequest,
  type TaskId,
  type TaskLoad,
} from '../model'
import {
  EVENTS_READER_FAILED_TASK_ID,
  PRELOAD_TASK_ID,
  SLOT_RELEASE_TASK_ID,
  taskLoadFor,
} from '../adapters/mock/taskFixtures'
import { TaskSession } from './taskSession'

function createCapturingPort(
  resolver: (taskId: TaskId) => TaskLoad = taskLoadFor,
): {
  port: EnginePort
  capture: () => {
    taskId: TaskId
    callback: (load: TaskLoad) => void
  } | null
  cancelCount: () => number
  idsObserved: () => TaskId[]
} {
  let latest: {
    taskId: TaskId
    callback: (load: TaskLoad) => void
  } | null = null
  let cancels = 0
  const ids: TaskId[] = []
  const port: EnginePort = {
    observeContext() {
      return noopHandle('ctx')
    },
    observeWorkflows() {
      return noopHandle('wf')
    },
    observeResources() {
      return noopHandle('res')
    },
    observeStatistics() {
      return noopHandle('stats')
    },
    observeTask(taskId, onUpdate) {
      ids.push(taskId)
      latest = { taskId, callback: onUpdate }
      queueMicrotask(() => onUpdate(resolver(taskId)))
      return {
        id: asObservationId(`task-${taskId}`),
        cancel() {
          cancels += 1
          if (latest?.callback === onUpdate) latest = null
        },
      }
    },
    async startTask(_request: StartTaskRequest) {
      return { kind: 'accepted', taskId: asTaskId('unused') }
    },
  }
  return {
    port,
    capture: () => latest,
    cancelCount: () => cancels,
    idsObserved: () => ids,
  }
}

function createDeferredPort(): {
  port: EnginePort
  publish: (taskId: TaskId, load: TaskLoad) => void
} {
  const active = new Map<TaskId, (load: TaskLoad) => void>()
  return {
    port: {
      observeContext() {
        return noopHandle('ctx')
      },
      observeWorkflows() {
        return noopHandle('wf')
      },
      observeResources() {
        return noopHandle('res')
      },
      observeStatistics() {
        return noopHandle('stats')
      },
      observeTask(taskId, onUpdate) {
        active.set(taskId, onUpdate)
        return {
          id: asObservationId(`task-${taskId}`),
          cancel() {
            if (active.get(taskId) === onUpdate) active.delete(taskId)
          },
        }
      },
      async startTask() {
        return { kind: 'accepted', taskId: asTaskId('unused') }
      },
    },
    publish(taskId, load) {
      active.get(taskId)?.(load)
    },
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

describe('TaskSession', () => {
  it('loads the explicit fixture for the selected task id', async () => {
    const { port, idsObserved } = createCapturingPort()
    const session = new TaskSession(createLoadTaskUseCase(port))
    session.start()
    session.openTask(SLOT_RELEASE_TASK_ID)
    await flush()
    expect(idsObserved()).toEqual([SLOT_RELEASE_TASK_ID])
    expect(session.getState().selectedTaskId).toBe(SLOT_RELEASE_TASK_ID)
    expect(session.getState().load).toEqual(taskLoadFor(SLOT_RELEASE_TASK_ID))
    session.dispose()
  })

  it('rejects unmapped ids as unavailable without fallback content', async () => {
    const unknown = asTaskId('task-mock-accepted')
    const { port } = createCapturingPort()
    const session = new TaskSession(createLoadTaskUseCase(port))
    session.start()
    session.openTask(unknown)
    await flush()
    expect(session.getState().selectedTaskId).toBe(unknown)
    const load = session.getState().load
    expect(load.kind).toBe('unavailable')
    if (load.kind === 'unavailable') {
      expect(load.message).toContain(unknown)
    }
    session.dispose()
  })

  it('cancels A and ignores late A callbacks after opening B', async () => {
    const { port, publish } = createDeferredPort()
    const session = new TaskSession(createLoadTaskUseCase(port))
    session.start()
    session.openTask(SLOT_RELEASE_TASK_ID)
    expect(session.getState().load.kind).toBe('loading')
    expect(session.getState().selectedTaskId).toBe(SLOT_RELEASE_TASK_ID)

    session.openTask(PRELOAD_TASK_ID)
    expect(session.getState().selectedTaskId).toBe(PRELOAD_TASK_ID)
    expect(session.getState().load.kind).toBe('loading')

    publish(SLOT_RELEASE_TASK_ID, taskLoadFor(SLOT_RELEASE_TASK_ID))
    expect(session.getState().load.kind).toBe('loading')
    expect(session.getState().selectedTaskId).toBe(PRELOAD_TASK_ID)

    publish(PRELOAD_TASK_ID, taskLoadFor(PRELOAD_TASK_ID))
    expect(session.getState().load).toEqual(taskLoadFor(PRELOAD_TASK_ID))
    session.dispose()
  })

  it('ignores stale callbacks after dispose', async () => {
    const { port, capture, cancelCount } = createCapturingPort()
    const session = new TaskSession(createLoadTaskUseCase(port))
    session.start()
    session.openTask(SLOT_RELEASE_TASK_ID)
    await flush()
    const stale = capture()
    expect(stale).not.toBeNull()
    session.dispose()
    expect(cancelCount()).toBe(1)
    stale!.callback(taskLoadFor(PRELOAD_TASK_ID))
    expect(session.getState().load).toEqual(taskLoadFor(SLOT_RELEASE_TASK_ID))
  })

  it('rejects a ready payload whose observation id does not match selection', async () => {
    const { port, publish } = createDeferredPort()
    const session = new TaskSession(createLoadTaskUseCase(port))
    session.start()
    session.openTask(SLOT_RELEASE_TASK_ID)
    publish(SLOT_RELEASE_TASK_ID, taskLoadFor(PRELOAD_TASK_ID))
    expect(session.getState().load.kind).toBe('loading')
    publish(SLOT_RELEASE_TASK_ID, taskLoadFor(SLOT_RELEASE_TASK_ID))
    expect(session.getState().load).toEqual(taskLoadFor(SLOT_RELEASE_TASK_ID))
    session.dispose()
  })

  it('rejects a captured running callback after switching to failed', async () => {
    const { port, publish } = createDeferredPort()
    const session = new TaskSession(createLoadTaskUseCase(port))
    session.start()
    session.openTask(SLOT_RELEASE_TASK_ID)
    session.openTask(EVENTS_READER_FAILED_TASK_ID)
    expect(session.getState().selectedTaskId).toBe(EVENTS_READER_FAILED_TASK_ID)
    expect(session.getState().load.kind).toBe('loading')

    publish(SLOT_RELEASE_TASK_ID, taskLoadFor(SLOT_RELEASE_TASK_ID))
    expect(session.getState().load.kind).toBe('loading')
    expect(session.getState().selectedTaskId).toBe(EVENTS_READER_FAILED_TASK_ID)

    publish(EVENTS_READER_FAILED_TASK_ID, taskLoadFor(EVENTS_READER_FAILED_TASK_ID))
    const load = session.getState().load
    expect(load).toEqual(taskLoadFor(EVENTS_READER_FAILED_TASK_ID))
    if (load.kind === 'ready') {
      expect(load.observation.status).toBe('failed')
      expect(load.observation.title).toBe('Migrate events.jsonl reader')
    }
    session.dispose()
  })
})
