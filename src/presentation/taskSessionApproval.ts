/**
 * Task-session helpers for approval respond / refresh chrome.
 */
import type {
  ApprovalDecision,
  ApprovalRespondOutcome,
  TaskApprovalRequest,
  TaskId,
  TaskLoad,
} from '../model'
import {
  EMPTY_TASK_APPROVAL,
  type TaskApprovalChrome,
  type TaskApprovalRefusalEntry,
  withApprovalRefusal,
  withoutApprovalRefusal,
} from './taskApprovalChrome'
import type { TaskScreenState } from './taskState'

export type TaskApprovalSeed = {
  readonly refusals?: readonly TaskApprovalRefusalEntry[]
}

export function seededApprovalChromeState(
  state: TaskScreenState,
  taskId: TaskId,
  seed: TaskApprovalSeed,
): TaskScreenState | null {
  if (state.selectedTaskId !== taskId) return null
  if (state.load.kind !== 'ready') return null
  return {
    ...state,
    approvalChrome: {
      refusals: seed.refusals ?? [],
      submitting: false,
      focusResultSeq: 0,
    },
  }
}

export function approvalSubmittingState(
  state: TaskScreenState,
  submitting: boolean,
): TaskScreenState {
  return {
    ...state,
    approvalChrome: { ...state.approvalChrome, submitting },
  }
}

export function approvalRespondedState(
  state: TaskScreenState,
  requestId: string,
  outcome: ApprovalRespondOutcome,
): TaskScreenState {
  if (outcome.kind === 'refused') {
    return {
      ...state,
      approvalChrome: withApprovalRefusal(
        state.approvalChrome,
        requestId,
        outcome.refusal,
      ),
    }
  }
  if (outcome.kind === 'accepted') {
    return mergeAcceptedApproval(state, outcome.request)
  }
  return approvalSubmittingState(state, false)
}

function mergeAcceptedApproval(
  state: TaskScreenState,
  request: TaskApprovalRequest,
): TaskScreenState {
  const load = withApprovalOnLoad(state.load, request)
  return {
    ...state,
    load,
    approvalChrome: withoutApprovalRefusal(
      state.approvalChrome,
      request.requestId,
    ),
  }
}

export function approvalRefreshedState(
  state: TaskScreenState,
  requestId: string,
  request: TaskApprovalRequest | null,
): TaskScreenState {
  const chrome = withoutApprovalRefusal(state.approvalChrome, requestId)
  if (request === null) {
    return { ...state, approvalChrome: chrome }
  }
  return {
    ...state,
    load: withApprovalOnLoad(state.load, request),
    approvalChrome: chrome,
  }
}

function withApprovalOnLoad(
  load: TaskLoad,
  request: TaskApprovalRequest,
): TaskLoad {
  if (load.kind !== 'ready') return load
  const awaiting =
    request.disposition === 'pending' &&
    request.delivery === 'pending' &&
    request.decision === null
      ? 1
      : 0
  return {
    kind: 'ready',
    observation: {
      ...load.observation,
      approval: request,
      approvalSummary: { awaitingDecisionCount: awaiting },
    },
  }
}

export function currentApprovalRequest(
  state: TaskScreenState,
): TaskApprovalRequest | null {
  if (state.load.kind !== 'ready') return null
  return state.load.observation.approval ?? null
}

export type ApprovalRespondArgs = {
  readonly decision: ApprovalDecision
}

/** Reset chrome when a new task identity loads. */
export function resetApprovalChrome(): TaskApprovalChrome {
  return EMPTY_TASK_APPROVAL
}
