import { describe, expect, it } from 'vitest'
import { createOneShotObservation } from '../adapters/mock/mockObservation'
import { stubCapabilityPorts } from '../adapters/mock/stubCapabilityPorts'
import {
  createLoadTaskChangesUseCase,
  createLoadMessagingCapabilityUseCase,
  createLoadTaskEventsUseCase,
  createLoadTaskUseCase,
  type EnginePort,
} from '../application'
import {
  asObservationId,
  asTaskId,
  type ObservationHandle,
  type StartTaskRequest,
  type TaskChangesLoad,
  type TaskChangesObservation,
  type TaskChangesQuery,
  type TaskEventsLoad,
  type TaskEventsOlderLoad,
  type TaskEventsQuery,
  type TaskId,
  type TaskLoad,
} from '../model'
import { taskChangesKey } from '../adapters/mock/mockEngineCore'
import {
  pageEventsObservation,
  populatedEventsObservation,
  taskEventsLoadFor,
  taskEventsOlderLoadFor,
} from '../adapters/mock/taskEventsFixtures'
import {
  TASK_EVENTS_PAGE_ERROR_ID,
  TASK_EVENTS_PAGE_ID,
  TASK_EVENTS_POPULATED_ID,
} from '../adapters/mock/taskEventsFixtureIds'
import {
  CONFIG_ENTRY,
  QUEUE_ENTRY,
  taskChangesLoadFor,
  HARFLOW_WEB_ROOT,
  TASK_CHANGES_TURN_2_ID,
  TASK_CHANGES_TURNS_ID,
} from '../adapters/mock/taskChangesFixtures'
import {
  EVENTS_READER_FAILED_TASK_ID,
  PRELOAD_TASK_ID,
  RETRY_BUDGET_DONE_TASK_ID,
  SLOT_RELEASE_TASK_ID,
  slotReleaseObservation,
  taskLoadFor,
} from '../adapters/mock/taskFixtures'
import { eventsLifecycleFor } from './taskEventsLifecycle'
import { TaskSession } from './taskSession'
import {
  TASK_STATUS_PENDING_ID,
  taskStatusObservations,
} from '../adapters/mock/taskStatusFixtures'

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
    observeWorkflowExecution() {
      return noopHandle('workflow-execution')
    },
    observeResources() {
      return noopHandle('res')
    },
    observeParallelGroup() {
      return noopHandle('parallel-group')
    },
    ...stubCapabilityPorts(),
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
    observeTaskEventsOlder(query, onUpdate) {
      return createOneShotObservation(onUpdate, () =>
        taskEventsOlderLoadFor(query),
      )
    },
    observeTaskEvents(query, onUpdate) {
      queueMicrotask(() => onUpdate(taskEventsLoadFor(query)))
      return {
        id: asObservationId(`events-${query.taskId}`),
        cancel() {
          /* no-op */
        },
      }
    },
    observeHarnesses() {
      return noopHandle('harnesses')
    },
    observeSettingsGeneral() {
      return {
        id: asObservationId('unused-settings-general'),
        cancel() {
          /* no-op */
        },
      }
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
  publishEvents: (query: TaskEventsQuery, load: TaskEventsLoad) => void
  captureChangesCallback: () => ((load: TaskChangesLoad) => void) | null
  captureEventsCallback: () => ((load: TaskEventsLoad) => void) | null
  captureOlderCallback: () => ((load: TaskEventsOlderLoad) => void) | null
} {
  const active = new Map<TaskId, (load: TaskLoad) => void>()
  const activeChanges = new Map<string, (load: TaskChangesLoad) => void>()
  const activeEvents = new Map<TaskId, (load: TaskEventsLoad) => void>()
  let lastChangesCallback: ((load: TaskChangesLoad) => void) | null = null
  let lastEventsCallback: ((load: TaskEventsLoad) => void) | null = null
  let lastOlderCallback: ((load: TaskEventsOlderLoad) => void) | null = null
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
      observeWorkflowExecution() {
        return noopHandle('workflow-execution')
      },
      observeResources() {
        return noopHandle('res')
      },
      observeParallelGroup() {
        return noopHandle('parallel-group')
      },
      ...stubCapabilityPorts(),
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
        const key = taskChangesKey(query)
        lastChangesCallback = onUpdate
        activeChanges.set(key, onUpdate)
        return {
          id: asObservationId(`changes-${key}`),
          cancel() {
            if (activeChanges.get(key) === onUpdate) activeChanges.delete(key)
          },
        }
      },
      observeTaskEventsOlder(_query, onUpdate) {
        lastOlderCallback = onUpdate
        return noopHandle('older')
      },
      observeTaskEvents(query, onUpdate) {
        lastEventsCallback = onUpdate
        activeEvents.set(query.taskId, onUpdate)
        return {
          id: asObservationId(`events-${query.taskId}`),
          cancel() {
            if (activeEvents.get(query.taskId) === onUpdate) {
              activeEvents.delete(query.taskId)
            }
          },
        }
      },
      observeHarnesses() {
        return noopHandle('harnesses')
      },
      observeSettingsGeneral() {
        return {
          id: asObservationId('unused-settings-general'),
          cancel() {
            /* no-op */
          },
        }
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
      const key = taskChangesKey(query)
      activeChanges.get(key)?.(load)
    },
    publishEvents(query, load) {
      activeEvents.get(query.taskId)?.(load)
    },
    captureChangesCallback: () => lastChangesCallback,
    captureEventsCallback: () => lastEventsCallback,
    captureOlderCallback: () => lastOlderCallback,
  }
}

function sessionFor(port: EnginePort): TaskSession {
  return new TaskSession(
    createLoadTaskUseCase(port),
    createLoadTaskChangesUseCase(port),
    createLoadTaskEventsUseCase(port),
    createLoadMessagingCapabilityUseCase(port),
  )
}

function committedRows(observation: TaskChangesObservation | null) {
  return observation?.repositories[0]?.scopes.committed_range?.rows ?? null
}

function defaultChangesQuery(taskId: TaskId): TaskChangesQuery {
  return { taskId, selectedEntry: null, turnTaskId: null }
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
  it('clears seeded command chrome when a different task is opened', async () => {
    const { port } = createCapturingPort()
    const session = sessionFor(port)
    session.start()
    session.openTask(SLOT_RELEASE_TASK_ID)
    await flush()
    session.seedTaskCommandChrome(SLOT_RELEASE_TASK_ID, 'stop-requested')
    expect(session.getState().commandChrome).toBe('stop-requested')
    session.openTask(PRELOAD_TASK_ID)
    expect(session.getState().commandChrome).toBe(null)
    expect(session.getState().load.kind).toBe('loading')
    await flush()
    expect(session.getState().commandChrome).toBe(null)
    session.dispose()
  })

  it('clears seeded command chrome when the same task is reopened, keeping its observation', async () => {
    const { port } = createCapturingPort()
    const session = sessionFor(port)
    session.start()
    session.openTask(SLOT_RELEASE_TASK_ID)
    await flush()
    session.seedTaskCommandChrome(SLOT_RELEASE_TASK_ID, 'stop-requested')
    expect(session.getState().commandChrome).toBe('stop-requested')
    const loadBefore = session.getState().load
    session.openTask(SLOT_RELEASE_TASK_ID)
    expect(session.getState().commandChrome).toBe(null)
    expect(session.getState().load).toBe(loadBefore)
    session.dispose()
  })

  it('drops the dialog and menu when the load leaves ready', async () => {
    const { port, capture } = createCapturingPort()
    const session = sessionFor(port)
    session.start()
    session.openTask(SLOT_RELEASE_TASK_ID)
    await flush()
    session.setOverflowMenuOpen(true)
    session.openTaskDialog('stop', 'more')
    expect(session.getState().dialog).toBe('stop')
    capture()?.callback({ kind: 'unavailable', message: 'Gone' })
    expect(session.getState().dialog).toBeNull()
    expect(session.getState().dialogOpener).toBeNull()
    expect(session.getState().overflowMenuOpen).toBe(false)
    session.dispose()
  })

  it('refuses Stop and Take over dialogs the status does not admit', async () => {
    const { port } = createCapturingPort()
    const session = sessionFor(port)
    session.start()
    session.openTask(RETRY_BUDGET_DONE_TASK_ID)
    await flush()
    session.openTaskDialog('stop', 'more')
    expect(session.getState().dialog).toBeNull()
    session.openTaskDialog('takeover', 'more')
    expect(session.getState().dialog).toBeNull()
    session.dispose()
  })

  it('refuses the Take over dialog without an observed access level', async () => {
    const { accessLevel: _unused, ...withoutAccess } =
      slotReleaseObservation()
    const { port } = createCapturingPort((taskId) =>
      taskId === SLOT_RELEASE_TASK_ID
        ? { kind: 'ready', observation: withoutAccess }
        : taskLoadFor(taskId),
    )
    const session = sessionFor(port)
    session.start()
    session.openTask(SLOT_RELEASE_TASK_ID)
    await flush()
    session.openTaskDialog('takeover', 'more')
    expect(session.getState().dialog).toBeNull()
    session.openTaskDialog('stop', 'more')
    expect(session.getState().dialog).toBe('stop')
    session.dispose()
  })

  it('closes a Take over dialog when Stop is acknowledged', async () => {
    const { port } = createCapturingPort()
    const session = sessionFor(port)
    session.start()
    session.openTask(SLOT_RELEASE_TASK_ID)
    await flush()
    session.openTaskDialog('takeover', 'more')
    expect(session.getState().dialog).toBe('takeover')
    session.seedTaskCommandChrome(SLOT_RELEASE_TASK_ID, 'stop-requested')
    expect(session.getState().dialog).toBeNull()
    session.dispose()
  })

  it('ignores seeding for a task that is not the ready selection', async () => {
    const { port } = createCapturingPort()
    const session = sessionFor(port)
    session.start()
    session.openTask(SLOT_RELEASE_TASK_ID)
    // Still loading: not seedable.
    session.seedTaskCommandChrome(SLOT_RELEASE_TASK_ID, 'stop-requested')
    expect(session.getState().commandChrome).toBe(null)
    await flush()
    // Ready, but another task id: not seedable.
    session.seedTaskCommandChrome(PRELOAD_TASK_ID, 'stop-requested')
    expect(session.getState().commandChrome).toBe(null)
    session.dispose()
  })

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
      expect(load.observation.statusRead).toEqual({
        kind: 'observed',
        status: 'failed',
      })
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
      expect(load.observation.statusRead).toEqual({
        kind: 'observed',
        status: 'completed',
      })
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
    // A completed task with an observed exit opens on Changes by default.
    expect(session.getState().changesPaneOpen).toBe(true)
    session.setChangesPaneOpen(false)
    expect(session.getState().changesPaneOpen).toBe(false)

    session.setChangesPaneOpen(true)
    expect(session.getState().changesPaneOpen).toBe(true)
    expect(session.getState().changesLoad.kind).toBe('loading')
    await flush()
    expect(changesQueries().at(-1)).toEqual(
      defaultChangesQuery(RETRY_BUDGET_DONE_TASK_ID),
    )
    const open = session.getState().changesLoad
    expect(open.kind).toBe('ready')
    if (open.kind === 'ready') {
      expect(committedRows(open.observation)).toHaveLength(3)
      // No row is selected by default: the list alone is observed.
      expect(open.observation.text).toBeNull()
    }
    expect(session.getState().changesQueryEntry).toBeNull()
    expect(session.getState().selectedChangeEntry).toBeNull()

    session.setChangesPaneOpen(false)
    expect(session.getState().changesPaneOpen).toBe(false)
    expect(session.getState().selectedChangeEntry).toBeNull()
    expect(session.getState().changesList).toBeNull()
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
    const queryNull = defaultChangesQuery(RETRY_BUDGET_DONE_TASK_ID)
    const first = taskChangesLoadFor(queryNull)
    publishChanges(queryNull, first)
    expect(session.getState().changesQueryEntry).toBeNull()
    expect(session.getState().selectedChangeEntry).toBeNull()
    expect(session.getState().changesLoad).toEqual(first)

    const sameCallback = captureChangesCallback()
    expect(sameCallback).not.toBeNull()
    expect(typeof sameCallback).toBe('function')

    const updated =
      first.kind === 'ready'
        ? {
            kind: 'ready' as const,
            observation: { ...first.observation, hasMore: true, nextCursor: 'next' },
          }
        : first
    sameCallback!(updated)
    expect(session.getState().changesLoad).toEqual(updated)
    expect(session.getState().changesQueryEntry).toBeNull()
    const afterUpdate = session.getState().changesLoad
    expect(afterUpdate.kind).toBe('ready')
    if (afterUpdate.kind === 'ready') {
      expect(afterUpdate.observation.hasMore).toBe(true)
    }

    sameCallback!({
      kind: 'unavailable',
      message: 'Changes observation became unavailable.',
    })
    expect(session.getState().changesLoad).toEqual({
      kind: 'unavailable',
      message: 'Changes observation became unavailable.',
    })
    expect(session.getState().changesQueryEntry).toBeNull()
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
    const queryNull = defaultChangesQuery(RETRY_BUDGET_DONE_TASK_ID)
    publishChanges(queryNull, taskChangesLoadFor(queryNull))
    expect(session.getState().selectedChangeEntry).toBeNull()
    expect(committedRows(session.getState().changesList)).toHaveLength(3)

    session.selectChangedEntry(QUEUE_ENTRY)
    const queryQueue: TaskChangesQuery = {
      taskId: RETRY_BUDGET_DONE_TASK_ID,
      selectedEntry: QUEUE_ENTRY,
      turnTaskId: null,
    }
    publishChanges(queryQueue, taskChangesLoadFor(queryQueue))
    expect(session.getState().selectedChangeEntry).toEqual(QUEUE_ENTRY)

    const staleCallback = captureChangesCallback()
    expect(staleCallback).not.toBeNull()
    expect(typeof staleCallback).toBe('function')

    session.selectChangedEntry(CONFIG_ENTRY)
    expect(session.getState().changesQueryEntry).toEqual(CONFIG_ENTRY)
    expect(session.getState().selectedChangeEntry).toEqual(CONFIG_ENTRY)
    expect(session.getState().changesLoad.kind).toBe('loading')
    expect(committedRows(session.getState().changesList)).toHaveLength(3)

    // Invoke the saved old callback directly (cancellation may clear the map).
    staleCallback!(taskChangesLoadFor(queryQueue))
    expect(session.getState().changesLoad.kind).toBe('loading')
    expect(session.getState().selectedChangeEntry).toEqual(CONFIG_ENTRY)

    const queryConfig: TaskChangesQuery = {
      taskId: RETRY_BUDGET_DONE_TASK_ID,
      selectedEntry: CONFIG_ENTRY,
      turnTaskId: null,
    }
    publishChanges(queryConfig, taskChangesLoadFor(queryConfig))
    const load = session.getState().changesLoad
    expect(load.kind).toBe('ready')
    if (load.kind === 'ready') {
      expect(load.observation.text?.entry).toEqual(CONFIG_ENTRY)
      if (load.observation.text !== null) {
        const text = load.observation.text.lines.map((l) => l.text).join('\n')
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
    const query = defaultChangesQuery(RETRY_BUDGET_DONE_TASK_ID)
    publishChanges(query, taskChangesLoadFor(query))
    const stale = captureChangesCallback()
    expect(stale).not.toBeNull()
    expect(session.getState().changesPaneOpen).toBe(true)

    session.openTask(SLOT_RELEASE_TASK_ID)
    expect(session.getState().selectedTaskId).toBe(SLOT_RELEASE_TASK_ID)
    expect(session.getState().changesPaneOpen).toBe(false)
    expect(session.getState().changesList).toBeNull()
    expect(session.getState().changesLoad.kind).toBe('loading')
    stale!(taskChangesLoadFor(query))
    expect(session.getState().changesPaneOpen).toBe(false)
    expect(session.getState().changesLoad.kind).toBe('loading')
    expect(session.getState().selectedTaskId).toBe(SLOT_RELEASE_TASK_ID)
    session.dispose()
  })

  it('rejects results from a previous turn after switching turns and resets expansion', () => {
    const { port, publish, publishChanges, captureChangesCallback } =
      createDeferredPort()
    const session = sessionFor(port)
    session.start()
    session.openTask(TASK_CHANGES_TURNS_ID)
    publish(TASK_CHANGES_TURNS_ID, taskLoadFor(TASK_CHANGES_TURNS_ID))
    session.setChangesPaneOpen(true)
    const opened = defaultChangesQuery(TASK_CHANGES_TURNS_ID)
    publishChanges(opened, taskChangesLoadFor(opened))
    expect(session.getState().expandedRepos).toEqual([HARFLOW_WEB_ROOT])
    const stale = captureChangesCallback()
    expect(stale).not.toBeNull()
    session.setRepositoryExpanded('~/Code/other', true)
    expect(session.getState().expandedRepos).toHaveLength(2)

    session.selectChangesTurn(TASK_CHANGES_TURN_2_ID)
    expect(session.getState().changesTurnTaskId).toBe(TASK_CHANGES_TURN_2_ID)
    expect(session.getState().changesLoad.kind).toBe('loading')
    expect(session.getState().changesList).toBeNull()
    expect(session.getState().expandedRepos).toEqual([])

    // The opened turn's late result and a wrongly identified result are fenced.
    stale!(taskChangesLoadFor(opened))
    expect(session.getState().changesLoad.kind).toBe('loading')
    expect(session.getState().changesList).toBeNull()
    const current = captureChangesCallback()
    current!(taskChangesLoadFor(opened))
    expect(session.getState().changesLoad.kind).toBe('loading')

    const turn2: TaskChangesQuery = {
      taskId: TASK_CHANGES_TURNS_ID,
      selectedEntry: null,
      turnTaskId: TASK_CHANGES_TURN_2_ID,
    }
    publishChanges(turn2, taskChangesLoadFor(turn2))
    const load = session.getState().changesLoad
    expect(load.kind).toBe('ready')
    if (load.kind === 'ready') {
      expect(load.observation.taskId).toBe(TASK_CHANGES_TURN_2_ID)
    }
    expect(session.getState().expandedRepos).toEqual([HARFLOW_WEB_ROOT])
    session.dispose()
  })

  it('rejects a late result after the pane was closed', () => {
    const { port, publish, publishChanges, captureChangesCallback } =
      createDeferredPort()
    const session = sessionFor(port)
    session.start()
    session.openTask(RETRY_BUDGET_DONE_TASK_ID)
    publish(RETRY_BUDGET_DONE_TASK_ID, taskLoadFor(RETRY_BUDGET_DONE_TASK_ID))
    session.setChangesPaneOpen(true)
    const query = defaultChangesQuery(RETRY_BUDGET_DONE_TASK_ID)
    const beforeAnyResult = captureChangesCallback()
    session.setChangesPaneOpen(false)
    beforeAnyResult!(taskChangesLoadFor(query))
    expect(session.getState().changesPaneOpen).toBe(false)
    expect(session.getState().changesLoad.kind).toBe('loading')
    expect(session.getState().changesList).toBeNull()

    session.setChangesPaneOpen(true)
    publishChanges(query, taskChangesLoadFor(query))
    const stale = captureChangesCallback()
    expect(session.getState().changesList).not.toBeNull()
    session.setChangesPaneOpen(false)
    stale!(taskChangesLoadFor(query))
    expect(session.getState().changesPaneOpen).toBe(false)
    expect(session.getState().changesList).toBeNull()
    expect(session.getState().changesLoad.kind).toBe('loading')
    session.dispose()
  })
})

describe('TaskSession events', () => {
  function openEventsPane(
    session: TaskSession,
    publish: (taskId: TaskId, load: TaskLoad) => void,
    taskId: TaskId,
  ): void {
    session.openTask(taskId)
    publish(taskId, taskLoadFor(taskId))
    session.setPaneTab('events')
    session.setChangesPaneOpen(true)
  }

  async function readyEvents(taskId: TaskId): Promise<TaskSession> {
    const { port } = createCapturingPort()
    const session = sessionFor(port)
    session.start()
    session.openTask(taskId)
    await flush()
    session.setPaneTab('events')
    session.setChangesPaneOpen(true)
    await flush()
    return session
  }

  it('reads the older page and reaches the beginning from hasOlder', async () => {
    const session = await readyEvents(TASK_EVENTS_PAGE_ID)
    expect(session.getState().eventsLoad.kind).toBe('ready')
    expect(session.getState().eventsEarlier.status).toBe('idle')
    session.loadEarlierEvents()
    expect(session.getState().eventsEarlier.status).toBe('loading')
    await flush()
    const earlier = session.getState().eventsEarlier
    expect(earlier.status).toBe('loaded')
    expect(earlier.records.map((record) => record.seq)).toEqual([40])
    expect(earlier.hasOlder).toBe(false)
    // The newest page itself is untouched by the older read.
    expect(session.getState().eventsList?.records).toHaveLength(3)
    session.dispose()
  })

  it('keeps newest records when the older read fails transiently', async () => {
    const session = await readyEvents(TASK_EVENTS_PAGE_ERROR_ID)
    session.loadEarlierEvents()
    await flush()
    const state = session.getState()
    expect(state.eventsEarlier.status).toBe('error')
    expect(state.eventsEarlier.records).toEqual([])
    expect(state.eventsList?.records).toHaveLength(3)
    expect(state.eventsEarlier.failure).toBe('transient')
    // A transient failure retries the same cursor; this specimen keeps failing.
    session.loadEarlierEvents()
    expect(session.getState().eventsEarlier.status).toBe('loading')
    await flush()
    expect(session.getState().eventsEarlier.status).toBe('error')
    expect(session.getState().eventsList?.records).toHaveLength(3)
    session.dispose()
  })

  it('does not read earlier without an older page or with the pane closed', async () => {
    const session = await readyEvents(TASK_EVENTS_POPULATED_ID)
    session.loadEarlierEvents()
    expect(session.getState().eventsEarlier.status).toBe('idle')
    session.dispose()
    const paged = await readyEvents(TASK_EVENTS_PAGE_ID)
    paged.setChangesPaneOpen(false)
    paged.loadEarlierEvents()
    expect(paged.getState().eventsEarlier.status).toBe('idle')
    paged.dispose()
  })

  it('rejects a late events result after the pane was closed', () => {
    const { port, publish, captureEventsCallback } = createDeferredPort()
    const session = sessionFor(port)
    session.start()
    openEventsPane(session, publish, TASK_EVENTS_PAGE_ID)
    const stale = captureEventsCallback()
    expect(stale).not.toBeNull()
    session.setChangesPaneOpen(false)
    stale!({ kind: 'ready', observation: pageEventsObservation() })
    expect(session.getState().changesPaneOpen).toBe(false)
    expect(session.getState().eventsList).toBeNull()
    expect(session.getState().eventsLoad.kind).toBe('loading')
    session.dispose()
  })

  it('rejects a late events result after switching to Changes', () => {
    const { port, publish, captureEventsCallback } = createDeferredPort()
    const session = sessionFor(port)
    session.start()
    openEventsPane(session, publish, TASK_EVENTS_PAGE_ID)
    const stale = captureEventsCallback()
    session.setPaneTab('changes')
    stale!({ kind: 'ready', observation: pageEventsObservation() })
    expect(session.getState().paneTab).toBe('changes')
    expect(session.getState().eventsList).toBeNull()
    expect(session.getState().eventsLoad.kind).toBe('loading')
    session.dispose()
  })

  it('rejects a late events result for the old task after the pane re-opens on Events for the new task', () => {
    const { port, publish, captureEventsCallback } = createDeferredPort()
    const session = sessionFor(port)
    session.start()
    openEventsPane(session, publish, TASK_EVENTS_PAGE_ID)
    const stale = captureEventsCallback()
    openEventsPane(session, publish, TASK_EVENTS_POPULATED_ID)
    expect(session.getState().selectedTaskId).toBe(TASK_EVENTS_POPULATED_ID)
    expect(session.getState().paneTab).toBe('events')
    expect(session.getState().changesPaneOpen).toBe(true)
    stale!({ kind: 'ready', observation: pageEventsObservation() })
    expect(session.getState().eventsList).toBeNull()
    expect(session.getState().eventsLoad.kind).toBe('loading')
    session.dispose()
  })

  it('rejects a late older page after closing, switching tab, or re-opening for another task', () => {
    const { port, publish, captureEventsCallback, captureOlderCallback } =
      createDeferredPort()
    const session = sessionFor(port)
    session.start()
    openEventsPane(session, publish, TASK_EVENTS_PAGE_ID)
    captureEventsCallback()!({
      kind: 'ready',
      observation: pageEventsObservation(),
    })
    session.loadEarlierEvents()
    const stale = captureOlderCallback()
    expect(stale).not.toBeNull()
    expect(session.getState().eventsEarlier.status).toBe('loading')
    const page = taskEventsOlderLoadFor({
      taskId: TASK_EVENTS_PAGE_ID,
      before: pageEventsObservation().olderCursor!,
    })

    // Re-opened on Events for another task, which is itself waiting on an older read.
    openEventsPane(session, publish, TASK_EVENTS_POPULATED_ID)
    captureEventsCallback()!({
      kind: 'ready',
      observation: { ...pageEventsObservation(), taskId: TASK_EVENTS_POPULATED_ID },
    })
    session.loadEarlierEvents()
    expect(session.getState().eventsEarlier.status).toBe('loading')
    stale!(page)
    expect(session.getState().eventsEarlier.status).toBe('loading')
    expect(session.getState().eventsEarlier.records).toEqual([])

    // Closing the pane or leaving Events also drops a late page.
    const fresh = captureOlderCallback()!
    session.setPaneTab('changes')
    fresh(page)
    expect(session.getState().eventsEarlier.records).toEqual([])
    session.dispose()
  })

  it('drops older pages when a newer newest page moves the cursor', () => {
    const { port, publish, captureEventsCallback } = createDeferredPort()
    const session = sessionFor(port)
    session.start()
    openEventsPane(session, publish, TASK_EVENTS_PAGE_ID)
    const deliver = captureEventsCallback()!
    deliver({ kind: 'ready', observation: pageEventsObservation() })
    session.loadEarlierEvents()
    expect(session.getState().eventsEarlier.status).toBe('loading')
    deliver({
      kind: 'ready',
      observation: { ...pageEventsObservation(), olderCursor: 'older:moved' },
    })
    expect(session.getState().eventsEarlier.status).toBe('idle')
    session.dispose()
  })

  it('switching to Changes does not restart a live Changes observation', async () => {
    const { port, changesQueries } = createCapturingPort()
    const session = sessionFor(port)
    session.start()
    session.openTask(TASK_EVENTS_PAGE_ID)
    await flush()
    session.setPaneTab('events')
    session.setChangesPaneOpen(true)
    await flush()
    const before = changesQueries().length
    session.setPaneTab('changes')
    session.setPaneTab('events')
    session.setPaneTab('changes')
    await flush()
    expect(changesQueries()).toHaveLength(before)
    session.dispose()
  })

  it('stops the Events read when the status becomes unread or pending, and drops a late result', () => {
    for (const next of [
      { kind: 'unread' as const },
      { kind: 'observed' as const, status: 'pending' as const },
    ]) {
      const { port, publish, captureEventsCallback } = createDeferredPort()
      const session = sessionFor(port)
      session.start()
      const taskId = TASK_EVENTS_POPULATED_ID
      const running = taskLoadFor(taskId)
      if (running.kind !== 'ready') throw new Error('fixture')
      session.openTask(taskId)
      publish(taskId, running)
      session.setPaneTab('events')
      session.setChangesPaneOpen(true)
      const stale = captureEventsCallback()
      expect(stale).not.toBeNull()
      publish(taskId, {
        kind: 'ready',
        observation: { ...running.observation, statusRead: next },
      })
      stale!({
        kind: 'ready',
        observation: populatedEventsObservation(),
      })
      expect(session.getState().eventsList).toBeNull()
      expect(session.getState().eventsLoad.kind).toBe('loading')
      session.dispose()
    }
  })

  it('starts the Events read when an unread status later settles', () => {
    const { port, publish, captureEventsCallback } = createDeferredPort()
    const session = sessionFor(port)
    session.start()
    const taskId = TASK_EVENTS_POPULATED_ID
    const settled = taskLoadFor(taskId)
    if (settled.kind !== 'ready') throw new Error('fixture')
    session.openTask(taskId)
    publish(taskId, {
      kind: 'ready',
      observation: { ...settled.observation, statusRead: { kind: 'unread' } },
    })
    session.setPaneTab('events')
    session.setChangesPaneOpen(true)
    expect(captureEventsCallback()).toBeNull()
    publish(taskId, settled)
    expect(captureEventsCallback()).not.toBeNull()
    session.dispose()
  })
})

describe('Events lifecycle across task-status fixtures', () => {
  const EXPECTED: Readonly<Record<string, 'notStarted' | 'unavailable' | 'ready'>> = {
    'task-slot-release': 'ready',
    'task-m05-stop-requested': 'ready',
    'task-m05-cancelled': 'ready',
    'task-m05-timed-out': 'ready',
    'task-m05-settling': 'ready',
    'task-m05-unknown-failed': 'ready',
    'task-m05-unknown-done': 'ready',
    'task-m05-owner-lost': 'ready',
    'task-m05-unverified': 'ready',
    'task-m05-launch-unknown': 'ready',
    'task-m05-status-unavailable': 'unavailable',
    'task-m05-pending': 'notStarted',
    'task-m05-taken-over': 'ready',
    'task-m05-continue-starting': 'ready',
    'task-m05-continue-started': 'ready',
    'task-events-reader-failed': 'ready',
  }
  const observations = taskStatusObservations()

  it('has an expectation for every task-status fixture and no extras', () => {
    expect(observations.map((o) => o.taskId).sort()).toEqual(
      Object.keys(EXPECTED).sort(),
    )
  })

  it.each(observations.map((o) => [o.taskId, o] as const))(
    'draws the %s Events lifecycle without inventing a read failure',
    async (taskId, observation) => {
      const { port } = createCapturingPort()
      let eventReads = 0
      const session = sessionFor({
        ...port,
        observeTaskEvents(query, onUpdate) {
          eventReads += 1
          return port.observeTaskEvents(query, onUpdate)
        },
      })
      session.start()
      session.openTask(taskId)
      await flush()
      session.setPaneTab('events')
      session.setChangesPaneOpen(true)
      await flush()
      const state = session.getState()
      const expected = EXPECTED[taskId]
      expect(eventsLifecycleFor(observation, state.eventsLoad)).toBe(expected)
      if (expected === 'ready') {
        expect(state.eventsLoad.kind).toBe('ready')
        expect(eventReads).toBe(1)
      } else {
        // Not started or unread: the lifecycle body needs no read.
        expect(eventReads).toBe(0)
      }
      session.dispose()
    },
  )

  it('the mock answers a pending task with the pending-launch refusal', () => {
    expect(
      taskEventsLoadFor({ taskId: TASK_STATUS_PENDING_ID }),
    ).toEqual({
      kind: 'refused',
      code: 'task_pending_launch',
      launchState: 'waiting_for_resources',
    })
  })
})
