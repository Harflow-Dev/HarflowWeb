import { describe, expect, it } from 'vitest'
import {
  needsYouAnsweredElsewhereRequest,
  needsYouExpiredUnansweredRequest,
  needsYouPendingRequest,
  nightlyPublishNeedsYouApproval,
  slotReleaseNeedsYouApproval,
  NEEDS_YOU_CHECKPOINT_TOKEN,
  NEEDS_YOU_CHECKPOINT_TOKEN_NEXT,
  NEEDS_YOU_PUBLISH_NODE_ID,
  NEEDS_YOU_PUBLISH_PATH,
} from '../adapters/mock/needsYouApprovalFixtures'
import { NIGHTLY_PUBLISH_SNAPSHOT } from '../adapters/mock/nightlyPublishSnapshot'
import { NIGHTLY_AUDIT_RUN_ID } from '../adapters/mock/workflowExecutionFixtures'
import { APPROVAL_COPY, APPROVAL_MAC_COPY } from './taskApprovalCopy'
import { refusalEntry } from './taskApprovalChrome'
import { needsYouTaskApprovalCardView } from './needsYouApprovalCardView'
import {
  CHECKPOINT_REFUSAL_NEUTRAL,
  needsYouCheckpointCardView,
} from './needsYouCheckpointCardView'
import { applyCheckpointRefresh } from './needsYouCommandApply'
import { EMPTY_NEEDS_YOU_CHROME } from './needsYouChrome'
import { initialNeedsYouState } from './needsYouState'
import { asWorkflowRunId } from '../model'

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

  it('applyCheckpointRefresh with a new token rebuilds a decidable card', () => {
    const stale = nightlyPublishNeedsYouApproval(NEEDS_YOU_CHECKPOINT_TOKEN)
    const state = {
      ...initialNeedsYouState(),
      chrome: {
        ...EMPTY_NEEDS_YOU_CHROME,
        checkpoints: [
          {
            runId: NIGHTLY_AUDIT_RUN_ID,
            attentionCheckpointId: NEEDS_YOU_CHECKPOINT_TOKEN,
            entry: { kind: 'checkpoint_stale' as const },
          },
        ],
      },
      displayItems: [stale],
    }
    const nextAction = `${NIGHTLY_PUBLISH_SNAPSHOT.publishAction} (reviewed)`
    const next = applyCheckpointRefresh(
      state,
      stale,
      asWorkflowRunId(NIGHTLY_AUDIT_RUN_ID),
      NEEDS_YOU_CHECKPOINT_TOKEN,
      {
        kind: 'checkpoint',
        attentionCheckpointId: NEEDS_YOU_CHECKPOINT_TOKEN_NEXT,
        pending: [
          {
            attentionCheckpointId: NEEDS_YOU_CHECKPOINT_TOKEN_NEXT,
            nodeId: NEEDS_YOU_PUBLISH_NODE_ID,
            path: [...NEEDS_YOU_PUBLISH_PATH],
            nodeTitle: 'Open pull request',
            reason: 'Caller guidance required',
            status: 'paused',
            exactAction: nextAction,
          },
        ],
      },
    )
    const updated = next.displayItems[0]
    expect(updated).toMatchObject({
      attentionCheckpointId: NEEDS_YOU_CHECKPOINT_TOKEN_NEXT,
      exactAction: nextAction,
    })
    expect(next.chrome.checkpoints.some((e) => e.entry.kind === 'checkpoint_stale')).toBe(
      false,
    )
    if (updated === undefined || updated.kind !== 'approval') return
    const decidable = needsYouCheckpointCardView(
      updated as typeof stale,
      null,
    )
    expect(decidable.settled).toBe(false)
    expect(decidable.mode).toEqual({ kind: 'decide', disabled: false })
    expect(decidable.command).toBe(nextAction)
  })

  it('applyCheckpointRefresh with the same token keeps stale', () => {
    const stale = nightlyPublishNeedsYouApproval(NEEDS_YOU_CHECKPOINT_TOKEN)
    const state = {
      ...initialNeedsYouState(),
      chrome: {
        ...EMPTY_NEEDS_YOU_CHROME,
        checkpoints: [
          {
            runId: NIGHTLY_AUDIT_RUN_ID,
            attentionCheckpointId: NEEDS_YOU_CHECKPOINT_TOKEN,
            entry: { kind: 'checkpoint_stale' as const },
          },
        ],
      },
      displayItems: [stale],
    }
    const next = applyCheckpointRefresh(
      state,
      stale,
      asWorkflowRunId(NIGHTLY_AUDIT_RUN_ID),
      NEEDS_YOU_CHECKPOINT_TOKEN,
      {
        kind: 'checkpoint',
        attentionCheckpointId: NEEDS_YOU_CHECKPOINT_TOKEN,
        pending: [
          {
            attentionCheckpointId: NEEDS_YOU_CHECKPOINT_TOKEN,
            nodeId: NEEDS_YOU_PUBLISH_NODE_ID,
            path: [...NEEDS_YOU_PUBLISH_PATH],
            nodeTitle: 'Open pull request',
            reason: 'Caller guidance required',
            status: 'paused',
            exactAction: NIGHTLY_PUBLISH_SNAPSHOT.publishAction,
          },
        ],
      },
    )
    expect(
      next.chrome.checkpoints.some((e) => e.entry.kind === 'checkpoint_stale'),
    ).toBe(true)
    const view = needsYouCheckpointCardView(stale, {
      kind: 'checkpoint_stale',
    })
    expect(view.mode).toMatchObject({
      lines: [APPROVAL_COPY.checkpointChanged],
      refresh: true,
    })
  })

  it('answered → Approved/Rejected by you head', () => {
    const item = nightlyPublishNeedsYouApproval()
    const approved = needsYouCheckpointCardView(item, {
      kind: 'answered',
      decision: 'approve',
    })
    expect(approved.actionLabel).toBe(APPROVAL_COPY.approvedByYou)
    expect(approved.headIcon).toBe('check')
    const rejected = needsYouCheckpointCardView(item, {
      kind: 'answered',
      decision: 'reject',
    })
    expect(rejected.actionLabel).toBe(APPROVAL_COPY.rejectedByYou)
    expect(rejected.headIcon).toBe('x')
  })

  it('refused interaction_already_answered → neutral, no Refresh', () => {
    const item = nightlyPublishNeedsYouApproval()
    const view = needsYouCheckpointCardView(item, {
      kind: 'refused',
      code: 'interaction_already_answered',
    })
    expect(view.mode).toMatchObject({
      lines: [CHECKPOINT_REFUSAL_NEUTRAL],
      refresh: false,
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
