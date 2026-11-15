import { describe, expect, it } from 'vitest'
import { taskLoadFor } from '../adapters/mock/taskFixtures'
import { TASK_STATUS_FIXTURE_IDS } from '../adapters/mock/taskStatusFixtures'
import type { TaskObservation } from '../model'
import {
  defaultPaneOpen,
  firstOpenPaneTab,
  paneLayoutMode,
} from './taskPaneDefaults'

function observationFor(taskId: string): TaskObservation {
  const load = taskLoadFor(taskId)
  expect(load.kind).toBe('ready')
  if (load.kind !== 'ready') throw new Error('expected ready')
  return load.observation
}

/** Expected defaults matching Design 40b8a19 status / adaptive drawings. */
const EXPECTED_OPEN: Readonly<Record<string, boolean>> = {
  'task-slot-release': false,
  'task-m05-stop-requested': false,
  'task-m05-cancelled': false,
  'task-m05-timed-out': false,
  'task-m05-settling': true,
  'task-m05-unknown-failed': false,
  'task-m05-unknown-done': false,
  'task-m05-owner-lost': false,
  'task-m05-unverified': false,
  'task-m05-launch-unknown': false,
  'task-m05-status-unavailable': false,
  'task-m05-pending': false,
  'task-m05-taken-over': false,
  'task-m05-continue-starting': false,
  'task-m05-continue-started': false,
  'task-events-reader-failed': false,
}

describe('defaultPaneOpen', () => {
  it('covers every status fixture', () => {
    for (const id of TASK_STATUS_FIXTURE_IDS) {
      const observation = observationFor(id)
      expect(defaultPaneOpen(observation), id).toBe(EXPECTED_OPEN[id])
    }
  })

  it('keeps completed without settling closed so seeds own task-done', () => {
    const done = observationFor('task-retry-budget-done')
    expect(defaultPaneOpen(done)).toBe(false)
  })
})

describe('firstOpenPaneTab', () => {
  it('lands on Events for running and pending', () => {
    expect(firstOpenPaneTab(observationFor('task-slot-release'))).toBe('events')
    expect(firstOpenPaneTab(observationFor('task-m05-pending'))).toBe('events')
  })

  it('lands on Changes for settled and failed', () => {
    expect(firstOpenPaneTab(observationFor('task-retry-budget-done'))).toBe(
      'changes',
    )
    expect(
      firstOpenPaneTab(observationFor('task-events-reader-failed')),
    ).toBe('changes')
  })
})

describe('paneLayoutMode', () => {
  it('splits at or above 900 detail points and overlays below', () => {
    expect(paneLayoutMode(900)).toBe('split')
    expect(paneLayoutMode(1016)).toBe('split')
    expect(paneLayoutMode(899)).toBe('overlay')
    expect(paneLayoutMode(736)).toBe('overlay')
  })
})
