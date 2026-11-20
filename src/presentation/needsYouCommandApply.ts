import type {
  AnswerWorkflowAttentionCheckpointUseCase,
  RefreshTaskApprovalUseCase,
  RefreshWorkflowAttentionCheckpointUseCase,
  RespondTaskApprovalUseCase,
} from '../application'
import type {
  ApprovalDecision,
  NeedsYouItem,
  NeedsYouTaskApproval,
  NeedsYouWorkflowApproval,
  TaskId,
  WorkflowRunId,
} from '../model'
import { mergeNeedsYouDisplay } from './needsYouDisplay'
import {
  checkpointAnswerChrome,
  taskRespondChrome,
} from './needsYouCommandChrome'
import {
  checkpointEntryFor,
  withCheckpointEntry,
  withoutCheckpointStale,
  withTaskApprovalChrome,
  type NeedsYouChrome,
} from './needsYouChrome'
import type { NeedsYouScreenState } from './needsYouState'
import { withoutApprovalRefusal } from './taskApprovalChrome'

export function applyTaskRespond(
  state: NeedsYouScreenState,
  item: NeedsYouTaskApproval,
  taskId: TaskId,
  decision: ApprovalDecision,
  outcome: Awaited<ReturnType<RespondTaskApprovalUseCase['execute']>>,
  key: string,
): NeedsYouScreenState {
  const { chrome, updatedItem } = taskRespondChrome(
    state.chrome,
    item,
    taskId,
    decision,
    outcome,
    item.id,
  )
  const displayItems =
    updatedItem === null
      ? state.displayItems
      : state.displayItems.map((row) =>
          row.id === item.id ? updatedItem : row,
        )
  return {
    ...state,
    chrome,
    displayItems,
    submittingKey: state.submittingKey === key ? null : state.submittingKey,
  }
}

export function applyTaskRefresh(
  state: NeedsYouScreenState,
  item: NeedsYouTaskApproval,
  taskId: TaskId,
  result: Awaited<ReturnType<RefreshTaskApprovalUseCase['execute']>>,
): NeedsYouScreenState {
  if (result.kind !== 'row') return state
  const updated: NeedsYouTaskApproval = {
    ...item,
    requestId: result.request.requestId,
    ownerRevision: result.request.ownerRevision,
    request: result.request,
  }
  const displayItems = state.displayItems.map((row) =>
    row.id === item.id ? updated : row,
  )
  const taskApprovals = withoutApprovalRefusal(
    state.chrome.taskApprovals,
    taskId,
    item.requestId,
  )
  const chrome: NeedsYouChrome = {
    ...withTaskApprovalChrome(
      state.chrome,
      { ...taskApprovals, focusResultSeq: taskApprovals.focusResultSeq + 1 },
      item.id,
    ),
    retainedItems: state.chrome.retainedItems.filter((r) => r.id !== item.id),
  }
  return { ...state, chrome, displayItems }
}

export function applyCheckpointAnswer(
  state: NeedsYouScreenState,
  item: NeedsYouWorkflowApproval,
  runId: WorkflowRunId,
  decision: ApprovalDecision,
  outcome: Awaited<
    ReturnType<AnswerWorkflowAttentionCheckpointUseCase['execute']>
  >,
  key: string,
): NeedsYouScreenState {
  const chrome = checkpointAnswerChrome(
    state.chrome,
    item,
    runId,
    decision,
    outcome,
    item.id,
  )
  return {
    ...state,
    chrome,
    submittingKey: state.submittingKey === key ? null : state.submittingKey,
  }
}

export function applyCheckpointRefresh(
  state: NeedsYouScreenState,
  item: NeedsYouWorkflowApproval,
  runId: WorkflowRunId,
  sentToken: string,
  result: Awaited<
    ReturnType<RefreshWorkflowAttentionCheckpointUseCase['execute']>
  >,
): NeedsYouScreenState {
  if (result.kind !== 'checkpoint') return state
  const sameToken = result.attentionCheckpointId === sentToken
  let chrome = withoutCheckpointStale(state.chrome, runId, sentToken)
  let displayItems = state.displayItems
  if (!sameToken) {
    const updated: NeedsYouWorkflowApproval = {
      ...item,
      attentionCheckpointId: result.attentionCheckpointId,
    }
    displayItems = state.displayItems.map((row) =>
      row.id === item.id ? updated : row,
    )
    chrome = {
      ...chrome,
      retainedItems: chrome.retainedItems.filter((r) => r.id !== item.id),
      focusResultSeq: chrome.focusResultSeq + 1,
      focusItemId: item.id,
    }
  } else {
    const entry = checkpointEntryFor(state.chrome, runId, sentToken)
    if (entry?.kind === 'checkpoint_stale') {
      chrome = withCheckpointEntry(
        chrome,
        runId,
        sentToken,
        { kind: 'checkpoint_stale' },
        item.id,
      )
    } else {
      chrome = {
        ...chrome,
        focusResultSeq: chrome.focusResultSeq + 1,
        focusItemId: item.id,
      }
    }
  }
  return { ...state, chrome, displayItems }
}

export function applyNeedsYouLoad(
  state: NeedsYouScreenState,
  load: import('../model').NeedsYouLoad,
): NeedsYouScreenState {
  const nextItems =
    load.kind === 'ready' ? load.observation.items : ([] as NeedsYouItem[])
  const displayItems = mergeNeedsYouDisplay(
    state.displayItems,
    nextItems,
    state.chrome,
  )
  return { ...state, load, displayItems }
}