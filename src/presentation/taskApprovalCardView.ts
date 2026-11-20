/**
 * Pure mapping: ledger row + optional respond refusal → approval card view.
 * Result lines come from contract facts and Design COPY/DECIDED (56b49cb).
 */
import type {
  ApprovalRespondRefusal,
  TaskApprovalRequest,
} from '../model'
import { APPROVAL_COPY } from './taskApprovalCopy'
import {
  isPostApprove,
  ledgerResult,
  refusalResult,
} from './taskApprovalResult'

export type TaskApprovalCardMode =
  | {
      readonly kind: 'decide'
      readonly disabled: boolean
    }
  | {
      readonly kind: 'result'
      readonly title: string | null
      readonly lines: readonly string[]
      readonly refresh: boolean
    }

export type TaskApprovalCardView = {
  readonly settled: boolean
  readonly actionLabel: string
  readonly source: string
  readonly command: string
  readonly cwdMeta: string
  readonly reasonLine: string | null
  readonly headIcon: 'hand' | 'check'
  readonly mode: TaskApprovalCardMode
}

function awaitingDecision(request: TaskApprovalRequest): boolean {
  return (
    request.disposition === 'pending' &&
    request.delivery === 'pending' &&
    request.decision === null &&
    !request.expiryRejection
  )
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
    command: request.action,
    cwdMeta: cwdMeta(request.cwd),
    reasonLine: reasonLine(request.decisionReason),
  }
}

/**
 * Map one ledger row and an optional respond refusal to the card view.
 * `submitting` disables decision buttons while the respond call is in flight.
 */
export function taskApprovalCardView(
  request: TaskApprovalRequest,
  refusal: ApprovalRespondRefusal | null,
  submitting = false,
): TaskApprovalCardView {
  const base = cardBase(request)
  if (refusal !== null) {
    return {
      ...base,
      settled: true,
      headIcon: 'hand',
      mode: refusalResult(refusal),
    }
  }
  if (awaitingDecision(request)) {
    return {
      ...base,
      settled: false,
      headIcon: 'hand',
      mode: { kind: 'decide', disabled: submitting },
    }
  }
  const settled = ledgerResult(request)
  if (settled !== null) {
    const postApprove = isPostApprove(request)
    return {
      ...base,
      settled: true,
      actionLabel: postApprove ? APPROVAL_COPY.approvedByYou : base.actionLabel,
      headIcon: postApprove ? 'check' : 'hand',
      mode: settled,
    }
  }
  return {
    ...base,
    settled: true,
    headIcon: 'hand',
    mode: {
      kind: 'result',
      title: null,
      lines: [APPROVAL_COPY.notCurrent],
      refresh: true,
    },
  }
}
