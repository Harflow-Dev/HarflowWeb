import type {
  AnswerWorkflowAttentionCheckpointUseCase,
  RespondTaskApprovalUseCase,
} from '../application'
import type {
  ApprovalDecision,
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
import { refusalEntry, withApprovalEntry } from './taskApprovalChrome'

export function taskRespondChrome(
  chrome: NeedsYouChrome,
  item: NeedsYouTaskApproval,
  taskId: TaskId,
  decision: ApprovalDecision,
  outcome: Awaited<ReturnType<RespondTaskApprovalUseCase['execute']>>,
  itemId: string,
): { chrome: NeedsYouChrome; updatedItem: NeedsYouTaskApproval | null } {
  if (outcome.kind === 'refused') {
    const entry = refusalEntry(
      taskId,
      item.requestId,
      item.ownerRevision,
      outcome.refusal,
    )
    return {
      chrome: withTaskApprovalChrome(
        chrome,
        withApprovalEntry(chrome.taskApprovals, entry, taskId),
        itemId,
      ),
      updatedItem: null,
    }
  }
  if (outcome.kind === 'unknown') {
    return {
      chrome: withTaskApprovalChrome(
        chrome,
        withApprovalEntry(
          chrome.taskApprovals,
          {
            kind: 'non_actionable',
            taskId,
            requestId: item.requestId,
            ownerRevision: item.ownerRevision,
          },
          taskId,
        ),
        itemId,
      ),
      updatedItem: null,
    }
  }
  const updated: NeedsYouTaskApproval = {
    ...item,
    requestId: outcome.request.requestId,
    ownerRevision: outcome.request.ownerRevision,
    request: outcome.request,
  }
  const nextChrome = withTaskApprovalChrome(
    chrome,
    withApprovalEntry(
      chrome.taskApprovals,
      {
        kind: 'answered',
        taskId,
        requestId: item.requestId,
        decision,
      },
      taskId,
    ),
    itemId,
  )
  return {
    chrome: {
      ...nextChrome,
      retainedItems: nextChrome.retainedItems.some((r) => r.id === updated.id)
        ? nextChrome.retainedItems
        : [...nextChrome.retainedItems, updated],
    },
    updatedItem: updated,
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
  if (outcome.kind === 'checkpoint_stale') {
    return withCheckpointEntry(
      chrome,
      runId,
      item.attentionCheckpointId,
      { kind: 'checkpoint_stale' },
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
  const next = withCheckpointEntry(
    chrome,
    runId,
    item.attentionCheckpointId,
    { kind: 'answered', decision },
    itemId,
  )
  return {
    ...next,
    retainedItems: next.retainedItems.some((r) => r.id === item.id)
      ? next.retainedItems
      : [...next.retainedItems, item],
  }
}