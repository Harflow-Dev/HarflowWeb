import { describe, expect, it } from 'vitest'
import { stubPendingLaunchPort } from '../adapters/mock/stubPendingLaunchPort'
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
  type TaskChangesObservation,
  type TaskChangesQuery,
  type TaskId,
  type TaskLoad,
} from '../model'
import { taskChangesKey } from '../adapters/mock/mockEngineCore'
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
    observeWorkflowExecution() {
      return noopHandle('workflow-execution')
    },
    observeResources() {
      return noopHandle('res')
    },
    observeParallelGroup() {
      return noopHandle('parallel-group')
    },
    ...stubPendingLaunchPort(),
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
      observeWorkflowExecution() {
        return noopHandle('workflow-execution')
      },
      observeResources() {
        return noopHandle('res')
      },
      observeParallelGroup() {
        return noopHandle('parallel-group')
      },
      ...stubPendingLaunchPort(),
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
    captureChangesCallback: () => lastChangesCallback,
  }
}

function sessionFor(port: EnginePort): TaskSession {
  return new TaskSession(
    createLoadTaskUseCase(port),
    createLoadTaskChangesUseCase(port),
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
    expect(session.getState().changesPaneOpen).toBe(false)

    session.setChangesPaneOpen(true)
    expect(session.getState().changesPaneOpen).toBe(true)
    expect(session.getState().changesLoad.kind).toBe('loading')
    await flush()
    expect(changesQueries()).toEqual([
      defaultChangesQuery(RETRY_BUDGET_DONE_TASK_ID),
    ])
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
