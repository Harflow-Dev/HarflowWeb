/**
 * Session chrome for task approval respond refusals (acknowledgement only).
 * Mirrors messaging send-now refusals: never written onto the ledger row.
 */
import type { ApprovalRespondRefusal } from '../model'

export type TaskApprovalRefusalEntry = {
  readonly requestId: string
  readonly refusal: ApprovalRespondRefusal
}

export type TaskApprovalChrome = {
  readonly refusals: readonly TaskApprovalRefusalEntry[]
  /** True while a respond call is in flight. */
  readonly submitting: boolean
  /** Bumped when a refusal result should take focus. */
  readonly focusResultSeq: number
}

export const EMPTY_TASK_APPROVAL: TaskApprovalChrome = {
  refusals: [],
  submitting: false,
  focusResultSeq: 0,
}

export function refusalForRequest(
  chrome: TaskApprovalChrome,
  requestId: string,
): ApprovalRespondRefusal | null {
  return (
    chrome.refusals.find((entry) => entry.requestId === requestId)?.refusal ??
    null
  )
}

export function withApprovalRefusal(
  chrome: TaskApprovalChrome,
  requestId: string,
  refusal: ApprovalRespondRefusal,
): TaskApprovalChrome {
  const rest = chrome.refusals.filter((entry) => entry.requestId !== requestId)
  return {
    refusals: [...rest, { requestId, refusal }],
    submitting: false,
    focusResultSeq: chrome.focusResultSeq + 1,
  }
}

export function withoutApprovalRefusal(
  chrome: TaskApprovalChrome,
  requestId: string,
): TaskApprovalChrome {
  return {
    ...chrome,
    refusals: chrome.refusals.filter((entry) => entry.requestId !== requestId),
    submitting: false,
  }
}
