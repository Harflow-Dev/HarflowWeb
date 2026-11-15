import { describe, expect, it } from 'vitest'
import { RETRY_BUDGET_DONE_TASK_ID, SLOT_RELEASE_TASK_ID } from './taskFixtures'
import {
  CONFIG_ENTRY,
  CONFIG_PY_PATH,
  QUEUE_ENTRY,
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
      selectedEntry: null,
      turnTaskId: null,
    })
    expect(load.kind).toBe('ready')
    if (load.kind !== 'ready') return
    expect(load.observation.taskId).toBe(RETRY_BUDGET_DONE_TASK_ID)
    const rows =
      load.observation.repositories[0]?.scopes.committed_range?.rows ?? []
    expect(rows.map((row) => row.path)).toEqual([
      QUEUE_PY_PATH,
      CONFIG_PY_PATH,
      TEST_QUEUE_PATH,
    ])
    expect(load.observation.selectedEntry).toEqual(QUEUE_ENTRY)
    expect(rows[0]).toMatchObject({
      path: QUEUE_PY_PATH,
      additions: 24,
      deletions: 3,
    })
    expect(load.observation.text?.lines.length).toBeGreaterThan(0)
  })

  it('selects a distinct file identity and its diff text', () => {
    const load = taskChangesLoadFor({
      taskId: RETRY_BUDGET_DONE_TASK_ID,
      selectedEntry: CONFIG_ENTRY,
      turnTaskId: null,
    })
    expect(load.kind).toBe('ready')
    if (load.kind !== 'ready') return
    expect(load.observation.selectedEntry).toEqual(CONFIG_ENTRY)
    expect(load.observation.text).not.toBeNull()
    if (load.observation.text === null) return
    const joined = load.observation.text.lines.map((l) => l.text).join('\n')
    expect(joined).toContain("<script>alert('x')</script>")
    expect(joined).toContain('café')
    expect(joined).toContain('日本語')
  })

  it('keeps empty distinct from unavailable', () => {
    const empty = emptyDiffChangesLoad(RETRY_BUDGET_DONE_TASK_ID)
    expect(empty.kind).toBe('ready')
    if (empty.kind === 'ready') {
      expect(empty.observation.text?.lines).toEqual([])
      expect(empty.observation.text?.refusal).toBeNull()
    }
    const missing = unavailableDiffChangesLoad(RETRY_BUDGET_DONE_TASK_ID)
    expect(missing.kind).toBe('ready')
    if (missing.kind === 'ready') {
      expect(missing.observation.text?.refusal?.code).toBe(
        'changes_entry_not_found',
      )
    }
    const unmapped = taskChangesLoadFor({
      taskId: SLOT_RELEASE_TASK_ID,
      selectedEntry: null,
      turnTaskId: null,
    })
    expect(unmapped.kind).toBe('unavailable')
  })

  it('exposes literal queue.py hunk text from the approved specimen', () => {
    const obs = retryBudgetChangesObservation(QUEUE_ENTRY)
    expect(obs.text).not.toBeNull()
    if (obs.text === null) return
    expect(obs.text.lines[0]).toEqual({
      kind: 'hunk',
      text: '@@ -41,9 +41,18 @@ class DeliveryQueue',
    })
    expect(obs.text.lines.some((l) => l.kind === 'del')).toBe(true)
    expect(obs.text.lines.some((l) => l.kind === 'add')).toBe(true)
  })
})
