import { describe, expect, it } from 'vitest'
import { createMockEngine } from '../adapters/mock/mockEngine'
import {
  taskLoadFor,
  RETRY_BUDGET_DONE_TASK_ID,
  SLOT_RELEASE_TASK_ID,
} from '../adapters/mock/taskFixtures'
import { TASK_STATUS_SETTLING_ID } from '../adapters/mock/taskStatusFixtures'
import {
  createLoadTaskChangesUseCase,
  createLoadTaskEventsUseCase,
  createLoadTaskUseCase,
  type EnginePort,
} from '../application'
import type { TaskId, TaskLoad } from '../model'
import { TaskSession } from './taskSession'

const RUNNING = SLOT_RELEASE_TASK_ID
const COMPLETED = RETRY_BUDGET_DONE_TASK_ID
const SETTLING = TASK_STATUS_SETTLING_ID

/** Mock engine whose task loads are delivered by hand; events calls counted. */
function harness() {
  const base = createMockEngine().engine
  const callbacks = new Map<TaskId, (load: TaskLoad) => void>()
  let eventsCalls = 0
  const port: EnginePort = {
    ...base,
    observeTask(taskId, onUpdate) {
      callbacks.set(taskId, onUpdate)
      return { id: base.observeTask(taskId, () => undefined).id, cancel() {} }
    },
    observeTaskEvents(query, onUpdate) {
      eventsCalls += 1
      return base.observeTaskEvents(query, onUpdate)
    },
  }
  const session = new TaskSession(
    createLoadTaskUseCase(port),
    createLoadTaskChangesUseCase(port),
    createLoadTaskEventsUseCase(port),
  )
  session.start()
  return {
    session,
    eventsCalls: () => eventsCalls,
    deliver(taskId: TaskId) {
      callbacks.get(taskId)?.(taskLoadFor(taskId))
    },
    visit(taskId: TaskId) {
      session.openTask(taskId)
      callbacks.get(taskId)?.(taskLoadFor(taskId))
    },
  }
}

async function flush(): Promise<void> {
  for (let i = 0; i < 5; i += 1) await Promise.resolve()
}

describe('TaskSession first-open tab', () => {
  it('lands on Events when a running task is opened after load', () => {
    const h = harness()
    h.visit(RUNNING)
    h.session.setChangesPaneOpen(true)
    expect(h.session.getState().paneTab).toBe('events')
    expect(h.session.getState().paneOpenedOnce).toBe(true)
  })

  it('resolves to Events when the pane opens during load of a running task', () => {
    const h = harness()
    h.session.openTask(RUNNING)
    h.session.setChangesPaneOpen(true)
    expect(h.session.getState().paneOpenedOnce).toBe(false)
    h.deliver(RUNNING)
    expect(h.session.getState().paneTab).toBe('events')
    expect(h.session.getState().paneOpenedOnce).toBe(true)
  })

  it('lands on Changes for a completed task opened after load', () => {
    const h = harness()
    h.visit(COMPLETED)
    h.session.setChangesPaneOpen(true)
    expect(h.session.getState().paneTab).toBe('changes')
  })

  it('opens the pane by default for a settling task', () => {
    const h = harness()
    h.visit(SETTLING)
    expect(h.session.getState().changesPaneOpen).toBe(true)
  })

  it('keeps the chosen tab across close and reopen within a task', () => {
    const h = harness()
    h.visit(RUNNING)
    h.session.setChangesPaneOpen(true)
    h.session.setPaneTab('changes')
    h.session.setChangesPaneOpen(false)
    h.session.setChangesPaneOpen(true)
    expect(h.session.getState().paneTab).toBe('changes')
  })

  it('settles the default when the tab already shown is chosen explicitly', () => {
    const h = harness()
    h.visit(RUNNING)
    expect(h.session.getState().paneTab).toBe('changes')
    h.session.setPaneTab('changes')
    expect(h.session.getState().paneOpenedOnce).toBe(true)
    h.session.setChangesPaneOpen(true)
    expect(h.session.getState().paneTab).toBe('changes')
  })

  it('keeps an explicit tab pick on a running task instead of Events', () => {
    const h = harness()
    h.session.openTask(RUNNING)
    h.session.setPaneTab('changes') // pane closed, status unknown
    expect(h.session.getState().paneOpenedOnce).toBe(true)
    h.deliver(RUNNING)
    h.session.setChangesPaneOpen(true)
    expect(h.session.getState().paneTab).toBe('changes')
  })
})

describe('TaskSession per-task pane memory', () => {
  it('restores the open pane and tab when returning to a task', () => {
    const h = harness()
    h.visit(RUNNING)
    h.session.setChangesPaneOpen(true)
    h.session.setPaneTab('changes')
    h.visit(COMPLETED)
    // The completed task uses its own default (open on Changes), not RUNNING's.
    expect(h.session.getState().paneTab).toBe('changes')
    h.visit(RUNNING)
    expect(h.session.getState().changesPaneOpen).toBe(true)
    expect(h.session.getState().paneTab).toBe('changes')
  })

  it('does not auto-open a settling task the person closed', () => {
    const h = harness()
    h.visit(SETTLING)
    expect(h.session.getState().changesPaneOpen).toBe(true)
    h.session.setChangesPaneOpen(false)
    h.visit(COMPLETED)
    h.visit(SETTLING)
    expect(h.session.getState().changesPaneOpen).toBe(false)
  })
})

describe('TaskSession revealEventsFacts', () => {
  it('does not restart a loaded Events observation', async () => {
    const h = harness()
    h.visit(RUNNING)
    h.session.setChangesPaneOpen(true)
    await flush()
    const before = h.eventsCalls()
    expect(before).toBeGreaterThan(0)
    h.session.revealEventsFacts('notices')
    expect(h.eventsCalls()).toBe(before)
    expect(h.session.getState().eventsFactsReveal).toBe('notices')
  })

  it('begins an Events observation when none exists', () => {
    const h = harness()
    h.visit(RUNNING)
    expect(h.eventsCalls()).toBe(0)
    h.session.revealEventsFacts('enforcement')
    expect(h.eventsCalls()).toBe(1)
    expect(h.session.getState().paneTab).toBe('events')
    expect(h.session.getState().changesPaneOpen).toBe(true)
  })

  it('bumps the sequence on every reveal of the same group', () => {
    const h = harness()
    h.visit(RUNNING)
    h.session.revealEventsFacts('notices')
    h.session.revealEventsFacts('notices')
    h.session.revealEventsFacts('notices')
    expect(h.session.getState().eventsFactsRevealSeq).toBe(3)
  })
})
