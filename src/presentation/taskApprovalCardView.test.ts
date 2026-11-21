import { describe, expect, it } from 'vitest'
import type { TaskApprovalRequest } from '../model'
import {
  approvalEntryFor,
  refusalEntry,
  type TaskApprovalEntry,
} from './taskApprovalChrome'
import { APPROVAL_COPY, APPROVAL_MAC_COPY } from './taskApprovalCopy'
import { taskApprovalCardView } from './taskApprovalCardView'

const ID = '00000000000000000000000000000001'

function refusal(reason?: string, rest = {}): TaskApprovalEntry {
  return refusalEntry('t1', ID, 1, {
    ...(reason === undefined ? {} : { reason }),
    ...rest,
  })
}

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
    expect(view.showSource).toBe(true)
  })

  it('disables decide buttons while submitting', () => {
    expect(taskApprovalCardView(PENDING, null, true).mode).toEqual({
      kind: 'decide',
      disabled: true,
    })
  })

  it('stale: not_current refusal → COPY.notCurrent + Refresh', () => {
    const view = taskApprovalCardView(PENDING, refusal('not_current'))
    expect(view.settled).toBe(true)
    expect(view.mode).toEqual({
      kind: 'result',
      title: null,
      lines: [APPROVAL_COPY.notCurrent],
      refresh: true,
      refreshDisabled: false,
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
    const entry = refusal('already_answered', {
      interaction: {
        answeredBy: 'monitor',
        answer: 'approve',
        answeredAt: 1792000005,
      },
    })
    const view = taskApprovalCardView(PENDING, entry)
    expect(view.mode).toEqual({
      kind: 'result',
      title: `${APPROVAL_COPY.byMonitor} · approve`,
      lines: ['Oct 14, 2026, 5:46 PM', APPROVAL_COPY.alreadyAnswered],
      refresh: false,
      refreshDisabled: false,
    })
  })

  it('answered-elsewhere: already_answered with caller interaction uses raceCaller', () => {
    const entry = refusal('already_answered', {
      interaction: {
        answeredBy: 'caller',
        answer: 'approve',
        answeredAt: 1792000005,
      },
    })
    const view = taskApprovalCardView(PENDING, entry)
    expect(view.mode).toEqual({
      kind: 'result',
      title: APPROVAL_COPY.raceCaller,
      lines: ['Oct 14, 2026, 5:46 PM', 'Recorded decision: approve'],
      refresh: false,
      refreshDisabled: false,
    })
  })

  it('refused: settled refusal → COPY.settled only', () => {
    const view = taskApprovalCardView(PENDING, refusal('settled'))
    expect(view.mode).toEqual({
      kind: 'result',
      title: null,
      lines: [APPROVAL_COPY.settled],
      refresh: false,
      refreshDisabled: false,
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

  it.each([
    ['unknown reason', 'something_new'],
    ['missing reason', undefined],
  ])('%s → untyped non-actionable line + Refresh', (_name, reason) => {
    const view = taskApprovalCardView(PENDING, refusal(reason))
    expect(view.mode).toEqual({
      kind: 'result',
      title: null,
      lines: [APPROVAL_MAC_COPY.unconfirmed],
      refresh: true,
      refreshDisabled: false,
    })
  })

  it('non-actionable entry applies only at its owner revision', () => {
    const entry = refusalEntry('t1', ID, 1, {})
    const chrome = { entries: [entry], submitting: false, focusResultSeq: 0 }
    expect(approvalEntryFor(chrome, 't1', PENDING)).toEqual(entry)
    expect(approvalEntryFor(chrome, 't1', { ...PENDING, ownerRevision: 2 })).toBeNull()
    expect(
      approvalEntryFor(chrome, 't1', { ...PENDING, requestId: 'other' }),
    ).toBeNull()
    expect(approvalEntryFor(chrome, 't2', PENDING)).toBeNull()
  })

  it('disables Refresh while submitting', () => {
    const view = taskApprovalCardView(PENDING, refusal('not_current'), true)
    expect(view.mode).toMatchObject({ refresh: true, refreshDisabled: true })
  })

  it.each([
    ['expired', APPROVAL_MAC_COPY.expired, false],
    ['ownership_lost', APPROVAL_MAC_COPY.ownershipLost, true],
    ['unauthorized', APPROVAL_MAC_COPY.unauthorized, true],
    ['unsupported', APPROVAL_MAC_COPY.unsupported, true],
    ['caller_undecidable', APPROVAL_MAC_COPY.callerUndecidable, true],
    ['incomplete', APPROVAL_MAC_COPY.incomplete, true],
  ])('%s refusal uses the Mac line', (reason, line, refresh) => {
    const view = taskApprovalCardView(PENDING, refusal(reason))
    expect(view.mode).toMatchObject({ title: null, lines: [line], refresh })
  })

  it('ownership_lost does not claim the ledger is unchanged', () => {
    expect(APPROVAL_MAC_COPY.ownershipLost).not.toMatch(/did not change/i)
    expect(APPROVAL_MAC_COPY.ownershipLost).not.toMatch(/was not changed/i)
  })

  it('Mac lines are verbatim', () => {
    expect(APPROVAL_MAC_COPY.expired).toBe(
      "The request's deadline has passed. This response did not change it.",
    )
    expect(APPROVAL_MAC_COPY.unconfirmed).toBe(
      'The result could not be confirmed. This request is read-only here and your answer will not be retried.',
    )
  })

  describe('session answer and ledger facts', () => {
    const RESERVED: TaskApprovalRequest = {
      ...PENDING,
      ownerRevision: 2,
      decision: 'approve',
      decidedBy: 'caller',
      responder: 'monitor',
      decidedAt: 1792000011,
      delivery: 'reserved',
    }

    it('own approve → Approved by you with a check head, no lines', () => {
      const view = taskApprovalCardView(RESERVED, {
        kind: 'answered',
        taskId: 't1',
        requestId: ID,
        decision: 'approve',
      })
      expect(view).toMatchObject({
        settled: true,
        actionLabel: APPROVAL_COPY.approvedByYou,
        headIcon: 'check',
        showSource: false,
      })
      expect(view.mode).toMatchObject({ lines: [], refresh: false })
    })

    it('own answer shows facts when the effective decision differs', () => {
      const view = taskApprovalCardView(
        {
          ...RESERVED,
          disposition: 'decided',
          delivery: 'sent',
          effectiveDecision: 'reject',
          deliveredDecision: 'reject',
        },
        { kind: 'answered', taskId: 't1', requestId: ID, decision: 'approve' },
      )
      expect(view.actionLabel).toBe(APPROVAL_COPY.approvedByYou)
      expect(view.mode).toMatchObject({
        lines: [
          'Recorded decision: approve',
          'Effective decision: reject',
          'Delivered decision: reject',
          'Delivery: sent',
          'Observed execution: unknown',
        ],
      })
    })

    it('later ledger facts outrank a non-actionable entry', () => {
      const view = taskApprovalCardView(
        { ...RESERVED, delivery: 'delivery_unknown' },
        refusal(),
      )
      expect(view.mode).toMatchObject({ title: APPROVAL_COPY.unknown })
      expect(view.mode.kind).toBe('result')
    })

    it('own reject → Rejected by you, never the refusal copy', () => {
      const view = taskApprovalCardView(
        { ...RESERVED, decision: 'reject' },
        { kind: 'answered', taskId: 't1', requestId: ID, decision: 'reject' },
      )
      expect(view.actionLabel).toBe(APPROVAL_COPY.rejectedByYou)
      expect(view.headIcon).toBe('x')
      expect(view.mode).toMatchObject({ lines: [], refresh: false })
    })

    it('a decision from the ledger alone never says "by you"', () => {
      const view = taskApprovalCardView(
        { ...RESERVED, responder: 'caller' },
        null,
      )
      expect(view.actionLabel).toBe(APPROVAL_COPY.runCommand)
      expect(view.headIcon).toBe('hand')
    })

    it('a reserved row without an entry draws facts, not refusal copy', () => {
      const view = taskApprovalCardView(RESERVED, null)
      expect(view.mode).toEqual({
        kind: 'result',
        title: null,
        lines: [
          `${APPROVAL_COPY.byMonitor} · Oct 14, 2026, 5:46 PM`,
          'Recorded decision: approve',
          'Delivery: reserved',
          'Observed execution: unknown',
        ],
        refresh: false,
        refreshDisabled: false,
      })
    })

    it('a sent-rejected row draws facts and no Refresh', () => {
      const view = taskApprovalCardView(
        {
          ...RESERVED,
          disposition: 'decided',
          delivery: 'sent',
          decision: 'reject',
          effectiveDecision: 'reject',
          deliveredDecision: 'reject',
        },
        null,
      )
      expect(view.mode).toMatchObject({
        refresh: false,
        lines: [
          `${APPROVAL_COPY.byMonitor} · Oct 14, 2026, 5:46 PM`,
          'Recorded decision: reject',
          'Delivery: sent',
          'Observed execution: unknown',
        ],
      })
    })

    it('a system-rejected row draws no who line', () => {
      const view = taskApprovalCardView(
        {
          ...PENDING,
          disposition: 'decided',
          delivery: 'sent',
          decidedBy: 'harflow',
          effectiveDecision: 'reject',
          deliveredDecision: 'reject',
        },
        null,
      )
      expect(view.mode).toMatchObject({
        lines: ['Delivery: sent', 'Observed execution: unknown'],
      })
    })

    it('omits the channel when responder is absent', () => {
      const { responder: _responder, ...older } = RESERVED
      const view = taskApprovalCardView(older, null)
      expect(view.mode).toMatchObject({
        lines: [
          'Oct 14, 2026, 5:46 PM',
          'Recorded decision: approve',
          'Delivery: reserved',
          'Observed execution: unknown',
        ],
      })
    })

    it('expired-unanswered draws no who line', () => {
      const view = taskApprovalCardView(
        {
          ...PENDING,
          disposition: 'expired',
          delivery: 'sent',
          effectiveDecision: 'reject',
          deliveredDecision: 'reject',
          expiryRejection: true,
        },
        null,
      )
      expect(view.mode).toMatchObject({
        title: APPROVAL_COPY.expired,
        lines: [
          'Effective decision: reject',
          'Delivered decision: reject',
          APPROVAL_COPY.rejectionSent,
          'Delivery: sent',
          'Observed execution: unknown',
          APPROVAL_COPY.recovery,
        ],
      })
    })
  })
})
