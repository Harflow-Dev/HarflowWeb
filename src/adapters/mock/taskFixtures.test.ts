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
  it('maps slot-release specimen text literally', () => {
    const load = taskLoadFor(SLOT_RELEASE_TASK_ID)
    expect(load.kind).toBe('ready')
    if (load.kind !== 'ready') return
    expect(load.observation.status).toBe('running')
    expect(load.observation.taskId).toBe(SLOT_RELEASE_TASK_ID)
    expect(load.observation.title).toBe('Fix flaky slot release test')
    expect(load.observation.statusBadge).toBe('Running 04:12')
    const user = load.observation.blocks.find((b) => b.kind === 'user')
    expect(user?.kind === 'user' && user.text).toContain(
      'without adding sleeps',
    )
    const pytest = load.observation.blocks.find((b) => b.id === 'tool-pytest')
    expect(pytest?.kind).toBe('tool')
    if (pytest?.kind === 'tool') {
      expect(pytest.initiallyExpanded).toBe(true)
      expect(pytest.bodyLines?.[0]?.text).toContain('FAILED')
      expect(pytest.bodyLines?.[0]?.boldPrefix).toBe('FAILED')
    }
    expect(load.observation.blocks.some((b) => b.kind === 'working')).toBe(
      true,
    )
  })

  it('keeps HTML-like preload text as plain fixture values', () => {
    const load = taskLoadFor(PRELOAD_TASK_ID)
    expect(load.kind).toBe('ready')
    if (load.kind !== 'ready') return
    expect(load.observation.status).toBe('running')
    const user = load.observation.blocks.find((b) => b.kind === 'user')
    expect(user?.kind === 'user' && user.text).toContain(
      '<script>alert("x")</script>',
    )
    const agent = load.observation.blocks.find((b) => b.kind === 'agent')
    expect(agent?.kind).toBe('agent')
    if (agent?.kind !== 'agent') return
    const segment = agent.segments[0]
    expect(segment?.kind).toBe('paragraph')
    if (segment?.kind !== 'paragraph') return
    expect(segment.runs.some((r) => r.value.includes('<img'))).toBe(true)
  })

  it('maps the failed events-reader specimen without running chrome fields', () => {
    const load = taskLoadFor(EVENTS_READER_FAILED_TASK_ID)
    expect(load.kind).toBe('ready')
    if (load.kind !== 'ready') return
    expect(load.observation.status).toBe('failed')
    expect(load.observation.taskId).toBe(EVENTS_READER_FAILED_TASK_ID)
    expect(load.observation.title).toBe('Migrate events.jsonl reader')
    expect(load.observation.statusBadge).toBe('Failed 07:48')
    expect(load.observation.blocks.some((b) => b.kind === 'working')).toBe(
      false,
    )
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
    expect(load.observation.blocks.some((b) => b.kind === 'working')).toBe(
      false,
    )
    if (load.observation.status !== 'completed') return
    expect(load.observation.summary.heading).toBe('Summary')
    expect(load.observation.summary.segments[0]?.kind).toBe('paragraph')
    expect(load.observation.followUpPlaceholder).toBe('Continue this task')
    const pytest = load.observation.blocks.find(
      (b) => b.id === 'tool-pytest-queue',
    )
    expect(pytest?.kind).toBe('tool')
    if (pytest?.kind === 'tool') {
      expect(pytest.bodyLines?.[1]?.text).toBe('11 passed in 2.04s')
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
