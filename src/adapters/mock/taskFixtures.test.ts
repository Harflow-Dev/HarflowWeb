import { describe, expect, it } from 'vitest'
import { asTaskId, observedEngineStatus } from '../../model'
import { taskStatusView } from '../../presentation'
import { TASK_CHANGES_TURNS_ID } from './taskChangesFixtureIds'
import {
  EVENTS_READER_FAILED_TASK_ID,
  PRELOAD_TASK_ID,
  RETRY_BUDGET_DONE_TASK_ID,
  SLOT_RELEASE_TASK_ID,
  populatedTaskLoad,
  taskLoadFor,
} from './taskFixtures'

describe('taskFixtures', () => {
  it('maps slot-release specimen text on the transcript surface', () => {
    const load = taskLoadFor(SLOT_RELEASE_TASK_ID)
    expect(load.kind).toBe('ready')
    if (load.kind !== 'ready') return
    expect(observedEngineStatus(load.observation.statusRead)).toBe('running')
    expect(load.observation.taskId).toBe(SLOT_RELEASE_TASK_ID)
    expect(load.observation.title).toBe('Fix flaky slot release test')
    expect(taskStatusView(load.observation).badge.label).toBe('Running 04:12')
    expect(load.observation.transcript.assignmentText).toContain(
      'without adding sleeps',
    )
    const pytest = load.observation.transcript.rows.find(
      (row) => row.disclosure === 'tool-pytest',
    )
    expect(pytest?.toolBody).toContain('FAILED')
    expect(
      load.observation.transcript.rows.some((row) =>
        row.body.includes('Running tests…'),
      ),
    ).toBe(true)
  })

  it('keeps HTML-like preload text as plain fixture values', () => {
    const load = taskLoadFor(PRELOAD_TASK_ID)
    expect(load.kind).toBe('ready')
    if (load.kind !== 'ready') return
    expect(observedEngineStatus(load.observation.statusRead)).toBe('running')
    expect(load.observation.transcript.assignmentText).toContain(
      '<script>alert("x")</script>',
    )
    expect(
      load.observation.transcript.rows.some((row) =>
        row.body.includes('<img'),
      ),
    ).toBe(true)
  })

  it('maps the failed events-reader specimen without running chrome fields', () => {
    const load = taskLoadFor(EVENTS_READER_FAILED_TASK_ID)
    expect(load.kind).toBe('ready')
    if (load.kind !== 'ready') return
    expect(observedEngineStatus(load.observation.statusRead)).toBe('failed')
    expect(load.observation.taskId).toBe(EVENTS_READER_FAILED_TASK_ID)
    expect(load.observation.title).toBe('Migrate events.jsonl reader')
    expect(taskStatusView(load.observation).badge.label).toBe('Failed 07:48')
    expect(
      load.observation.transcript.rows.some((row) =>
        row.body.includes('Running tests…'),
      ),
    ).toBe(false)
    expect(load.observation.failure?.title).toBe(
      'Task failed: the harness exited with code 1',
    )
    expect(load.observation.failure?.lastError).toContain(
      'JSONDecodeError: Unterminated string',
    )
    expect(taskStatusView(load.observation).composer.stopMode).toBe('hidden')
  })

  it('maps the completed retry-budget specimen with summary evidence', () => {
    const load = taskLoadFor(RETRY_BUDGET_DONE_TASK_ID)
    expect(load.kind).toBe('ready')
    if (load.kind !== 'ready') return
    expect(observedEngineStatus(load.observation.statusRead)).toBe('completed')
    expect(load.observation.taskId).toBe(RETRY_BUDGET_DONE_TASK_ID)
    expect(load.observation.title).toBe('Add retry budget to delivery queue')
    expect(taskStatusView(load.observation).badge.label).toBe('Done 21:04')
    expect(load.observation.headerMeta).toBe('Claude · Opus 5.5 · HarflowWeb')
    expect(load.observation.detailsPane).toBe('changes')
    expect(load.observation.summary).toBeDefined()
    expect(load.observation.summary?.heading).toBe('Summary')
    expect(load.observation.summary?.segments[0]?.kind).toBe('paragraph')
    expect(taskStatusView(load.observation).composer.placeholder).toBe(
      'Queue a message…',
    )
  })

  it('maps every G-DIFF task id so openTask can load it', () => {
    const ids = [
      'task-changes-single',
      'task-changes-multi',
      'task-changes-multi-limited',
      'task-changes-same-path',
      'task-changes-row-states',
      'task-changes-incomplete',
      'task-changes-not-captured',
      'task-changes-unmerged',
      'task-changes-running',
      'task-changes-zero',
      'task-changes-no-repository',
      'task-changes-text',
      'task-changes-loading',
      'task-changes-error',
      TASK_CHANGES_TURNS_ID,
    ]
    for (const id of ids) {
      const load = taskLoadFor(asTaskId(id))
      expect(load.kind, id).toBe('ready')
      if (load.kind !== 'ready') continue
      expect(load.observation.detailsPane, id).toBe('changes')
    }
  })

  it('returns unavailable for unmapped synthetic launch ids', () => {
    const load = taskLoadFor(asTaskId('task-mock-accepted'))
    expect(load).toEqual({
      kind: 'unavailable',
      message: 'No mock transcript is mapped for task task-mock-accepted.',
    })
    expect(populatedTaskLoad().kind).toBe('ready')
  })
})