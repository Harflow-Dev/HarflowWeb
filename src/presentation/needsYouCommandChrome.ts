import type { AnswerWorkflowAttentionCheckpointUseCase } from '../application'
import type {
  ApprovalDecision,
  ApprovalRespondOutcome,
  NeedsYouTaskApproval,
  NeedsYouWorkflowApproval,
  TaskId,
  WorkflowRunId,
} from '../model'
import {
  withCheckpointEntry,
  withTaskApprovalChrome,
  type NeedsYouChrome,
} from './needsYouChrome'
import type { TaskApprovalRegistry } from './taskApprovalRegistry'

export function taskRespondChrome(
  chrome: NeedsYouChrome,
  registry: TaskApprovalRegistry,
  item: NeedsYouTaskApproval,
  taskId: TaskId,
  decision: ApprovalDecision,
  outcome: ApprovalRespondOutcome,
  itemId: string,
): { chrome: NeedsYouChrome; updatedItem: NeedsYouTaskApproval | null } {
  const priorFocus = chrome.taskApprovals.focusResultSeq
  const { chrome: nextTask, acceptedRequest } = registry.applyRespond(
    taskId,
    item,
    decision,
    outcome,
    taskId,
  )
  const nextChrome = withTaskApprovalChrome(
    chrome,
    { ...nextTask, focusResultSeq: priorFocus + 1 },
    itemId,
  )
  if (acceptedRequest === null) {
    return { chrome: nextChrome, updatedItem: null }
  }
  const updated: NeedsYouTaskApproval = {
    ...item,
    requestId: acceptedRequest.requestId,
    ownerRevision: acceptedRequest.ownerRevision,
    request: acceptedRequest,
  }
  return { chrome: nextChrome, updatedItem: updated }
}

export function checkpointAnswerChrome(
  chrome: NeedsYouChrome,
  item: NeedsYouWorkflowApproval,
  runId: WorkflowRunId,
  decision: ApprovalDecision,
  outcome: Awaited<
    ReturnType<AnswerWorkflowAttentionCheckpointUseCase['execute']>
  >,
  itemId: string,
): NeedsYouChrome {
  if (outcome.kind === 'checkpoint_stale') {
    return withCheckpointEntry(
      chrome,
      runId,
      item.attentionCheckpointId,
      { kind: 'checkpoint_stale' },
      itemId,
    )
  }
  if (outcome.kind === 'refused') {
    return withCheckpointEntry(
      chrome,
      runId,
      item.attentionCheckpointId,
      { kind: 'refused', code: outcome.code },
      itemId,
    )
  }
  if (outcome.kind === 'unknown') {
    return withCheckpointEntry(
      chrome,
      runId,
      item.attentionCheckpointId,
      {
        kind: 'non_actionable',
        attentionCheckpointId: item.attentionCheckpointId,
      },
      itemId,
    )
  }
  return withCheckpointEntry(
    chrome,
    runId,
    item.attentionCheckpointId,
    { kind: 'answered', decision },
    itemId,
  )
}
