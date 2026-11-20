/**
 * Pure mapping: ledger row + session entry → approval card view.
 * Result lines come from contract facts and Design COPY/DECIDED (56b49cb).
 */
import { isAwaitingDecision, type TaskApprovalRequest } from '../model'
import type { TaskApprovalEntry } from './taskApprovalChrome'
import { APPROVAL_COPY } from './taskApprovalCopy'
import {
  answeredResult,
  factsResult,
  ledgerResult,
  nonActionableResult,
  refusalResult,
  type ApprovalResultMode,
} from './taskApprovalResult'

export type TaskApprovalCardMode =
  | {
      readonly kind: 'decide'
      readonly disabled: boolean
    }
  | ApprovalResultMode

export type TaskApprovalCardView = {
  readonly settled: boolean
  readonly actionLabel: string
  readonly source: string
  /** The source label is drawn only on the hand head. */
  readonly showSource: boolean
  readonly command: string
  readonly cwdMeta: string
  readonly reasonLine: string | null
  readonly headIcon: 'hand' | 'check' | 'x'
  readonly mode: TaskApprovalCardMode
}

function cwdMeta(cwd: string): string {
  return cwd.startsWith('in ') ? cwd : `in ${cwd}`
}

function reasonLine(reason: string | null): string | null {
  if (reason === null || reason === '') return null
  return reason.startsWith('Reason:') ? reason : `Reason: ${reason}`
}

function cardBase(request: TaskApprovalRequest) {
  return {
    actionLabel: APPROVAL_COPY.runCommand,
    source:
      request.toolName === 'Bash'
        ? APPROVAL_COPY.sourceBash
        : request.toolName,
    showSource: true,
    command: request.action,
    cwdMeta: cwdMeta(request.cwd),
    reasonLine: reasonLine(request.decisionReason),
  }
}

function settledHand(
  request: TaskApprovalRequest,
  mode: ApprovalResultMode,
): TaskApprovalCardView {
  return { ...cardBase(request), settled: true, headIcon: 'hand', mode }
}

function answeredByYou(
  request: TaskApprovalRequest,
  entry: Extract<TaskApprovalEntry, { kind: 'answered' }>,
): TaskApprovalCardView {
  const approved = entry.decision === 'approve'
  return {
    ...cardBase(request),
    settled: true,
    showSource: false,
    actionLabel: approved
      ? APPROVAL_COPY.approvedByYou
      : APPROVAL_COPY.rejectedByYou,
    headIcon: approved ? 'check' : 'x',
    mode: answeredResult(),
  }
}

/**
 * Map one ledger row and its session entry to the card view. Refusal copy is
 * drawn only for an entry; any other non-awaiting row draws ledger facts.
 * `submitting` disables decision buttons (and Refresh) while a respond is in
 * flight.
 */
export function taskApprovalCardView(
  request: TaskApprovalRequest,
  entry: TaskApprovalEntry | null,
  submitting = false,
): TaskApprovalCardView {
  if (entry?.kind === 'non_actionable') {
    return settledHand(request, nonActionableResult(submitting))
  }
  if (entry?.kind === 'refusal') {
    return settledHand(request, refusalResult(entry.refusal, submitting))
  }
  const ledger = ledgerResult(request)
  if (ledger !== null) return settledHand(request, ledger)
  if (entry?.kind === 'answered') return answeredByYou(request, entry)
  if (isAwaitingDecision(request)) {
    return {
      ...cardBase(request),
      settled: false,
      headIcon: 'hand',
      mode: { kind: 'decide', disabled: submitting },
    }
  }
  return settledHand(request, factsResult(request))
}
