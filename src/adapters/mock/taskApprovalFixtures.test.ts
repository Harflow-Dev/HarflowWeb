import { describe, expect, it } from 'vitest'
import { isAwaitingDecision } from '../../model'
// Load the fixture graph through its entry point (import cycles).
import './index'
import { TASK_APPROVAL_BY_ID } from './taskApprovalFixtures'

describe('task approval fixtures', () => {
  it.each([...TASK_APPROVAL_BY_ID.entries()])(
    '%s: awaiting count agrees with its ledger row',
    (_taskId, observation) => {
      const row = observation.approval
      expect(row).toBeDefined()
      expect(observation.approvalSummary?.awaitingDecisionCount).toBe(
        isAwaitingDecision(row!) ? 1 : 0,
      )
    },
  )

  it('only the exact and stale rows still await a decision', () => {
    const awaiting = [...TASK_APPROVAL_BY_ID.entries()]
      .filter(([, o]) => isAwaitingDecision(o.approval!))
      .map(([id]) => id)
    expect(awaiting.sort()).toEqual([
      'task-approval-exact',
      'task-approval-stale',
    ])
  })
})
