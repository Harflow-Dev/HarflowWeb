import { describe, expect, it } from 'vitest'
import type {
  ApprovalRespondRefusal,
  TaskApprovalRequest,
} from '../model'
import { APPROVAL_COPY } from './taskApprovalCopy'
import { taskApprovalCardView } from './taskApprovalCardView'

const PENDING: TaskApprovalRequest = {
  requestId: '00000000000000000000000000000001',
  ownerRevision: 1,
  actionDigest: 'digest',
  disposition: 'pending',
  delivery: 'pending',
  decision: null,
  effectiveDecision: null,
  deliveredDecision: null,
  expiryRejection: false,
  executionOutcome: 'unknown',
  scope: 'exact_action_once',
  toolName: 'Bash',
  action: 'pytest tests/test_slots.py -k release --count 50',
  cwd: '~/Code/Harflow/HarflowMCP',
  decisionReason:
    'confirm the race no longer reproduces over 50 runs, up from 20 before the fix.',
}

const EXPIRED: TaskApprovalRequest = {
  ...PENDING,
  requestId: '00000000000000000000000000000014',
  ownerRevision: 4,
  disposition: 'expired',
  delivery: 'sent',
  decision: 'approve',
  decidedBy: 'caller',
  responder: 'caller',
  decidedAt: 1792000022,
  effectiveDecision: 'reject',
  deliveredDecision: 'reject',
  expiryRejection: true,
}

const UNCERTAIN: TaskApprovalRequest = {
  ...PENDING,
  requestId: '0000000000000000000000000000000b',
  ownerRevision: 4,
  disposition: 'decided',
  delivery: 'delivery_unknown',
  decision: 'approve',
  decidedBy: 'caller',
  responder: 'monitor',
  decidedAt: 1792000011,
  effectiveDecision: 'approve',
  deliveredDecision: null,
}

describe('taskApprovalCardView', () => {
  it('exact: pending row offers Approve once and Reject', () => {
    const view = taskApprovalCardView(PENDING, null)
    expect(view.settled).toBe(false)
    expect(view.actionLabel).toBe(APPROVAL_COPY.runCommand)
    expect(view.source).toBe(APPROVAL_COPY.sourceBash)
    expect(view.command).toBe(PENDING.action)
    expect(view.cwdMeta).toBe('in ~/Code/Harflow/HarflowMCP')
    expect(view.reasonLine).toContain('Reason:')
    expect(view.mode).toEqual({ kind: 'decide', disabled: false })
  })

  it('disables decide buttons while submitting', () => {
    expect(taskApprovalCardView(PENDING, null, true).mode).toEqual({
      kind: 'decide',
      disabled: true,
    })
  })

  it('stale: not_current refusal → COPY.notCurrent + Refresh', () => {
    const refusal: ApprovalRespondRefusal = { reason: 'not_current' }
    const view = taskApprovalCardView(PENDING, refusal)
    expect(view.settled).toBe(true)
    expect(view.mode).toEqual({
      kind: 'result',
      title: null,
      lines: [APPROVAL_COPY.notCurrent],
      refresh: true,
    })
  })

  it('expired: DECIDED.expiredOverride lines from ledger facts', () => {
    const view = taskApprovalCardView(EXPIRED, null)
    expect(view.mode.kind).toBe('result')
    if (view.mode.kind !== 'result') return
    expect(view.mode.title).toBe(APPROVAL_COPY.expired)
    expect(view.mode.lines).toEqual([
      `${APPROVAL_COPY.byCaller} · Oct 14, 2026, 5:47 PM`,
      'Recorded decision: approve',
      'Effective decision: reject',
      'Delivered decision: reject',
      APPROVAL_COPY.rejectionSent,
      'Delivery: sent',
      'Observed execution: unknown',
      APPROVAL_COPY.recovery,
    ])
  })

  it('answered-elsewhere: already_answered with monitor interaction', () => {
    const refusal: ApprovalRespondRefusal = {
      reason: 'already_answered',
      interaction: {
        answeredBy: 'monitor',
        answer: 'approve',
        answeredAt: 1792000005,
      },
    }
    const view = taskApprovalCardView(PENDING, refusal)
    expect(view.mode).toEqual({
      kind: 'result',
      title: `${APPROVAL_COPY.byMonitor} · approve`,
      lines: ['Oct 14, 2026, 5:46 PM', APPROVAL_COPY.alreadyAnswered],
      refresh: false,
    })
  })

  it('refused: settled refusal → COPY.settled only', () => {
    const view = taskApprovalCardView(PENDING, { reason: 'settled' })
    expect(view.mode).toEqual({
      kind: 'result',
      title: null,
      lines: [APPROVAL_COPY.settled],
      refresh: false,
    })
  })

  it('uncertain: DECIDED.uncertain lines from delivery_unknown row', () => {
    const view = taskApprovalCardView(UNCERTAIN, null)
    expect(view.mode.kind).toBe('result')
    if (view.mode.kind !== 'result') return
    expect(view.mode.title).toBe(APPROVAL_COPY.unknown)
    expect(view.mode.lines).toEqual([
      `${APPROVAL_COPY.byMonitor} · Oct 14, 2026, 5:46 PM`,
      'Recorded decision: approve',
      'Delivery: delivery_unknown',
      'Observed execution: unknown',
    ])
  })

  it('unknown refusal reason → non-actionable refresh-only', () => {
    const view = taskApprovalCardView(PENDING, { reason: 'something_new' })
    expect(view.mode).toEqual({
      kind: 'result',
      title: null,
      lines: [APPROVAL_COPY.notCurrent],
      refresh: true,
    })
  })

  it('missing refusal reason → non-actionable refresh-only', () => {
    const view = taskApprovalCardView(PENDING, {})
    expect(view.mode).toEqual({
      kind: 'result',
      title: null,
      lines: [APPROVAL_COPY.notCurrent],
      refresh: true,
    })
  })
})
