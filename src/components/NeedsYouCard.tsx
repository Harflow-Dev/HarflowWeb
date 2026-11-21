import type {
  ApprovalDecision,
  NeedsYouItem,
  NeedsYouQuestion,
  TaskId,
  WorkflowRunId,
} from '../model'
import {
  isNeedsYouTaskApproval,
  isNeedsYouWorkflowApproval,
  needsYouContextText,
} from '../model'
import type { NeedsYouChrome } from '../presentation/needsYouChrome'
import { needsYouCardSubmitting } from '../presentation/needsYouCardSubmitting'
import {
  needsYouTaskApprovalViewFor,
} from '../presentation/needsYouApprovalCardView'
import {
  needsYouCheckpointCardView,
} from '../presentation/needsYouCheckpointCardView'
import { checkpointEntryFor } from '../presentation/needsYouChrome'
import { Icon } from './Icon'
import {
  CheckpointNeedsYouCard,
  TaskApprovalNeedsYouCard,
} from './NeedsYouApprovalCards'

export type NeedsYouCardActions = {
  readonly onRespondTask: (itemId: string, decision: ApprovalDecision) => void
  readonly onRefreshTask: (itemId: string) => void
  readonly onRespondCheckpoint: (
    itemId: string,
    decision: ApprovalDecision,
  ) => void
  readonly onRefreshCheckpoint: (itemId: string) => void
  readonly onOpenTask: (taskId: TaskId) => void
  readonly onOpenRun: (runId: WorkflowRunId) => void
}

export function NeedsYouCard({
  item,
  chrome,
  focusResultSeq,
  focusItemId,
  unavailableId,
  actions,
}: {
  readonly item: NeedsYouItem
  readonly chrome: NeedsYouChrome
  readonly focusResultSeq: number
  readonly focusItemId: string | null
  readonly unavailableId: string
  readonly actions: NeedsYouCardActions
}) {
  if (item.kind === 'question') {
    return (
      <QuestionCard
        item={item}
        unavailableId={unavailableId}
        onOpenTask={actions.onOpenTask}
      />
    )
  }
  if (isNeedsYouTaskApproval(item)) {
    const submitting = needsYouCardSubmitting(item, chrome)
    const view = needsYouTaskApprovalViewFor(
      item,
      chrome.taskApprovals,
      submitting,
    )
    return (
      <TaskApprovalNeedsYouCard
        itemId={item.id}
        view={view}
        focusResultSeq={focusItemId === item.id ? focusResultSeq : 0}
        actions={actions}
      />
    )
  }
  if (isNeedsYouWorkflowApproval(item)) {
    const runId = item.context.runId
    const entry =
      runId === null
        ? null
        : checkpointEntryFor(chrome, runId, item.attentionCheckpointId)
    const submitting = needsYouCardSubmitting(item, chrome)
    const view = needsYouCheckpointCardView(item, entry, submitting)
    return (
      <CheckpointNeedsYouCard
        itemId={item.id}
        view={view}
        focusResultSeq={focusItemId === item.id ? focusResultSeq : 0}
        actions={actions}
      />
    )
  }
  return null
}

function QuestionCard({
  item,
  unavailableId,
  onOpenTask,
}: {
  readonly item: NeedsYouQuestion
  readonly unavailableId: string
  readonly onOpenTask: (taskId: TaskId) => void
}) {
  const replyId = `needs-you-reply-${item.id}`
  return (
    <section className="hd-approval" aria-label="Asks a question">
      <div className="hd-approval__head">
        <Icon name="hand" />
        <span>Asks a question</span>
        <span className="hd-approval__src">
          {needsYouContextText(item.context)}
        </span>
      </div>
      <div className="hd-approval__body">
        <p style={{ margin: 0 }}>{item.prompt}</p>
        <div className="hd-approval__meta">{item.detail}</div>
      </div>
      <div className="hd-approval__actions" aria-label="Reply">
        <label className="hd-sr" htmlFor={replyId}>
          Reply
        </label>
        <input
          id={replyId}
          className="hd-input"
          type="text"
          placeholder="Type a reply"
          disabled
          aria-disabled="true"
          aria-describedby={unavailableId}
          style={{ flex: 1, width: 'auto', minWidth: 0 }}
        />
        <button
          type="button"
          className="hd-btn hd-btn--primary"
          disabled
          aria-disabled="true"
          aria-describedby={unavailableId}
          style={{ opacity: 0.45, cursor: 'default' }}
        >
          Send
        </button>
        {item.context.taskId === null ? (
          <button
            type="button"
            className="hd-btn hd-btn--ghost"
            aria-label={`Open task ${item.context.title}`}
            disabled
            aria-disabled="true"
            aria-describedby={unavailableId}
            style={{ opacity: 0.45, cursor: 'default' }}
          >
            <Icon name="external" />
            Open task
          </button>
        ) : (
          <button
            type="button"
            className="hd-btn hd-btn--ghost"
            aria-label={`Open task ${item.context.title}`}
            onClick={() => onOpenTask(item.context.taskId as TaskId)}
          >
            <Icon name="external" />
            Open task
          </button>
        )}
      </div>
    </section>
  )
}
