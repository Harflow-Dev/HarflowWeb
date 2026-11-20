/**
 * Session chrome for task approval answers (acknowledgements only).
 * Mirrors messaging send-now refusals: never written onto the ledger row.
 */
import type {
  ApprovalDecision,
  ApprovalRespondRefusal,
  TaskApprovalRequest,
} from '../model'

const KNOWN_REFUSAL_REASONS: ReadonlySet<string> = new Set([
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

/** One thing this browser session knows about a request id. */
export type TaskApprovalEntry =
  /** A typed refusal; a successful refresh clears it. */
  | {
      readonly kind: 'refusal'
      readonly requestId: string
      readonly refusal: ApprovalRespondRefusal
    }
  /**
   * An uncertain or untyped respond result. The request id at this owner
   * revision stays read-only (Refresh only) for the life of the chrome.
   */
  | {
      readonly kind: 'non_actionable'
      readonly requestId: string
      readonly ownerRevision: number
    }
  /** This session's own accepted acknowledgement (never inferred). */
  | {
      readonly kind: 'answered'
      readonly requestId: string
      readonly decision: ApprovalDecision
    }

/** A scripted respond refusal seeded for a scenario. */
export type TaskApprovalSeedRefusal = {
  readonly requestId: string
  readonly refusal: ApprovalRespondRefusal
}

export type TaskApprovalChrome = {
  readonly entries: readonly TaskApprovalEntry[]
  /**
   * Mirror of the command object's in-flight state for the open request.
   * The command object, not this field, guards against double submission.
   */
  readonly submitting: boolean
  /** Bumped when the card should take focus. */
  readonly focusResultSeq: number
}

export const EMPTY_TASK_APPROVAL: TaskApprovalChrome = {
  entries: [],
  submitting: false,
  focusResultSeq: 0,
}

/**
 * The entry that applies to this row, or null. A non-actionable entry
 * applies only at the owner revision it was recorded for.
 */
export function approvalEntryFor(
  chrome: TaskApprovalChrome,
  request: TaskApprovalRequest,
): TaskApprovalEntry | null {
  const entry = chrome.entries.find((e) => e.requestId === request.requestId)
  if (entry === undefined) return null
  if (
    entry.kind === 'non_actionable' &&
    entry.ownerRevision !== request.ownerRevision
  ) {
    return null
  }
  return entry
}

/** Typed known reason → refusal entry; missing or unknown → non-actionable. */
export function refusalEntry(
  requestId: string,
  ownerRevision: number,
  refusal: ApprovalRespondRefusal,
): TaskApprovalEntry {
  const reason = refusal.reason
  if (reason === undefined || !KNOWN_REFUSAL_REASONS.has(reason)) {
    return { kind: 'non_actionable', requestId, ownerRevision }
  }
  return { kind: 'refusal', requestId, refusal }
}

/** Replace everything held for this request id with one entry. */
export function withApprovalEntry(
  chrome: TaskApprovalChrome,
  entry: TaskApprovalEntry,
): TaskApprovalChrome {
  const rest = chrome.entries.filter((e) => e.requestId !== entry.requestId)
  return {
    ...chrome,
    entries: [...rest, entry],
    focusResultSeq: chrome.focusResultSeq + 1,
  }
}

/** Drop a typed refusal after a successful re-read; other entries stay. */
export function withoutApprovalRefusal(
  chrome: TaskApprovalChrome,
  requestId: string,
): TaskApprovalChrome {
  return {
    ...chrome,
    entries: chrome.entries.filter(
      (e) => !(e.kind === 'refusal' && e.requestId === requestId),
    ),
  }
}

/** What survives a task identity reset: facts that forbid resubmission. */
export function retainedApprovalChrome(
  chrome: TaskApprovalChrome,
): TaskApprovalChrome {
  return {
    ...EMPTY_TASK_APPROVAL,
    entries: chrome.entries.filter((e) => e.kind !== 'refusal'),
  }
}
