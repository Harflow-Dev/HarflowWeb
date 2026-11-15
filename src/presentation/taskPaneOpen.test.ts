import { describe, expect, it } from 'vitest'
import { taskLoadFor } from '../adapters/mock/taskFixtures'
import { TASK_STATUS_SETTLING_ID } from '../adapters/mock/taskStatusFixtures'
import type { TaskLoad } from '../model'
import { paneLayoutMode } from './taskPaneDefaults'
import {
  afterTaskLoad,
  paneTabForOpen,
  revealEventsFactsState,
} from './taskSessionPaneOpen'
import { initialTaskState, type TaskScreenState } from './taskState'

const RUNNING = 'task-slot-release'
const COMPLETED = 'task-retry-budget-done'
const FAILED = 'task-events-reader-failed'
const PENDING = 'task-m05-pending'

function readyLoad(taskId: string): TaskLoad {
  const load = taskLoadFor(taskId)
  expect(load.kind).toBe('ready')
  return load
}

function stateWith(partial: Partial<TaskScreenState>): TaskScreenState {
  return { ...initialTaskState(), ...partial }
}

describe('paneTabForOpen', () => {
  it('returns a decided tab as is, whatever the status', () => {
    const state = stateWith({
      paneOpenedOnce: true,
      paneTab: 'changes',
      load: readyLoad(RUNNING),
    })
    expect(paneTabForOpen(state)).toBe('changes')
    expect(paneTabForOpen({ ...state, paneTab: 'events' })).toBe('events')
  })

  it('keeps the provisional tab while undecided and not ready', () => {
    expect(paneTabForOpen(stateWith({ paneTab: 'changes' }))).toBe('changes')
    expect(
      paneTabForOpen(
        stateWith({ paneTab: 'events', load: { kind: 'unavailable', message: 'x' } }),
      ),
    ).toBe('events')
  })

  it('lands on Events for an undecided running or pending task', () => {
    for (const id of [RUNNING, PENDING]) {
      expect(paneTabForOpen(stateWith({ load: readyLoad(id) }))).toBe('events')
    }
  })

  it('lands on Changes for an undecided completed or failed task', () => {
    for (const id of [COMPLETED, FAILED]) {
      expect(paneTabForOpen(stateWith({ load: readyLoad(id) }))).toBe('changes')
    }
  })
})

describe('afterTaskLoad pane resolution', () => {
  function openedDuringLoad(): TaskScreenState {
    return stateWith({ changesPaneOpen: true, paneOpenedOnce: false })
  }

  it('resolves a pane opened during load to Events for a running task', () => {
    const { next } = afterTaskLoad(openedDuringLoad(), readyLoad(RUNNING))
    expect(next.paneTab).toBe('events')
    expect(next.paneOpenedOnce).toBe(true)
  })

  it('resolves a pane opened during load to Changes for a completed task', () => {
    const { next } = afterTaskLoad(
      { ...openedDuringLoad(), paneTab: 'events' },
      readyLoad(COMPLETED),
    )
    expect(next.paneTab).toBe('changes')
    expect(next.paneOpenedOnce).toBe(true)
  })

  it('leaves a closed pane undecided when the load arrives', () => {
    const { next } = afterTaskLoad(stateWith({}), readyLoad(RUNNING))
    expect(next.paneOpenedOnce).toBe(false)
    expect(next.paneTab).toBe('changes')
  })

  it('does not override a decided tab', () => {
    const state = stateWith({
      changesPaneOpen: true,
      paneOpenedOnce: true,
      paneTab: 'changes',
    })
    expect(afterTaskLoad(state, readyLoad(RUNNING)).next.paneTab).toBe('changes')
  })

  it('does not resolve on a non-ready load', () => {
    const { next } = afterTaskLoad(openedDuringLoad(), {
      kind: 'unavailable',
      message: 'gone',
    })
    expect(next.paneOpenedOnce).toBe(false)
  })
})

describe('afterTaskLoad openPane', () => {
  it('opens only for a settling task going from loading to ready', () => {
    expect(afterTaskLoad(stateWith({}), readyLoad(TASK_STATUS_SETTLING_ID)).openPane).toBe(true)
  })

  it('stays false for plain running, failed and completed tasks', () => {
    for (const id of [RUNNING, FAILED, COMPLETED]) {
      expect(afterTaskLoad(stateWith({}), readyLoad(id)).openPane, id).toBe(false)
    }
  })

  it('stays false when the pane is already open or the task was not loading', () => {
    const settling = readyLoad(TASK_STATUS_SETTLING_ID)
    expect(afterTaskLoad(stateWith({ changesPaneOpen: true }), settling).openPane).toBe(false)
    expect(afterTaskLoad(stateWith({ load: readyLoad(RUNNING) }), settling).openPane).toBe(false)
  })
})

describe('revealEventsFactsState', () => {
  it('opens a closed pane on Events and records the reveal', () => {
    const result = revealEventsFactsState(stateWith({}), 'notices')
    expect(result.next.changesPaneOpen).toBe(true)
    expect(result.next.paneTab).toBe('events')
    expect(result.next.paneOpenedOnce).toBe(true)
    expect(result.next.eventsFactsReveal).toBe('notices')
    expect(result.next.eventsFactsRevealSeq).toBe(1)
    expect(result.beginEventsOnly).toBe(false)
  })

  it('switches an open Changes pane to Events and restarts Events only', () => {
    const state = stateWith({ changesPaneOpen: true, paneTab: 'changes', paneOpenedOnce: true })
    const result = revealEventsFactsState(state, 'enforcement')
    expect(result.next.paneTab).toBe('events')
    expect(result.beginEventsOnly).toBe(true)
    expect(result.next.eventsFactsReveal).toBe('enforcement')
  })

  it('keeps an open Events pane in place but still bumps the sequence', () => {
    const state = stateWith({
      changesPaneOpen: true,
      paneTab: 'events',
      paneOpenedOnce: true,
      eventsFactsRevealSeq: 4,
    })
    const result = revealEventsFactsState(state, 'continuity')
    expect(result.next.paneTab).toBe('events')
    expect(result.beginEventsOnly).toBe(false)
    expect(result.next.eventsFactsRevealSeq).toBe(5)
  })
})

describe('paneLayoutMode threshold', () => {
  it('overlays at 899 and splits at 900', () => {
    expect(paneLayoutMode(899)).toBe('overlay')
    expect(paneLayoutMode(900)).toBe('split')
  })

  it('documents the sidebar arithmetic the caller applies to a 1000-wide frame', () => {
    const frame = 1000
    expect(paneLayoutMode(frame - 56)).toBe('split') // 56 rail -> 944
    expect(paneLayoutMode(frame - 264)).toBe('overlay') // 264 sidebar -> 736
  })
})
