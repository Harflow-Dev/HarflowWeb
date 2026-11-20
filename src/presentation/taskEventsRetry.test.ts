import { describe, expect, it } from 'vitest'
import { createMockEngine } from '../adapters/mock/mockEngine'
import {
  TASK_EVENTS_PAGE_ID,
} from '../adapters/mock/taskEventsFixtures'
import { ASSISTANT_START } from '../adapters/mock/taskEventsRecordFixtures'
import { taskLoadFor } from '../adapters/mock/taskFixtures'
import {
  createLoadTaskChangesUseCase,
  createLoadMessagingCapabilityUseCase,
  createLoadTaskEventsUseCase,
  createLoadTaskUseCase,
  type EnginePort,
} from '../application'
import type { TaskEventsOlderLoad, TaskEventsOlderQuery } from '../model'
import { TaskSession } from './taskSession'

async function flush(): Promise<void> {
  for (let i = 0; i < 6; i += 1) await Promise.resolve()
}

/** Older-page answers are scripted in order; each query is recorded. */
function harness(answers: readonly ('transient' | 'expired' | 'ok')[]) {
  const base = createMockEngine().engine
  const queries: TaskEventsOlderQuery[] = []
  let call = 0
  const port: EnginePort = {
    ...base,
    observeTaskEventsOlder(query, onUpdate) {
      queries.push(query)
      const answer = answers[call++] ?? 'transient'
      Promise.resolve().then(() => {
        const load: TaskEventsOlderLoad =
          answer === 'transient'
            ? { kind: 'unavailable', message: 'down' }
            : answer === 'expired'
              ? { kind: 'refused', code: 'event_cursor_expired' }
              : okPage(query)
        onUpdate(load)
      })
      return { id: base.observeTaskEventsOlder(query, () => undefined).id, cancel() {} }
    },
  }
  const session = new TaskSession(
    createLoadTaskUseCase(port),
    createLoadTaskChangesUseCase(port),
    createLoadTaskEventsUseCase(port),
    createLoadMessagingCapabilityUseCase(port),
    {
      async execute() {
        return { kind: 'unknown' as const, message: 'stub' }
      },
    },
    {
      async execute() {
        return null
      },
    },
  )
  session.start()
  session.openTask(TASK_EVENTS_PAGE_ID)
  return { session, queries }
}

function okPage(query: TaskEventsOlderQuery): TaskEventsOlderLoad {
  return {
    kind: 'ready',
    page: {
      taskId: query.taskId,
      records: [ASSISTANT_START],
      hasOlder: false,
      olderCursor: null,
    },
  }
}

async function openEvents(answers: Parameters<typeof harness>[0]) {
  const h = harness(answers)
  await flush()
  expect(taskLoadFor(TASK_EVENTS_PAGE_ID).kind).toBe('ready')
  h.session.setChangesPaneOpen(true)
  h.session.setPaneTab('events')
  await flush()
  return h
}

describe('Events older-page failures', () => {
  it('retries the same cursor after a transient failure and appends the page', async () => {
    const { session, queries } = await openEvents(['transient', 'ok'])
    const rows = session.getState().eventsList?.records.length
    session.loadEarlierEvents()
    await flush()
    expect(session.getState().eventsEarlier.status).toBe('error')
    expect(session.getState().eventsEarlier.failure).toBe('transient')
    session.loadEarlierEvents()
    expect(session.getState().eventsEarlier.status).toBe('loading')
    await flush()
    const state = session.getState()
    expect(state.eventsEarlier.status).toBe('loaded')
    expect(state.eventsEarlier.records.length).toBeGreaterThan(0)
    expect(state.eventsList?.records).toHaveLength(rows ?? -1)
    expect(queries).toHaveLength(2)
    expect(queries[1]?.before).toBe(queries[0]?.before)
    session.dispose()
  })

  it('stays an error when the retry fails again and keeps the rows', async () => {
    const { session, queries } = await openEvents(['transient', 'transient'])
    session.loadEarlierEvents()
    await flush()
    session.loadEarlierEvents()
    await flush()
    const state = session.getState()
    expect(state.eventsEarlier.status).toBe('error')
    expect(state.eventsEarlier.failure).toBe('transient')
    expect(state.eventsList?.records.length).toBeGreaterThan(0)
    expect(queries).toHaveLength(2)
    session.dispose()
  })

  it('never retries the same cursor after a cursor refusal', async () => {
    const { session, queries } = await openEvents(['expired', 'ok'])
    session.loadEarlierEvents()
    await flush()
    expect(session.getState().eventsEarlier.failure).toBe('cursor')
    session.loadEarlierEvents()
    await flush()
    expect(session.getState().eventsEarlier.status).toBe('error')
    expect(queries).toHaveLength(1)
    session.dispose()
  })
})
