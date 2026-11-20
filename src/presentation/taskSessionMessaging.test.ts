import { describe, expect, it } from 'vitest'
import { createMockEngine } from '../adapters/mock/mockEngine'
import {
  MESSAGE_DELIVERING_TASK_ID,
  MESSAGE_QUEUED_SETTLED_TASK_ID,
  MESSAGE_QUEUED_TASK_ID,
  SEND_NOW_REFUSAL,
} from '../adapters/mock/taskMessageFixtures'
import {
  createLoadMessagingCapabilityUseCase,
  createLoadTaskChangesUseCase,
  createLoadTaskEventsUseCase,
  createLoadTaskUseCase,
} from '../application'
import type { TaskId } from '../model'
import { TaskSession } from './taskSession'
import type { TaskScreenState } from './taskState'

async function settle(): Promise<void> {
  for (let i = 0; i < 4; i += 1) await Promise.resolve()
}

async function openSession(
  scenario: 'message-queued' | 'message-delivering' | 'message-unsupported',
  taskId: TaskId,
) {
  const mock = createMockEngine(scenario)
  const session = new TaskSession(
    createLoadTaskUseCase(mock.engine),
    createLoadTaskChangesUseCase(mock.engine),
    createLoadTaskEventsUseCase(mock.engine),
    createLoadMessagingCapabilityUseCase(mock.engine),
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
  session.openTask(taskId)
  await settle()
  return { mock, session }
}

function countPublishes(session: TaskSession): () => number {
  let count = 0
  let first = true
  session.subscribe(() => {
    // subscribe replays the current state once.
    if (first) first = false
    else count += 1
  })
  return () => count
}

describe('TaskSession queued message commands', () => {
  it('cancels a queued message: removes it, sets the outcome, bumps focus', async () => {
    const { session } = await openSession('message-queued', MESSAGE_QUEUED_TASK_ID)
    expect(session.cancelQueuedMessage('a')).toBe(true)
    expect(session.getState().messagingChrome).toMatchObject({
      removedIds: ['a'],
      outcome: 'cancelled',
      focusSeq: 1,
    })
  })

  it('publishes nothing when cancelling an already removed id', async () => {
    const { session } = await openSession('message-queued', MESSAGE_QUEUED_TASK_ID)
    session.cancelQueuedMessage('a')
    const published = countPublishes(session)
    expect(session.cancelQueuedMessage('a')).toBe(false)
    expect(published()).toBe(0)
  })

  it('publishes nothing when cancelling an unknown id', async () => {
    const { session } = await openSession('message-queued', MESSAGE_QUEUED_TASK_ID)
    const published = countPublishes(session)
    expect(session.cancelQueuedMessage('missing')).toBe(false)
    expect(published()).toBe(0)
  })

  it('publishes nothing when cancelling a delivering message', async () => {
    const { session } = await openSession(
      'message-delivering',
      MESSAGE_DELIVERING_TASK_ID,
    )
    const published = countPublishes(session)
    expect(session.cancelQueuedMessage('a')).toBe(false)
    expect(published()).toBe(0)
  })

  it('publishes nothing while the task is not ready', async () => {
    const mock = createMockEngine('message-queued')
    const session = new TaskSession(
      createLoadTaskUseCase(mock.engine),
      createLoadTaskChangesUseCase(mock.engine),
      createLoadTaskEventsUseCase(mock.engine),
      createLoadMessagingCapabilityUseCase(mock.engine),
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
    session.openTask(MESSAGE_QUEUED_TASK_ID)
    expect(session.getState().load.kind).toBe('loading')
    const published = countPublishes(session)
    expect(session.cancelQueuedMessage('a')).toBe(false)
    expect(published()).toBe(0)
  })

  it('resets command outcomes when another task opens', async () => {
    const { session } = await openSession('message-queued', MESSAGE_QUEUED_TASK_ID)
    session.cancelQueuedMessage('a')
    session.openTask(MESSAGE_DELIVERING_TASK_ID)
    await settle()
    expect(session.getState().messagingChrome.outcome).toBeNull()
    expect(session.getState().messagingChrome.removedIds).toEqual([])
  })

  it('seeds outcomes and refusals only for the open, ready task', async () => {
    const { session } = await openSession('message-queued', MESSAGE_QUEUED_TASK_ID)
    const seed = {
      outcome: 'delivered' as const,
      refusals: [{ messageId: 'a', refusal: SEND_NOW_REFUSAL }],
    }
    const published = countPublishes(session)
    session.seedTaskMessagingChrome(MESSAGE_QUEUED_SETTLED_TASK_ID, seed)
    expect(published()).toBe(0)
    session.seedTaskMessagingChrome(MESSAGE_QUEUED_TASK_ID, seed)
    expect(session.getState().messagingChrome).toMatchObject({
      outcome: 'delivered',
      refusals: [{ messageId: 'a', refusal: SEND_NOW_REFUSAL }],
    })
  })
})

describe('TaskSession messaging capability', () => {
  it('observes the engine capability and keeps it across task switches', async () => {
    const { session } = await openSession(
      'message-unsupported',
      MESSAGE_QUEUED_TASK_ID,
    )
    const read = (): TaskScreenState['messagingCapability'] =>
      session.getState().messagingCapability
    expect(read()).toEqual({ kind: 'ready', supported: false })
    session.openTask(MESSAGE_DELIVERING_TASK_ID)
    expect(read()).toEqual({ kind: 'ready', supported: false })
  })

  it('follows a scenario change published by the engine', async () => {
    const { mock, session } = await openSession(
      'message-queued',
      MESSAGE_QUEUED_TASK_ID,
    )
    expect(session.getState().messagingCapability).toEqual({
      kind: 'ready',
      supported: true,
    })
    mock.setScenario('message-unsupported')
    expect(session.getState().messagingCapability).toEqual({
      kind: 'ready',
      supported: false,
    })
  })
})
