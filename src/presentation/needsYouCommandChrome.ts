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
import type { NeedsYouCheckpointEntry } from './needsYouCheckpointCardView'
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

function checkpointAnswerEntry(
  item: NeedsYouWorkflowApproval,
  decision: ApprovalDecision,
  outcome: Awaited<
    ReturnType<AnswerWorkflowAttentionCheckpointUseCase['execute']>
  >,
): NeedsYouCheckpointEntry {
  switch (outcome.kind) {
    case 'checkpoint_stale':
      return { kind: 'checkpoint_stale' }
    case 'refused':
      return {
        kind: 'refused',
        code: outcome.code,
        ...(outcome.interaction === undefined
          ? {}
          : { interaction: outcome.interaction }),
      }
    case 'unknown':
      return {
        kind: 'non_actionable',
        attentionCheckpointId: item.attentionCheckpointId,
      }
    default:
      return { kind: 'answered', decision }
  }
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
  return withCheckpointEntry(
    chrome,
    runId,
    item.attentionCheckpointId,
    checkpointAnswerEntry(item, decision, outcome),
    itemId,
  )
}
