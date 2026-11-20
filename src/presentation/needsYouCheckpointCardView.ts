/**
 * Needs you workflow attention-checkpoint card view.
 */
import {
  needsYouContextText,
  type NeedsYouWorkflowApproval,
  type WorkflowRunId,
} from '../model'
import { APPROVAL_COPY, APPROVAL_MAC_COPY } from './taskApprovalCopy'
import type { ApprovalResultMode } from './taskApprovalResult'

export type NeedsYouCheckpointEntry =
  | { readonly kind: 'checkpoint_stale' }
  | { readonly kind: 'non_actionable'; readonly attentionCheckpointId: string }
  | {
      readonly kind: 'answered'
      readonly decision: 'approve' | 'reject'
    }

export type NeedsYouCheckpointOpenLink =
  | { readonly kind: 'run'; readonly runId: WorkflowRunId; readonly title: string }
  | { readonly kind: 'run_unavailable'; readonly title: string }

export type NeedsYouCheckpointCardMode =
  | { readonly kind: 'decide'; readonly disabled: boolean }
  | ApprovalResultMode

export type NeedsYouCheckpointCardView = {
  readonly settled: boolean
  readonly actionLabel: string
  readonly source: string
  readonly command: string
  readonly meta: string
  readonly approveLabel: string
  readonly rejectLabel: string
  readonly rejectTone: 'secondary'
  readonly headIcon: 'hand' | 'check' | 'x'
  readonly mode: NeedsYouCheckpointCardMode
  readonly openLink: NeedsYouCheckpointOpenLink
}

function openLinkFor(
  item: NeedsYouWorkflowApproval,
): NeedsYouCheckpointOpenLink {
  const runId = item.context.runId
  if (runId === null) {
    return { kind: 'run_unavailable', title: item.context.title }
  }
  return { kind: 'run', runId, title: item.context.title }
}

function baseView(
  item: NeedsYouWorkflowApproval,
  mode: NeedsYouCheckpointCardMode,
  settled: boolean,
  headIcon: 'hand' | 'check' | 'x' = 'hand',
): NeedsYouCheckpointCardView {
  return {
    settled,
    actionLabel: item.actionLabel,
    source: needsYouContextText(item.context),
    command: item.exactAction,
    meta: item.detail,
    approveLabel: item.approveLabel,
    rejectLabel: item.rejectLabel,
    rejectTone: 'secondary',
    headIcon,
    mode,
    openLink: openLinkFor(item),
  }
}

/**
 * Map one workflow checkpoint item + session entry to the card view.
 */
export function needsYouCheckpointCardView(
  item: NeedsYouWorkflowApproval,
  entry: NeedsYouCheckpointEntry | null,
  submitting = false,
): NeedsYouCheckpointCardView {
  if (entry?.kind === 'answered') {
    const approved = entry.decision === 'approve'
    return baseView(
      item,
      { kind: 'result', title: null, lines: [], refresh: false, refreshDisabled: false },
      true,
      approved ? 'check' : 'x',
    )
  }
  if (entry?.kind === 'checkpoint_stale') {
    return baseView(
      item,
      {
        kind: 'result',
        title: null,
        lines: [APPROVAL_COPY.checkpointChanged],
        refresh: true,
        refreshDisabled: submitting,
      },
      true,
    )
  }
  if (entry?.kind === 'non_actionable') {
    return baseView(
      item,
      {
        kind: 'result',
        title: null,
        lines: [APPROVAL_MAC_COPY.unconfirmed],
        refresh: true,
        refreshDisabled: submitting,
      },
      true,
    )
  }
  return baseView(
    item,
    { kind: 'decide', disabled: submitting },
    false,
  )
}
