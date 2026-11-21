import type {
  RefreshTaskApprovalUseCase,
  RefreshWorkflowAttentionCheckpointUseCase,
} from '../application'
import type {
  ApprovalDecision,
  ApprovalRespondOutcome,
  NeedsYouItem,
  NeedsYouTaskApproval,
  NeedsYouWorkflowApproval,
  TaskId,
  WorkflowCheckpointAnswerOutcome,
  WorkflowCheckpointPendingProjection,
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
import type { TaskApprovalRegistry } from './taskApprovalRegistry'

function samePath(
  a: readonly string[],
  b: readonly string[],
): boolean {
  if (a.length !== b.length) return false
  return a.every((part, i) => part === b[i])
}

/** Match a pending_attention projection to the card's node + path. */
export function matchingPendingProjection(
  item: NeedsYouWorkflowApproval,
  pending: readonly WorkflowCheckpointPendingProjection[],
): WorkflowCheckpointPendingProjection | null {
  return (
    pending.find(
      (row) =>
        row.nodeId === item.nodeId && samePath(row.path, item.path),
    ) ?? null
  )
}

export function applyTaskRespond(
  state: NeedsYouScreenState,
  registry: TaskApprovalRegistry,
  item: NeedsYouTaskApproval,
  taskId: TaskId,
  decision: ApprovalDecision,
  outcome: ApprovalRespondOutcome,
): NeedsYouScreenState {
  const { chrome, updatedItem } = taskRespondChrome(
    state.chrome,
    registry,
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
  return { ...state, chrome, displayItems }
}

export function applyTaskRefresh(
  state: NeedsYouScreenState,
  registry: TaskApprovalRegistry,
  item: NeedsYouTaskApproval,
  taskId: TaskId,
  result: Awaited<ReturnType<RefreshTaskApprovalUseCase['execute']>>,
): NeedsYouScreenState {
  const { chrome: taskChrome, request } = registry.applyRefresh(
    taskId,
    item.requestId,
    result,
  )
  if (request === null) return state
  // Only replace when the refreshed row is the same request id (task-screen
  // withApprovalOnLoad rule). Never swap the card onto a different request.
  if (request.requestId !== item.requestId) {
    return {
      ...state,
      chrome: withTaskApprovalChrome(
        state.chrome,
        {
          ...taskChrome,
          focusResultSeq: state.chrome.taskApprovals.focusResultSeq + 1,
        },
        item.id,
      ),
    }
  }
  const updated: NeedsYouTaskApproval = {
    ...item,
    requestId: request.requestId,
    ownerRevision: request.ownerRevision,
    request,
  }
  const displayItems = state.displayItems.map((row) =>
    row.id === item.id ? updated : row,
  )
  const chrome: NeedsYouChrome = withTaskApprovalChrome(
    state.chrome,
    {
      ...taskChrome,
      focusResultSeq: state.chrome.taskApprovals.focusResultSeq + 1,
    },
    item.id,
  )
  return { ...state, chrome, displayItems }
}

export function applyCheckpointAnswer(
  state: NeedsYouScreenState,
  item: NeedsYouWorkflowApproval,
  runId: WorkflowRunId,
  decision: ApprovalDecision,
  outcome: WorkflowCheckpointAnswerOutcome,
): NeedsYouScreenState {
  const chrome = checkpointAnswerChrome(
    state.chrome,
    item,
    runId,
    decision,
    outcome,
    item.id,
  )
  return { ...state, chrome }
}

function refreshedCheckpointItem(
  item: NeedsYouWorkflowApproval,
  matched: WorkflowCheckpointPendingProjection,
): NeedsYouWorkflowApproval {
  return {
    ...item,
    attentionCheckpointId: matched.attentionCheckpointId,
    exactAction: matched.exactAction,
    context: {
      ...item.context,
      step: matched.nodeTitle ?? item.context.step,
    },
  }
}

function withResultFocus(chrome: NeedsYouChrome, itemId: string): NeedsYouChrome {
  return {
    ...chrome,
    focusResultSeq: chrome.focusResultSeq + 1,
    focusItemId: itemId,
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
  // No matching pending row means absent: keep the non-decidable chrome.
  const matched = matchingPendingProjection(item, result.pending)
  if (matched === null) return state
  const cleared = withoutCheckpointStale(state.chrome, runId, sentToken)
  if (matched.attentionCheckpointId !== sentToken) {
    const updated = refreshedCheckpointItem(item, matched)
    return {
      ...state,
      chrome: withResultFocus(cleared, item.id),
      displayItems: state.displayItems.map((row) =>
        row.id === item.id ? updated : row,
      ),
    }
  }
  const stale =
    checkpointEntryFor(state.chrome, runId, sentToken)?.kind ===
    'checkpoint_stale'
  const chrome = stale
    ? withCheckpointEntry(
        cleared,
        runId,
        sentToken,
        { kind: 'checkpoint_stale' },
        item.id,
      )
    : withResultFocus(cleared, item.id)
  return { ...state, chrome }
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
