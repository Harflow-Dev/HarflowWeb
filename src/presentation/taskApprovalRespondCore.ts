/**
 * Shared respond / refresh chrome updates for task approvals.
 * Parameterized by selected-task focus; hosts merge accepted rows themselves.
 */
import type {
  ApprovalDecision,
  ApprovalRefreshResult,
  ApprovalRespondOutcome,
  TaskApprovalRequest,
  TaskId,
} from '../model'
import {
  refusalEntry,
  withApprovalEntry,
  withoutApprovalRefusal,
  type TaskApprovalChrome,
  type TaskApprovalEntry,
} from './taskApprovalChrome'

export type TaskApprovalRespondChromeResult = {
  readonly chrome: TaskApprovalChrome
  /** Accepted row to merge into the host surface; null for refuse/unknown. */
  readonly acceptedRequest: TaskApprovalRequest | null
}

function respondEntry(
  taskId: TaskId,
  sent: Pick<TaskApprovalRequest, 'requestId' | 'ownerRevision'>,
  decision: ApprovalDecision,
  outcome: ApprovalRespondOutcome,
): TaskApprovalEntry {
  if (outcome.kind === 'refused') {
    return refusalEntry(
      taskId,
      sent.requestId,
      sent.ownerRevision,
      outcome.refusal,
    )
  }
  if (outcome.kind === 'unknown') {
    return {
      kind: 'non_actionable',
      taskId,
      requestId: sent.requestId,
      ownerRevision: sent.ownerRevision,
    }
  }
  return { kind: 'answered', taskId, requestId: sent.requestId, decision }
}

/**
 * Record a respond acknowledgement into chrome. The entry is keyed by
 * request id even when another task is open.
 */
export function taskApprovalRespondedChrome(
  chrome: TaskApprovalChrome,
  taskId: TaskId,
  sent: Pick<TaskApprovalRequest, 'requestId' | 'ownerRevision'>,
  decision: ApprovalDecision,
  outcome: ApprovalRespondOutcome,
  selectedTaskId: string | null,
): TaskApprovalRespondChromeResult {
  return {
    chrome: withApprovalEntry(
      chrome,
      respondEntry(taskId, sent, decision, outcome),
      selectedTaskId,
    ),
    acceptedRequest: outcome.kind === 'accepted' ? outcome.request : null,
  }
}

/**
 * Apply a refresh result to chrome. Only a re-read row changes anything;
 * `absent` and `failed` keep every existing entry.
 */
export function taskApprovalRefreshedChrome(
  chrome: TaskApprovalChrome,
  taskId: TaskId,
  requestId: string,
  result: ApprovalRefreshResult,
): {
  readonly chrome: TaskApprovalChrome
  readonly request: TaskApprovalRequest | null
} {
  if (result.kind !== 'row') {
    return { chrome, request: null }
  }
  const cleared = withoutApprovalRefusal(chrome, taskId, requestId)
  return {
    chrome: {
      ...cleared,
      focusResultSeq: cleared.focusResultSeq + 1,
    },
    request: result.request,
  }
}
