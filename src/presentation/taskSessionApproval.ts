/**
 * Task-session helpers for approval respond / refresh chrome.
 */
import type {
  ApprovalDecision,
  ApprovalRefreshResult,
  ApprovalRespondOutcome,
  TaskApprovalRequest,
  TaskId,
  TaskLoad,
} from '../model'
import {
  refusalEntry,
  withApprovalEntry,
  withoutApprovalRefusal,
  type TaskApprovalChrome,
  type TaskApprovalSeedRefusal,
} from './taskApprovalChrome'
import type { TaskScreenState } from './taskState'

export type TaskApprovalSeed = {
  readonly refusals?: readonly TaskApprovalSeedRefusal[]
}

export function currentApprovalRequest(
  state: TaskScreenState,
): TaskApprovalRequest | null {
  if (state.load.kind !== 'ready') return null
  return state.load.observation.approval ?? null
}

export function seededApprovalChromeState(
  state: TaskScreenState,
  taskId: TaskId,
  seed: TaskApprovalSeed,
): TaskScreenState | null {
  if (state.selectedTaskId !== taskId) return null
  if (state.load.kind !== 'ready') return null
  const revision = currentApprovalRequest(state)?.ownerRevision ?? 0
  return {
    ...state,
    approvalChrome: {
      entries: (seed.refusals ?? []).map((entry) =>
        refusalEntry(taskId, entry.requestId, revision, entry.refusal),
      ),
      submitting: false,
      focusResultSeq: 0,
    },
  }
}

export function approvalSubmittingState(
  state: TaskScreenState,
  submitting: boolean,
): TaskScreenState {
  if (state.approvalChrome.submitting === submitting) return state
  return {
    ...state,
    approvalChrome: { ...state.approvalChrome, submitting },
  }
}

function withChrome(
  state: TaskScreenState,
  approvalChrome: TaskApprovalChrome,
): TaskScreenState {
  return { ...state, approvalChrome }
}

/**
 * Record a respond acknowledgement. The chrome entry is keyed by request id
 * and is written even if another task is open, so an uncertain outcome is
 * never lost. An accepted row is merged only into the matching open request.
 */
export function approvalRespondedState(
  state: TaskScreenState,
  taskId: TaskId,
  sent: TaskApprovalRequest,
  decision: ApprovalDecision,
  outcome: ApprovalRespondOutcome,
): TaskScreenState {
  const chrome = state.approvalChrome
  if (outcome.kind === 'refused') {
    return withChrome(
      state,
      withApprovalEntry(
        chrome,
        refusalEntry(taskId, sent.requestId, sent.ownerRevision, outcome.refusal),
        state.selectedTaskId,
      ),
    )
  }
  if (outcome.kind === 'unknown') {
    return withChrome(
      state,
      withApprovalEntry(
        chrome,
        {
          kind: 'non_actionable',
          taskId,
          requestId: sent.requestId,
          ownerRevision: sent.ownerRevision,
        },
        state.selectedTaskId,
      ),
    )
  }
  const merged = withApprovalOnLoad(state, taskId, outcome.request)
  return withChrome(
    merged,
    withApprovalEntry(
      merged.approvalChrome,
      { kind: 'answered', taskId, requestId: sent.requestId, decision },
      state.selectedTaskId,
    ),
  )
}

/**
 * Apply a refresh result. Only a re-read row changes anything: `absent` and
 * `failed` keep every existing entry and show nothing new.
 */
export function approvalRefreshedState(
  state: TaskScreenState,
  taskId: TaskId,
  requestId: string,
  result: ApprovalRefreshResult,
): TaskScreenState {
  if (result.kind !== 'row') return state
  const merged = withApprovalOnLoad(state, taskId, result.request)
  const chrome = withoutApprovalRefusal(merged.approvalChrome, taskId, requestId)
  return withChrome(merged, {
    ...chrome,
    focusResultSeq: chrome.focusResultSeq + 1,
  })
}

/**
 * Replace the drawn row only when it is the currently observed request of
 * this task. The per-task awaiting count belongs to the observation feed and
 * is never recomputed from one row.
 */
function withApprovalOnLoad(
  state: TaskScreenState,
  taskId: TaskId,
  request: TaskApprovalRequest,
): TaskScreenState {
  const load: TaskLoad = state.load
  if (load.kind !== 'ready') return state
  const observation = load.observation
  if (observation.taskId !== taskId) return state
  if (observation.approval?.requestId !== request.requestId) return state
  return {
    ...state,
    load: { kind: 'ready', observation: { ...observation, approval: request } },
  }
}
