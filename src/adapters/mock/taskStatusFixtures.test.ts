import { describe, expect, it } from 'vitest'
import { taskStatusView } from '../../presentation'
import { TASK_NOTICES } from '../../presentation/taskStatusCopy'
import { taskLoadFor } from './taskFixtures'
import {
  TASK_STATUS_CONTINUE_STARTED_ID,
  TASK_STATUS_FIXTURE_IDS,
  TASK_STATUS_PENDING_ID,
  TASK_STATUS_RUNNING_STOP_ID,
  TASK_STATUS_STOP_REQUESTED_ID,
  TASK_STATUS_TIMED_OUT_ID,
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

  it('maps every M05 fixture to an approved notice or banner title when present', () => {
    const chromeByFixture: Record<
      string,
      'stop-requested' | 'continue-starting' | 'continue-started' | 'continue-unknown' | null
    > = {
      'task-m05-launch-unknown': 'continue-unknown',
      'task-m05-stop-requested': 'stop-requested',
      'task-m05-continue-starting': 'continue-starting',
      'task-m05-continue-started': 'continue-started',
    }
  const titles: Record<string, { notice: string | null; banner: string | null }> = {
      'task-slot-release': { notice: null, banner: null },
      'task-m05-stop-requested': { notice: 'Stop requested', banner: null },
      'task-m05-cancelled': { notice: null, banner: 'Cancelled' },
      'task-m05-timed-out': { notice: null, banner: 'This run stopped at its turn limit' },
      'task-m05-settling': { notice: 'Settling', banner: null },
      'task-m05-unknown-failed': {
        notice: null,
        banner: 'Outcome inferred, not observed',
      },
      'task-m05-unknown-done': { notice: 'Reconstructed outcome', banner: null },
      'task-m05-owner-lost': {
        notice: null,
        banner: 'The process watching this run is gone',
      },
      'task-m05-unverified': {
        notice: null,
        banner: "Harflow can't confirm this run",
      },
      'task-m05-launch-unknown': {
        notice: null,
        banner: 'A new session may have started',
      },
      'task-m05-status-unavailable': {
        notice: 'Current status unavailable',
        banner: null,
      },
      'task-m05-pending': { notice: null, banner: null },
      'task-m05-taken-over': { notice: null, banner: null },
      'task-m05-continue-starting': {
        notice: null,
        banner: 'Task failed: the harness exited with code 1',
      },
      'task-m05-continue-started': {
        notice: 'New session accepted',
        banner: null,
      },
      'task-events-reader-failed': {
        notice: null,
        banner: 'Task failed: the harness exited with code 1',
      },
    }
    for (const taskId of TASK_STATUS_FIXTURE_IDS) {
      const load = taskLoadFor(taskId)
      expect(load.kind, taskId).toBe('ready')
      if (load.kind !== 'ready') continue
      const chrome = chromeByFixture[taskId] ?? null
      const view = taskStatusView(load.observation, chrome)
      const expected = titles[taskId]
      expect(expected, taskId).toBeDefined()
      expect(view.notice?.title ?? null).toBe(expected!.notice)
      expect(view.banner?.title ?? null).toBe(expected!.banner)
    }
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

  it('gives every fixture except pending a conversation and pending a launch wait', () => {
    for (const taskId of TASK_STATUS_FIXTURE_IDS) {
      const load = taskLoadFor(taskId)
      if (load.kind !== 'ready') throw new Error(taskId)
      const { observation } = load
      if (taskId === TASK_STATUS_PENDING_ID) {
        expect(observation.conversation, taskId).toBeUndefined()
        expect(observation.launchWait).toBe('resources')
      } else {
        expect(observation.conversation?.request, taskId).toBeTruthy()
        expect(observation.conversation?.items.length, taskId).toBeGreaterThan(0)
        expect(observation.launchWait, taskId).toBeUndefined()
      }
    }
  })

  it('builds timed-out on the failed task with no failure explanation', () => {
    const load = taskLoadFor(TASK_STATUS_TIMED_OUT_ID)
    if (load.kind !== 'ready') throw new Error('timed-out not ready')
    const { observation } = load
    expect(observation.title).toBe('Migrate events.jsonl reader')
    expect(observation.headerMeta).toBe('Claude · Opus 5.5 · HarflowMCP')
    expect(observation.failure).toBeUndefined()
    expect(taskStatusView(observation).badge.label).toBe('Timed out 12:40')
    expect(observation.conversation?.items[1]).toMatchObject({
      kind: 'tool',
      summary: [{ kind: 'text', value: 'Read 5 files' }],
    })
  })

  it('carries two turns on continue-started only', () => {
    for (const taskId of TASK_STATUS_FIXTURE_IDS) {
      const load = taskLoadFor(taskId)
      if (load.kind !== 'ready') throw new Error(taskId)
      expect(load.observation.turnCount, taskId).toBe(
        taskId === TASK_STATUS_CONTINUE_STARTED_ID ? 2 : undefined,
      )
    }
  })
})
