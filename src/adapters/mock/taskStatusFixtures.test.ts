import { describe, expect, it } from 'vitest'
import { taskStatusView } from '../../presentation'
import { TASK_NOTICES } from '../../presentation/taskStatusCopy'
import { taskLoadFor } from './taskFixtures'
import {
  TASK_STATUS_FIXTURE_IDS,
  TASK_STATUS_PENDING_ID,
  TASK_STATUS_RUNNING_STOP_ID,
  TASK_STATUS_STOP_REQUESTED_ID,
} from './taskStatusFixtures'

const EXPECTED_LABELS: Record<string, string> = {
  'task-slot-release': 'Running 04:12',
  'task-m05-stop-requested': 'Running 04:12',
  'task-m05-cancelled': 'Cancelled 04:31',
  'task-m05-timed-out': 'Timed out 12:40',
  'task-m05-settling': 'Done 21:04',
  'task-m05-unknown-failed': 'Failed · exit not observed',
  'task-m05-unknown-done': 'Done · exit not observed',
  'task-m05-owner-lost': 'Running · owner lost',
  'task-m05-unverified': 'Running · not verified',
  'task-m05-launch-unknown': 'Failed 07:48',
  'task-m05-status-unavailable': 'Status unavailable',
  'task-m05-pending': 'Pending',
  'task-m05-taken-over': 'Cancelled 04:31 · taken over',
  'task-m05-continue-starting': 'Failed 07:48',
  'task-m05-continue-started': 'Running 04:12',
  'task-events-reader-failed': 'Failed 07:48',
}

describe('taskStatusFixtures', () => {
  it('maps every M05 status fixture through taskLoadFor and taskStatusView', () => {
    expect(TASK_STATUS_FIXTURE_IDS).toHaveLength(16)
    for (const taskId of TASK_STATUS_FIXTURE_IDS) {
      const load = taskLoadFor(taskId)
      expect(load.kind, taskId).toBe('ready')
      if (load.kind !== 'ready') continue
      expect(load.observation.title).toBeTruthy()
      const label = EXPECTED_LABELS[taskId]
      expect(label, taskId).toBeDefined()
      expect(taskStatusView(load.observation).badge.label).toBe(label)
    }
  })

  it('uses the pending title from Design m05-proposal.js', () => {
    const load = taskLoadFor(TASK_STATUS_PENDING_ID)
    expect(load.kind).toBe('ready')
    if (load.kind !== 'ready') return
    expect(load.observation.title).toBe('Run the nightly dependency audit')
    expect(load.observation.transcript.rows).toHaveLength(0)
  })

  it('keeps running-stop id aligned with task-loading seed', () => {
    expect(TASK_STATUS_RUNNING_STOP_ID).toBe('task-slot-release')
    const load = taskLoadFor(TASK_STATUS_STOP_REQUESTED_ID)
    expect(load.kind).toBe('ready')
    if (load.kind !== 'ready') return
    expect(taskStatusView(load.observation, 'stop-requested').notice?.title).toBe(
      'Stop requested',
    )
    expect(taskStatusView(load.observation, 'continue-started').notice?.title).toBe(
      TASK_NOTICES.continued.title,
    )
  })
})