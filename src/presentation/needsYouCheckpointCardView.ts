/**
 * Needs you workflow attention-checkpoint card view.
 */
import {
  needsYouContextText,
  type NeedsYouWorkflowApproval,
  type WorkflowCheckpointInteraction,
  type WorkflowRunId,
} from '../model'
import { APPROVAL_COPY, APPROVAL_MAC_COPY } from './taskApprovalCopy'
import {
  answeredElsewhereResult,
  type ApprovalResultMode,
} from './taskApprovalResult'

export type NeedsYouCheckpointEntry =
  | { readonly kind: 'checkpoint_stale' }
  | { readonly kind: 'non_actionable'; readonly attentionCheckpointId: string }
  | {
      readonly kind: 'answered'
      readonly decision: 'approve' | 'reject'
    }
  /**
   * Typed refusal other than checkpoint_stale. `interaction_already_answered`
   * has no Refresh; unavailable / required offer Refresh.
   */
  | {
      readonly kind: 'refused'
      readonly code:
        | 'interaction_already_answered'
        | 'attention_checkpoint_unavailable'
        | 'attention_checkpoint_required'
      /** Winner carried on interaction_already_answered, when present. */
      readonly interaction?: WorkflowCheckpointInteraction
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
 * Neutral undrawn line for typed checkpoint refusals Design does not copy.
 * Makes no claim the drawings do not make.
 */
export const CHECKPOINT_REFUSAL_NEUTRAL =
  'This request is read-only here.' as const

/**
 * Neutral undrawn line for a card whose token changed on Refresh but whose
 * full action has not arrived through the Needs you observation yet.
 */
export const CHECKPOINT_PROSE_PENDING =
  'This request changed. Its full action is not shown yet.' as const

function refusedResult(
  entry: Extract<NeedsYouCheckpointEntry, { kind: 'refused' }>,
  submitting: boolean,
): ApprovalResultMode {
  const code = entry.code
  // The winner is drawn from its present fields, as on the task screen.
  if (
    code === 'interaction_already_answered' &&
    entry.interaction !== undefined
  ) {
    return answeredElsewhereResult(entry.interaction)
  }
  const refresh =
    code === 'attention_checkpoint_unavailable' ||
    code === 'attention_checkpoint_required'
  return {
    kind: 'result',
    title: null,
    lines: [CHECKPOINT_REFUSAL_NEUTRAL],
    refresh,
    refreshDisabled: refresh && submitting,
  }
}

const NO_RESULT_LINES: ApprovalResultMode = {
  kind: 'result',
  title: null,
  lines: [],
  refresh: false,
  refreshDisabled: false,
}

function answeredView(
  item: NeedsYouWorkflowApproval,
  decision: 'approve' | 'reject',
): NeedsYouCheckpointCardView {
  const approved = decision === 'approve'
  return {
    ...baseView(item, NO_RESULT_LINES, true, approved ? 'check' : 'x'),
    actionLabel: approved
      ? APPROVAL_COPY.approvedByYou
      : APPROVAL_COPY.rejectedByYou,
  }
}

function refreshableResult(
  line: string,
  submitting: boolean,
): ApprovalResultMode {
  return {
    kind: 'result',
    title: null,
    lines: [line],
    refresh: true,
    refreshDisabled: submitting,
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
  switch (entry?.kind) {
    case 'answered':
      return answeredView(item, entry.decision)
    case 'checkpoint_stale':
      return baseView(
        item,
        refreshableResult(APPROVAL_COPY.checkpointChanged, submitting),
        true,
      )
    case 'refused':
      return baseView(item, refusedResult(entry, submitting), true)
    case 'non_actionable':
      return baseView(
        item,
        refreshableResult(APPROVAL_MAC_COPY.unconfirmed, submitting),
        true,
      )
    default:
      // An empty command slot means the token changed on Refresh and no
      // observation item with the full action has replaced the card yet.
      if (item.exactAction === '') {
        return baseView(
          item,
          refreshableResult(CHECKPOINT_PROSE_PENDING, submitting),
          true,
        )
      }
      return baseView(item, { kind: 'decide', disabled: submitting }, false)
  }
}
