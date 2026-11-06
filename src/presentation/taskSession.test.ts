import { describe, expect, it } from 'vitest'
import {
  createLoadTaskChangesUseCase,
  createLoadTaskUseCase,
  type EnginePort,
} from '../application'
import {
  asObservationId,
  asTaskId,
  type ObservationHandle,
  type StartTaskRequest,
  type TaskChangesLoad,
  type TaskChangesQuery,
  type TaskId,
  type TaskLoad,
} from '../model'
import {
  CONFIG_PY_PATH,
  QUEUE_PY_PATH,
  taskChangesLoadFor,
} from '../adapters/mock/taskChangesFixtures'
import {
  EVENTS_READER_FAILED_TASK_ID,
  PRELOAD_TASK_ID,
  RETRY_BUDGET_DONE_TASK_ID,
  SLOT_RELEASE_TASK_ID,
  taskLoadFor,
} from '../adapters/mock/taskFixtures'
import { TaskSession } from './taskSession'

function createCapturingPort(
  resolver: (taskId: TaskId) => TaskLoad = taskLoadFor,
  changesResolver: (query: TaskChangesQuery) => TaskChangesLoad = taskChangesLoadFor,
): {
  port: EnginePort
  capture: () => {
    taskId: TaskId
    callback: (load: TaskLoad) => void
  } | null
  captureChanges: () => {
    query: TaskChangesQuery
    callback: (load: TaskChangesLoad) => void
  } | null
  cancelCount: () => number
  changesCancelCount: () => number
  idsObserved: () => TaskId[]
  changesQueries: () => TaskChangesQuery[]
} {
  let latest: {
    taskId: TaskId
    callback: (load: TaskLoad) => void
  } | null = null
  let latestChanges: {
    query: TaskChangesQuery
    callback: (load: TaskChangesLoad) => void
  } | null = null
  let cancels = 0
  let changesCancels = 0
  const ids: TaskId[] = []
  const changeQueries: TaskChangesQuery[] = []
  const port: EnginePort = {
    observeContext() {
      return noopHandle('ctx')
    },
    observeWorkflows() {
      return noopHandle('wf')
    },
    observeWorkflowRun() {
      return noopHandle('workflow-run')
    },
    observeWorkflowEditor() {
      return noopHandle('workflow-editor')
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
    observeTaskChanges(query, onUpdate) {
      changeQueries.push(query)
      latestChanges = { query, callback: onUpdate }
      queueMicrotask(() => onUpdate(changesResolver(query)))
      return {
        id: asObservationId(`changes-${query.taskId}`),
        cancel() {
          changesCancels += 1
          if (latestChanges?.callback === onUpdate) latestChanges = null
        },
      }
    },
    observeHarnesses() {
      return noopHandle('harnesses')
    },
    observeNeedsYou() {
      return noopHandle('needs')
    },
    async startTask(_request: StartTaskRequest) {
      return { kind: 'accepted', taskId: asTaskId('unused') }
    },
  }
  return {
    port,
    capture: () => latest,
    captureChanges: () => latestChanges,
    cancelCount: () => cancels,
    changesCancelCount: () => changesCancels,
    idsObserved: () => ids,
    changesQueries: () => changeQueries,
  }
}

function createDeferredPort(): {
  port: EnginePort
  publish: (taskId: TaskId, load: TaskLoad) => void
  publishChanges: (query: TaskChangesQuery, load: TaskChangesLoad) => void
  captureChangesCallback: () => ((load: TaskChangesLoad) => void) | null
} {
  const active = new Map<TaskId, (load: TaskLoad) => void>()
  const activeChanges = new Map<string, (load: TaskChangesLoad) => void>()
  let lastChangesCallback: ((load: TaskChangesLoad) => void) | null = null
  return {
    port: {
      observeContext() {
        return noopHandle('ctx')
      },
      observeWorkflows() {
        return noopHandle('wf')
      },
      observeWorkflowRun() {
        return noopHandle('workflow-run')
      },
      observeWorkflowEditor() {
        return noopHandle('workflow-editor')
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
      observeTaskChanges(query, onUpdate) {
        const key = `${query.taskId}\0${query.selectedPath ?? ''}`
        lastChangesCallback = onUpdate
        activeChanges.set(key, onUpdate)
        return {
          id: asObservationId(`changes-${key}`),
          cancel() {
            if (activeChanges.get(key) === onUpdate) activeChanges.delete(key)
          },
        }
      },
      observeHarnesses() {
        return noopHandle('harnesses')
      },
      observeNeedsYou() {
        return noopHandle('needs')
      },
      async startTask() {
        return { kind: 'accepted', taskId: asTaskId('unused') }
      },
    },
    publish(taskId, load) {
      active.get(taskId)?.(load)
    },
    publishChanges(query, load) {
      const key = `${query.taskId}\0${query.selectedPath ?? ''}`
      activeChanges.get(key)?.(load)
    },
    captureChangesCallback: () => lastChangesCallback,
  }
}

function sessionFor(port: EnginePort): TaskSession {
  return new TaskSession(
    createLoadTaskUseCase(port),
    createLoadTaskChangesUseCase(port),
  )
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
    const session = sessionFor(port)
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
    const session = sessionFor(port)
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
    const session = sessionFor(port)
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
    const session = sessionFor(port)
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
    const session = sessionFor(port)
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
    const session = sessionFor(port)
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

  it('rejects a captured failed callback after switching to completed', async () => {
    const { port, publish } = createDeferredPort()
    const session = sessionFor(port)
    session.start()
    session.openTask(EVENTS_READER_FAILED_TASK_ID)
    session.openTask(RETRY_BUDGET_DONE_TASK_ID)
    expect(session.getState().selectedTaskId).toBe(RETRY_BUDGET_DONE_TASK_ID)
    expect(session.getState().load.kind).toBe('loading')

    publish(
      EVENTS_READER_FAILED_TASK_ID,
      taskLoadFor(EVENTS_READER_FAILED_TASK_ID),
    )
    expect(session.getState().load.kind).toBe('loading')
    expect(session.getState().selectedTaskId).toBe(RETRY_BUDGET_DONE_TASK_ID)

    publish(RETRY_BUDGET_DONE_TASK_ID, taskLoadFor(RETRY_BUDGET_DONE_TASK_ID))
    const load = session.getState().load
    expect(load).toEqual(taskLoadFor(RETRY_BUDGET_DONE_TASK_ID))
    if (load.kind === 'ready') {
      expect(load.observation.status).toBe('completed')
      expect(load.observation.title).toBe('Add retry budget to delivery queue')
    }
    session.dispose()
  })

  it('opens and closes the Changes pane for the completed fixture', async () => {
    const { port, changesQueries } = createCapturingPort()
    const session = sessionFor(port)
    session.start()
    session.openTask(RETRY_BUDGET_DONE_TASK_ID)
    await flush()
    expect(session.getState().changesPaneOpen).toBe(false)

    session.setChangesPaneOpen(true)
    expect(session.getState().changesPaneOpen).toBe(true)
    expect(session.getState().changesLoad.kind).toBe('loading')
    await flush()
    expect(changesQueries()).toEqual([
      { taskId: RETRY_BUDGET_DONE_TASK_ID, selectedPath: null },
    ])
    const open = session.getState().changesLoad
    expect(open.kind).toBe('ready')
    if (open.kind === 'ready') {
      expect(open.observation.selectedPath).toBe(QUEUE_PY_PATH)
      expect(open.observation.files).toHaveLength(3)
      expect(open.observation.diff.kind).toBe('lines')
    }
    expect(session.getState().changesQueryPath).toBeNull()
    expect(session.getState().selectedChangePath).toBe(QUEUE_PY_PATH)

    session.setChangesPaneOpen(false)
    expect(session.getState().changesPaneOpen).toBe(false)
    expect(session.getState().selectedChangePath).toBeNull()
    expect(session.getState().changesFiles).toBeNull()
    session.dispose()
  })

  it('accepts later updates on the same default-query callback', async () => {
    const { port, publish, publishChanges, captureChangesCallback } =
      createDeferredPort()
    const session = sessionFor(port)
    session.start()
    session.openTask(RETRY_BUDGET_DONE_TASK_ID)
    publish(RETRY_BUDGET_DONE_TASK_ID, taskLoadFor(RETRY_BUDGET_DONE_TASK_ID))
    session.setChangesPaneOpen(true)
    const queryNull = {
      taskId: RETRY_BUDGET_DONE_TASK_ID,
      selectedPath: null as string | null,
    }
    const first = taskChangesLoadFor(queryNull)
    publishChanges(queryNull, first)
    expect(session.getState().changesQueryPath).toBeNull()
    expect(session.getState().selectedChangePath).toBe(QUEUE_PY_PATH)
    expect(session.getState().changesLoad).toEqual(first)

    const sameCallback = captureChangesCallback()
    expect(sameCallback).not.toBeNull()
    expect(typeof sameCallback).toBe('function')

    const updated =
      first.kind === 'ready'
        ? {
            kind: 'ready' as const,
            observation: {
              ...first.observation,
              diff: {
                kind: 'lines' as const,
                lines: [
                  {
                    kind: 'add' as const,
                    text: '        # updated default observation',
                  },
                ],
              },
            },
          }
        : first
    sameCallback!(updated)
    expect(session.getState().changesLoad).toEqual(updated)
    expect(session.getState().changesQueryPath).toBeNull()
    const afterUpdate = session.getState().changesLoad
    expect(afterUpdate.kind).toBe('ready')
    if (afterUpdate.kind === 'ready') {
      expect(afterUpdate.observation.diff).toEqual({
        kind: 'lines',
        lines: [{ kind: 'add', text: '        # updated default observation' }],
      })
    }

    sameCallback!({
      kind: 'unavailable',
      message: 'Changes observation became unavailable.',
    })
    expect(session.getState().changesLoad).toEqual({
      kind: 'unavailable',
      message: 'Changes observation became unavailable.',
    })
    expect(session.getState().changesQueryPath).toBeNull()
    session.dispose()
  })

  it('selects two distinct files and clears prior diff immediately', async () => {
    const { port, publish, publishChanges, captureChangesCallback } =
      createDeferredPort()
    const session = sessionFor(port)
    session.start()
    session.openTask(RETRY_BUDGET_DONE_TASK_ID)
    publish(RETRY_BUDGET_DONE_TASK_ID, taskLoadFor(RETRY_BUDGET_DONE_TASK_ID))
    session.setChangesPaneOpen(true)
    const queryNull = {
      taskId: RETRY_BUDGET_DONE_TASK_ID,
      selectedPath: null as string | null,
    }
    publishChanges(queryNull, taskChangesLoadFor(queryNull))
    expect(session.getState().selectedChangePath).toBe(QUEUE_PY_PATH)
    expect(session.getState().changesFiles).toHaveLength(3)

    const staleCallback = captureChangesCallback()
    expect(staleCallback).not.toBeNull()
    expect(typeof staleCallback).toBe('function')

    session.selectChangedFile(CONFIG_PY_PATH)
    expect(session.getState().changesQueryPath).toBe(CONFIG_PY_PATH)
    expect(session.getState().selectedChangePath).toBe(CONFIG_PY_PATH)
    expect(session.getState().changesLoad.kind).toBe('loading')
    expect(session.getState().changesFiles).toHaveLength(3)

    // Invoke the saved old callback directly (cancellation may clear the map).
    staleCallback!(taskChangesLoadFor(queryNull))
    expect(session.getState().changesLoad.kind).toBe('loading')
    expect(session.getState().selectedChangePath).toBe(CONFIG_PY_PATH)

    const queryConfig = {
      taskId: RETRY_BUDGET_DONE_TASK_ID,
      selectedPath: CONFIG_PY_PATH,
    }
    publishChanges(queryConfig, taskChangesLoadFor(queryConfig))
    const load = session.getState().changesLoad
    expect(load.kind).toBe('ready')
    if (load.kind === 'ready') {
      expect(load.observation.selectedPath).toBe(CONFIG_PY_PATH)
      expect(load.observation.diff.kind).toBe('lines')
      if (load.observation.diff.kind === 'lines') {
        const text = load.observation.diff.lines.map((l) => l.text).join('\n')
        expect(text).toContain("<script>alert('x')</script>")
        expect(text).toContain('日本語')
      }
    }
    session.dispose()
  })

  it('closes Changes and rejects old callbacks when switching tasks', async () => {
    const { port, publish, publishChanges, captureChangesCallback } =
      createDeferredPort()
    const session = sessionFor(port)
    session.start()
    session.openTask(RETRY_BUDGET_DONE_TASK_ID)
    publish(RETRY_BUDGET_DONE_TASK_ID, taskLoadFor(RETRY_BUDGET_DONE_TASK_ID))
    session.setChangesPaneOpen(true)
    const query = {
      taskId: RETRY_BUDGET_DONE_TASK_ID,
      selectedPath: null as string | null,
    }
    publishChanges(query, taskChangesLoadFor(query))
    const stale = captureChangesCallback()
    expect(stale).not.toBeNull()
    expect(session.getState().changesPaneOpen).toBe(true)

    session.openTask(SLOT_RELEASE_TASK_ID)
    expect(session.getState().selectedTaskId).toBe(SLOT_RELEASE_TASK_ID)
    expect(session.getState().changesPaneOpen).toBe(false)
    expect(session.getState().changesFiles).toBeNull()
    expect(session.getState().changesLoad.kind).toBe('loading')
    stale!(taskChangesLoadFor(query))
    expect(session.getState().changesPaneOpen).toBe(false)
    expect(session.getState().changesLoad.kind).toBe('loading')
    expect(session.getState().selectedTaskId).toBe(SLOT_RELEASE_TASK_ID)
    session.dispose()
  })
})
