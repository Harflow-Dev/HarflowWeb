import { describe, expect, it } from 'vitest'
import { asTaskId } from '../../model'
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
    expect(load.observation.status).toBe('running')
    expect(load.observation.taskId).toBe(SLOT_RELEASE_TASK_ID)
    expect(load.observation.title).toBe('Fix flaky slot release test')
    expect(load.observation.statusBadge).toBe('Running 04:12')
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
    expect(load.observation.status).toBe('running')
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
    expect(load.observation.status).toBe('failed')
    expect(load.observation.taskId).toBe(EVENTS_READER_FAILED_TASK_ID)
    expect(load.observation.title).toBe('Migrate events.jsonl reader')
    expect(load.observation.statusBadge).toBe('Failed 07:48')
    expect(
      load.observation.transcript.rows.some((row) =>
        row.body.includes('Running tests…'),
      ),
    ).toBe(false)
    if (load.observation.status !== 'failed') return
    expect(load.observation.failure.title).toBe(
      'Task failed: the harness exited with code 1',
    )
    expect(load.observation.failure.lastError).toContain(
      'JSONDecodeError: Unterminated string',
    )
    expect(load.observation.followUpPlaceholder).toBe(
      'Tell the agent how to continue',
    )
  })

  it('maps the completed retry-budget specimen with summary evidence', () => {
    const load = taskLoadFor(RETRY_BUDGET_DONE_TASK_ID)
    expect(load.kind).toBe('ready')
    if (load.kind !== 'ready') return
    expect(load.observation.status).toBe('completed')
    expect(load.observation.taskId).toBe(RETRY_BUDGET_DONE_TASK_ID)
    expect(load.observation.title).toBe('Add retry budget to delivery queue')
    expect(load.observation.statusBadge).toBe('Done 21:04')
    expect(load.observation.headerMeta).toBe('Claude · Opus 5.5 · HarflowWeb')
    expect(load.observation.detailsPane).toBe('changes')
    if (load.observation.status !== 'completed') return
    expect(load.observation.summary).toBeDefined()
    expect(load.observation.summary?.heading).toBe('Summary')
    expect(load.observation.summary?.segments[0]?.kind).toBe('paragraph')
    expect(load.observation.followUpPlaceholder).toBe('Continue this task')
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
