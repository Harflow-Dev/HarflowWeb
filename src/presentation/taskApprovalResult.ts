/**
 * Settled / refusal result blocks for the approval card view.
 */
import type {
  ApprovalDecision,
  ApprovalRespondRefusal,
  ApprovalResponder,
  TaskApprovalRequest,
} from '../model'
import { APPROVAL_COPY } from './taskApprovalCopy'
import { formatApprovalTimeUtc } from './taskApprovalTime'

const KNOWN_REFUSAL = new Set([
  'not_current',
  'already_answered',
  'settled',
  'expired',
  'ownership_lost',
  'unauthorized',
  'unsupported',
  'caller_undecidable',
  'incomplete',
])

function channelLabel(responder: ApprovalResponder): string {
  return responder === 'monitor'
    ? APPROVAL_COPY.byMonitor
    : APPROVAL_COPY.byCaller
}

function recordedLine(decision: ApprovalDecision): string {
  return `Recorded decision: ${decision}`
}

export type ApprovalResultMode = {
  readonly kind: 'result'
  readonly title: string | null
  readonly lines: readonly string[]
  readonly refresh: boolean
}

/** Interactive post-approve settle (undrawn route; see review-notes). */
export function isPostApprove(request: TaskApprovalRequest): boolean {
  return (
    request.disposition === 'decided' &&
    request.delivery === 'sent' &&
    request.decision === 'approve' &&
    request.responder === 'caller' &&
    request.effectiveDecision === 'approve' &&
    request.deliveredDecision === 'approve'
  )
}

export function refusalResult(
  refusal: ApprovalRespondRefusal,
): ApprovalResultMode {
  const reason = refusal.reason
  if (reason === undefined || reason === '' || !KNOWN_REFUSAL.has(reason)) {
    return {
      kind: 'result',
      title: null,
      lines: [APPROVAL_COPY.notCurrent],
      refresh: true,
    }
  }
  if (reason === 'not_current') {
    return {
      kind: 'result',
      title: null,
      lines: [APPROVAL_COPY.notCurrent],
      refresh: true,
    }
  }
  if (reason === 'settled') {
    return {
      kind: 'result',
      title: null,
      lines: [APPROVAL_COPY.settled],
      refresh: false,
    }
  }
  if (reason === 'already_answered') {
    return alreadyAnsweredResult(refusal)
  }
  return {
    kind: 'result',
    title: null,
    lines: [APPROVAL_COPY.notCurrent],
    refresh: true,
  }
}

function alreadyAnsweredResult(
  refusal: ApprovalRespondRefusal,
): ApprovalResultMode {
  const interaction = refusal.interaction
  if (interaction === undefined) {
    return {
      kind: 'result',
      title: null,
      lines: [APPROVAL_COPY.alreadyAnswered],
      refresh: false,
    }
  }
  return {
    kind: 'result',
    title: `${channelLabel(interaction.answeredBy)} · ${interaction.answer}`,
    lines: [
      formatApprovalTimeUtc(interaction.answeredAt),
      APPROVAL_COPY.alreadyAnswered,
    ],
    refresh: false,
  }
}

export function ledgerResult(
  request: TaskApprovalRequest,
): ApprovalResultMode | null {
  if (request.delivery === 'delivery_unknown') {
    return uncertainResult(request)
  }
  if (request.disposition === 'expired' && request.expiryRejection) {
    return expiredOverrideResult(request)
  }
  if (isPostApprove(request)) {
    return { kind: 'result', title: null, lines: [], refresh: false }
  }
  return null
}

function uncertainResult(request: TaskApprovalRequest): ApprovalResultMode {
  const responder = request.responder ?? 'caller'
  const at = request.decidedAt
  const whoWhen =
    at === undefined
      ? channelLabel(responder)
      : `${channelLabel(responder)} · ${formatApprovalTimeUtc(at)}`
  const lines: string[] = [whoWhen]
  if (request.decision !== null) lines.push(recordedLine(request.decision))
  lines.push(`Delivery: ${request.delivery}`)
  lines.push(`Observed execution: ${request.executionOutcome}`)
  return {
    kind: 'result',
    title: APPROVAL_COPY.unknown,
    lines,
    refresh: false,
  }
}

function expiredOverrideResult(
  request: TaskApprovalRequest,
): ApprovalResultMode {
  const responder = request.responder ?? 'caller'
  const at = request.decidedAt
  const whoWhen =
    at === undefined
      ? channelLabel(responder)
      : `${channelLabel(responder)} · ${formatApprovalTimeUtc(at)}`
  const lines: string[] = [whoWhen]
  if (request.decision !== null) lines.push(recordedLine(request.decision))
  if (request.effectiveDecision !== null) {
    lines.push(`Effective decision: ${request.effectiveDecision}`)
  }
  if (request.deliveredDecision !== null) {
    lines.push(`Delivered decision: ${request.deliveredDecision}`)
  }
  lines.push(APPROVAL_COPY.rejectionSent)
  lines.push(`Delivery: ${request.delivery}`)
  lines.push(`Observed execution: ${request.executionOutcome}`)
  lines.push(APPROVAL_COPY.recovery)
  return {
    kind: 'result',
    title: APPROVAL_COPY.expired,
    lines,
    refresh: false,
  }
}
