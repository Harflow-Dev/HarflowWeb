import { describe, expect, it } from 'vitest'
import { RETRY_BUDGET_DONE_TASK_ID, SLOT_RELEASE_TASK_ID } from './taskFixtures'
import {
  CONFIG_PY_PATH,
  QUEUE_PY_PATH,
  TEST_QUEUE_PATH,
  emptyDiffChangesLoad,
  retryBudgetChangesObservation,
  taskChangesLoadFor,
  unavailableDiffChangesLoad,
} from './taskChangesFixtures'

describe('taskChangesFixtures', () => {
  it('maps the completed retry-budget task to three recorded files', () => {
    const load = taskChangesLoadFor({
      taskId: RETRY_BUDGET_DONE_TASK_ID,
      selectedPath: null,
    })
    expect(load.kind).toBe('ready')
    if (load.kind !== 'ready') return
    expect(load.observation.taskId).toBe(RETRY_BUDGET_DONE_TASK_ID)
    expect(load.observation.files.map((f) => f.path)).toEqual([
      QUEUE_PY_PATH,
      CONFIG_PY_PATH,
      TEST_QUEUE_PATH,
    ])
    expect(load.observation.selectedPath).toBe(QUEUE_PY_PATH)
    expect(load.observation.files[0]).toEqual({
      path: QUEUE_PY_PATH,
      additions: 24,
      deletions: 3,
    })
    expect(load.observation.diff.kind).toBe('lines')
  })

  it('selects a distinct file identity and its diff text', () => {
    const load = taskChangesLoadFor({
      taskId: RETRY_BUDGET_DONE_TASK_ID,
      selectedPath: CONFIG_PY_PATH,
    })
    expect(load.kind).toBe('ready')
    if (load.kind !== 'ready') return
    expect(load.observation.selectedPath).toBe(CONFIG_PY_PATH)
    expect(load.observation.diff.kind).toBe('lines')
    if (load.observation.diff.kind !== 'lines') return
    const joined = load.observation.diff.lines.map((l) => l.text).join('\n')
    expect(joined).toContain("<script>alert('x')</script>")
    expect(joined).toContain('café')
    expect(joined).toContain('日本語')
  })

  it('keeps empty distinct from unavailable', () => {
    const empty = emptyDiffChangesLoad(RETRY_BUDGET_DONE_TASK_ID)
    expect(empty.kind).toBe('ready')
    if (empty.kind === 'ready') {
      expect(empty.observation.diff).toEqual({ kind: 'empty' })
    }
    const missing = unavailableDiffChangesLoad(RETRY_BUDGET_DONE_TASK_ID)
    expect(missing.kind).toBe('ready')
    if (missing.kind === 'ready') {
      expect(missing.observation.diff.kind).toBe('unavailable')
    }
    const unmapped = taskChangesLoadFor({
      taskId: SLOT_RELEASE_TASK_ID,
      selectedPath: null,
    })
    expect(unmapped.kind).toBe('unavailable')
  })

  it('exposes literal queue.py hunk text from the approved specimen', () => {
    const obs = retryBudgetChangesObservation(QUEUE_PY_PATH)
    expect(obs.diff.kind).toBe('lines')
    if (obs.diff.kind !== 'lines') return
    expect(obs.diff.lines[0]).toEqual({
      kind: 'hunk',
      text: '@@ -41,9 +41,18 @@ class DeliveryQueue',
    })
    expect(obs.diff.lines.some((l) => l.kind === 'del')).toBe(true)
    expect(obs.diff.lines.some((l) => l.kind === 'add')).toBe(true)
  })
})
