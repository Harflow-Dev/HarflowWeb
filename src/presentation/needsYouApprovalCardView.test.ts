import { describe, expect, it } from 'vitest'
import {
  needsYouAnsweredElsewhereRequest,
  needsYouExpiredUnansweredRequest,
  needsYouPendingRequest,
  nightlyPublishNeedsYouApproval,
  slotReleaseNeedsYouApproval,
  NEEDS_YOU_CHECKPOINT_TOKEN,
  NEEDS_YOU_CHECKPOINT_TOKEN_NEXT,
} from '../adapters/mock/needsYouApprovalFixtures'
import { APPROVAL_COPY, APPROVAL_MAC_COPY } from './taskApprovalCopy'
import { refusalEntry } from './taskApprovalChrome'
import { needsYouTaskApprovalCardView } from './needsYouApprovalCardView'
import { needsYouCheckpointCardView } from './needsYouCheckpointCardView'

describe('needsYouTaskApprovalCardView', () => {
  it('approval-stale: not_current + Refresh; Needs you head and src', () => {
    const item = slotReleaseNeedsYouApproval()
    const entry = refusalEntry(
      item.context.taskId!,
      item.requestId,
      item.ownerRevision,
      { reason: 'not_current' },
    )
    const view = needsYouTaskApprovalCardView(item, entry)
    expect(view.settled).toBe(true)
    expect(view.actionLabel).toBe('Wants to run a command')
    expect(view.source).toContain('Task: Fix flaky slot release test')
    expect(view.command).toBe('npm test -- --runInBand slot-release')
    expect(view.rejectTone).toBe('secondary')
    expect(view.mode).toMatchObject({
      kind: 'result',
      lines: [APPROVAL_COPY.notCurrent],
      refresh: true,
    })
  })

  it('approval-expired: expiredUnanswered facts, no who line, no Refresh', () => {
    const item = slotReleaseNeedsYouApproval(needsYouExpiredUnansweredRequest())
    const view = needsYouTaskApprovalCardView(item, null)
    expect(view.settled).toBe(true)
    expect(view.mode.kind).toBe('result')
    if (view.mode.kind !== 'result') return
    expect(view.mode.title).toBe(APPROVAL_COPY.expired)
    expect(view.mode.lines).toEqual([
      'Effective decision: reject',
      'Delivered decision: reject',
      APPROVAL_COPY.rejectionSent,
      'Delivery: sent',
      'Observed execution: unknown',
      APPROVAL_COPY.recovery,
    ])
    expect(view.mode.refresh).toBe(false)
  })

  it('answered-elsewhere: already_answered caller → raceCaller title', () => {
    const item = slotReleaseNeedsYouApproval(needsYouAnsweredElsewhereRequest())
    const entry = refusalEntry(
      item.context.taskId!,
      item.requestId,
      item.ownerRevision,
      {
        reason: 'already_answered',
        interaction: {
          answeredBy: 'caller',
          answer: 'approve',
          answeredAt: 1792000005,
        },
      },
    )
    const view = needsYouTaskApprovalCardView(item, entry)
    expect(view.mode).toEqual({
      kind: 'result',
      title: APPROVAL_COPY.raceCaller,
      lines: ['Oct 14, 2026, 5:46 PM', 'Recorded decision: approve'],
      refresh: false,
      refreshDisabled: false,
    })
  })

  it('unknown refusal → read-only untyped line + Refresh', () => {
    const item = slotReleaseNeedsYouApproval(needsYouPendingRequest())
    const entry = refusalEntry(
      item.context.taskId!,
      item.requestId,
      item.ownerRevision,
      {},
    )
    const view = needsYouTaskApprovalCardView(item, entry)
    expect(view.mode).toMatchObject({
      kind: 'result',
      lines: [APPROVAL_MAC_COPY.unconfirmed],
      refresh: true,
    })
  })
})

describe('needsYouCheckpointCardView', () => {
  it('checkpoint-stale: COPY.changed + Refresh', () => {
    const item = nightlyPublishNeedsYouApproval()
    const view = needsYouCheckpointCardView(item, { kind: 'checkpoint_stale' })
    expect(view.settled).toBe(true)
    expect(view.approveLabel).toBe('Approve')
    expect(view.mode).toMatchObject({
      kind: 'result',
      lines: [APPROVAL_COPY.checkpointChanged],
      refresh: true,
    })
  })

  it('refresh with a new token → decidable; same token stays stale', () => {
    const stale = nightlyPublishNeedsYouApproval(NEEDS_YOU_CHECKPOINT_TOKEN)
    const staleView = needsYouCheckpointCardView(stale, {
      kind: 'checkpoint_stale',
    })
    expect(staleView.mode.kind).toBe('result')

    const next = nightlyPublishNeedsYouApproval(NEEDS_YOU_CHECKPOINT_TOKEN_NEXT)
    const decidable = needsYouCheckpointCardView(next, null)
    expect(decidable.settled).toBe(false)
    expect(decidable.mode).toEqual({ kind: 'decide', disabled: false })

    const stillStale = needsYouCheckpointCardView(stale, {
      kind: 'checkpoint_stale',
    })
    expect(stillStale.mode).toMatchObject({
      kind: 'result',
      lines: [APPROVAL_COPY.checkpointChanged],
      refresh: true,
    })
  })

  it('unknown → read-only untyped line + Refresh', () => {
    const item = nightlyPublishNeedsYouApproval()
    const view = needsYouCheckpointCardView(item, {
      kind: 'non_actionable',
      attentionCheckpointId: item.attentionCheckpointId,
    })
    expect(view.mode).toMatchObject({
      lines: [APPROVAL_MAC_COPY.unconfirmed],
      refresh: true,
    })
  })
})
