import { describe, expect, it } from 'vitest'
import { asTaskId } from '../../model'
import {
  PRELOAD_TASK_ID,
  SLOT_RELEASE_TASK_ID,
  populatedTaskLoad,
  taskLoadFor,
} from './taskFixtures'

describe('taskFixtures', () => {
  it('maps slot-release specimen text literally', () => {
    const load = taskLoadFor(SLOT_RELEASE_TASK_ID)
    expect(load.kind).toBe('ready')
    if (load.kind !== 'ready') return
    expect(load.observation.taskId).toBe(SLOT_RELEASE_TASK_ID)
    expect(load.observation.title).toBe('Fix flaky slot release test')
    expect(load.observation.runningBadge).toBe('Running 04:12')
    const user = load.observation.blocks.find((b) => b.kind === 'user')
    expect(user?.kind === 'user' && user.text).toContain(
      'without adding sleeps',
    )
    const pytest = load.observation.blocks.find((b) => b.id === 'tool-pytest')
    expect(pytest?.kind).toBe('tool')
    if (pytest?.kind === 'tool') {
      expect(pytest.initiallyExpanded).toBe(true)
      expect(pytest.bodyLines?.[0]?.text).toContain('FAILED')
      expect(pytest.bodyLines?.[0]?.failedLead).toBe(true)
    }
  })

  it('keeps HTML-like preload text as plain fixture values', () => {
    const load = taskLoadFor(PRELOAD_TASK_ID)
    expect(load.kind).toBe('ready')
    if (load.kind !== 'ready') return
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

  it('returns unavailable for unmapped synthetic launch ids', () => {
    const load = taskLoadFor(asTaskId('task-mock-accepted'))
    expect(load).toEqual({
      kind: 'unavailable',
      message: 'No mock transcript is mapped for task task-mock-accepted.',
    })
    expect(populatedTaskLoad().kind).toBe('ready')
  })
})
