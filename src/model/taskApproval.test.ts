import { describe, expect, it } from 'vitest'
import { isAwaitingDecision, type TaskApprovalRequest } from './taskApproval'

const AWAITING: TaskApprovalRequest = {
  requestId: 'r',
  ownerRevision: 1,
  actionDigest: 'd',
  disposition: 'pending',
  delivery: 'pending',
  decision: null,
  effectiveDecision: null,
  deliveredDecision: null,
  expiryRejection: false,
  executionOutcome: 'unknown',
  scope: 'exact_action_once',
  toolName: 'Bash',
  action: 'echo',
  cwd: '/',
  decisionReason: null,
}

describe('isAwaitingDecision', () => {
  it('is true for a pending, undecided row', () => {
    expect(isAwaitingDecision(AWAITING)).toBe(true)
  })

  it.each([
    ['decided', { disposition: 'decided' as const }],
    ['expired', { disposition: 'expired' as const }],
    ['cancelled', { disposition: 'cancelled' as const }],
    ['reserved delivery', { delivery: 'reserved' as const }],
    ['sending delivery', { delivery: 'sending' as const }],
    ['sent delivery', { delivery: 'sent' as const }],
    ['a human decision', { decision: 'approve' as const }],
    ['an expiry rejection', { expiryRejection: true }],
    ['a system decision', { decidedBy: 'harflow' as const }],
  ])('is false for %s', (_name, patch) => {
    expect(isAwaitingDecision({ ...AWAITING, ...patch })).toBe(false)
  })
})
