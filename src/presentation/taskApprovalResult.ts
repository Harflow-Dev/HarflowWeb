/**
 * Settled / refusal result blocks for the approval card view.
 * Lines are contract facts and Design COPY/DECIDED (56b49cb); refusals the
 * design does not draw use the HarflowMac lines (APPROVAL_MAC_COPY).
 */
import type {
  ApprovalDecision,
  ApprovalRespondRefusal,
  ApprovalResponder,
  TaskApprovalRequest,
} from '../model'
import { APPROVAL_COPY, APPROVAL_MAC_COPY } from './taskApprovalCopy'
import { formatApprovalTimeUtc } from './taskApprovalTime'

export type ApprovalResultMode = {
  readonly kind: 'result'
  readonly title: string | null
  readonly lines: readonly string[]
  readonly refresh: boolean
  /** Refresh stays drawn but disabled while a respond is in flight. */
  readonly refreshDisabled: boolean
}

function result(
  title: string | null,
  lines: readonly string[],
  refresh: boolean,
  submitting: boolean,
): ApprovalResultMode {
  return {
    kind: 'result',
    title,
    lines,
    refresh,
    refreshDisabled: refresh && submitting,
  }
}

function channelLabel(responder: ApprovalResponder): string {
  return responder === 'monitor'
    ? APPROVAL_COPY.byMonitor
    : APPROVAL_COPY.byCaller
}

function recordedLine(decision: ApprovalDecision): string {
  return `Recorded decision: ${decision}`
}

/**
 * Who/when line: only for a human decision (`decided_by: caller`). The
 * channel is omitted when `responder` is absent (older rows); a channel
 * never identifies a person.
 */
function whoWhenLine(request: TaskApprovalRequest): string | null {
  if (request.decision === null || request.decidedBy !== 'caller') return null
  const channel =
    request.responder === undefined ? null : channelLabel(request.responder)
  const time =
    request.decidedAt === undefined
      ? null
      : formatApprovalTimeUtc(request.decidedAt)
  if (channel !== null && time !== null) return `${channel} · ${time}`
  return channel ?? time
}

function present(lines: readonly (string | null)[]): string[] {
  return lines.filter((line): line is string => line !== null)
}

function factLines(request: TaskApprovalRequest): string[] {
  return present([
    whoWhenLine(request),
    request.decision === null ? null : recordedLine(request.decision),
    `Delivery: ${request.delivery}`,
    `Observed execution: ${request.executionOutcome}`,
  ])
}

/** Refusal line and Refresh for a known typed reason (not already_answered). */
const TYPED_REFUSAL: Readonly<
  Record<string, { readonly line: string; readonly refresh: boolean }>
> = {
  not_current: { line: APPROVAL_COPY.notCurrent, refresh: true },
  settled: { line: APPROVAL_COPY.settled, refresh: false },
  expired: { line: APPROVAL_MAC_COPY.expired, refresh: false },
  ownership_lost: { line: APPROVAL_MAC_COPY.ownershipLost, refresh: true },
  unauthorized: { line: APPROVAL_MAC_COPY.unauthorized, refresh: true },
  unsupported: { line: APPROVAL_MAC_COPY.unsupported, refresh: true },
  caller_undecidable: {
    line: APPROVAL_MAC_COPY.callerUndecidable,
    refresh: true,
  },
  incomplete: { line: APPROVAL_MAC_COPY.incomplete, refresh: true },
}

/** Result block for a typed refusal with a known reason. */
export function refusalResult(
  refusal: ApprovalRespondRefusal,
  submitting: boolean,
): ApprovalResultMode {
  if (refusal.reason === 'already_answered') {
    return alreadyAnsweredResult(refusal)
  }
  const typed = TYPED_REFUSAL[refusal.reason ?? '']
  if (typed === undefined) return nonActionableResult(submitting)
  return result(null, [typed.line], typed.refresh, submitting)
}

/** Untyped refusal, unknown reason, or an uncertain respond outcome. */
export function nonActionableResult(submitting: boolean): ApprovalResultMode {
  return result(null, [APPROVAL_MAC_COPY.unconfirmed], true, submitting)
}

function alreadyAnsweredResult(
  refusal: ApprovalRespondRefusal,
): ApprovalResultMode {
  const interaction = refusal.interaction
  if (interaction === undefined) {
    return result(null, [APPROVAL_COPY.alreadyAnswered], false, false)
  }
  return result(
    `${channelLabel(interaction.answeredBy)} · ${interaction.answer}`,
    [formatApprovalTimeUtc(interaction.answeredAt), APPROVAL_COPY.alreadyAnswered],
    false,
    false,
  )
}

/** Results drawn from ledger facts alone (no session entry involved). */
export function ledgerResult(
  request: TaskApprovalRequest,
): ApprovalResultMode | null {
  if (request.delivery === 'delivery_unknown') {
    return result(APPROVAL_COPY.unknown, factLines(request), false, false)
  }
  if (request.disposition === 'expired' && request.expiryRejection) {
    return expiredOverrideResult(request)
  }
  return null
}

/**
 * Fact-only block for any other non-awaiting row without a refusal: no
 * invented sentence and no Refresh.
 */
export function factsResult(request: TaskApprovalRequest): ApprovalResultMode {
  return result(null, factLines(request), false, false)
}

/** Settled by this session's own accepted answer: head only, no lines. */
export function answeredResult(): ApprovalResultMode {
  return result(null, [], false, false)
}

function expiredOverrideResult(
  request: TaskApprovalRequest,
): ApprovalResultMode {
  const lines = present([
    whoWhenLine(request),
    request.decision === null ? null : recordedLine(request.decision),
    request.effectiveDecision === null
      ? null
      : `Effective decision: ${request.effectiveDecision}`,
    request.deliveredDecision === null
      ? null
      : `Delivered decision: ${request.deliveredDecision}`,
    APPROVAL_COPY.rejectionSent,
    `Delivery: ${request.delivery}`,
    `Observed execution: ${request.executionOutcome}`,
    APPROVAL_COPY.recovery,
  ])
  return result(APPROVAL_COPY.expired, lines, false, false)
}
