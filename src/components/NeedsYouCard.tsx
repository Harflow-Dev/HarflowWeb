import type { NeedsYouItem, TaskId, WorkflowRunId } from '../model'
import { needsYouContextText } from '../model'
import { Icon } from './Icon'

export function NeedsYouCard({
  item,
  unavailableId,
  onOpenTask,
  onOpenRun,
}: {
  readonly item: NeedsYouItem
  readonly unavailableId: string
  readonly onOpenTask: (taskId: TaskId) => void
  readonly onOpenRun: (runId: WorkflowRunId) => void
}) {
  const label = item.kind === 'approval' ? item.actionLabel : 'Asks a question'
  return (
    <section className="hd-approval" aria-label={label}>
      <div className="hd-approval__head">
        <Icon name="hand" />
        <span>{label}</span>
        <span className="hd-approval__src">{needsYouContextText(item.context)}</span>
      </div>
      <div className="hd-approval__body">
        {item.kind === 'approval' ? (
          <div className="hd-approval__cmd">{item.exactAction}</div>
        ) : (
          <p style={{ margin: 0 }}>{item.prompt}</p>
        )}
        <div className="hd-approval__meta">{item.detail}</div>
      </div>
      {item.kind === 'approval' ? (
        <ApprovalActions
          item={item}
          unavailableId={unavailableId}
          onOpenTask={onOpenTask}
          onOpenRun={onOpenRun}
        />
      ) : (
        <QuestionActions
          item={item}
          unavailableId={unavailableId}
          onOpenTask={onOpenTask}
          onOpenRun={onOpenRun}
        />
      )}
    </section>
  )
}

function ApprovalActions({
  item,
  unavailableId,
  onOpenTask,
  onOpenRun,
}: {
  readonly item: Extract<NeedsYouItem, { kind: 'approval' }>
  readonly unavailableId: string
  readonly onOpenTask: (taskId: TaskId) => void
  readonly onOpenRun: (runId: WorkflowRunId) => void
}) {
  return (
    <div className="hd-approval__actions">
      <UnavailableButton label={item.approveLabel} tone="primary" unavailableId={unavailableId} />
      <UnavailableButton label={item.rejectLabel} tone="secondary" unavailableId={unavailableId} />
      <span style={{ flex: 1 }} />
      <DestinationButton
        item={item}
        unavailableId={unavailableId}
        onOpenTask={onOpenTask}
        onOpenRun={onOpenRun}
      />
    </div>
  )
}

function QuestionActions({
  item,
  unavailableId,
  onOpenTask,
  onOpenRun,
}: {
  readonly item: Extract<NeedsYouItem, { kind: 'question' }>
  readonly unavailableId: string
  readonly onOpenTask: (taskId: TaskId) => void
  readonly onOpenRun: (runId: WorkflowRunId) => void
}) {
  const replyId = `needs-you-reply-${item.id}`
  return (
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
      <UnavailableButton label="Send" tone="primary" unavailableId={unavailableId} />
      <DestinationButton
        item={item}
        unavailableId={unavailableId}
        onOpenTask={onOpenTask}
        onOpenRun={onOpenRun}
      />
    </div>
  )
}

function DestinationButton({
  item,
  unavailableId,
  onOpenTask,
  onOpenRun,
}: {
  readonly item: NeedsYouItem
  readonly unavailableId: string
  readonly onOpenTask: (taskId: TaskId) => void
  readonly onOpenRun: (runId: WorkflowRunId) => void
}) {
  if (item.context.kind === 'workflow') {
    const runId = item.context.runId
    if (runId === null) {
      return (
        <UnavailableButton
          label="Open run"
          tone="ghost"
          icon
          unavailableId={unavailableId}
        />
      )
    }
    return (
      <button
        type="button"
        className="hd-btn hd-btn--ghost"
        aria-label={`Open run ${item.context.title}`}
        onClick={() => onOpenRun(runId)}
      >
        <Icon name="external" />
        Open run
      </button>
    )
  }
  if (item.context.taskId === null) {
    return (
      <UnavailableButton
        label="Open task"
        tone="ghost"
        icon
        accessibleName={`Open task ${item.context.title}`}
        unavailableId={unavailableId}
      />
    )
  }
  const taskId = item.context.taskId
  return (
    <button
      type="button"
      className="hd-btn hd-btn--ghost"
      aria-label={`Open task ${item.context.title}`}
      onClick={() => onOpenTask(taskId)}
    >
      <Icon name="external" />
      Open task
    </button>
  )
}

function UnavailableButton({
  label,
  tone,
  icon = false,
  accessibleName,
  unavailableId,
}: {
  readonly label: string
  readonly tone: 'primary' | 'secondary' | 'ghost'
  readonly icon?: boolean
  readonly accessibleName?: string
  readonly unavailableId: string
}) {
  return (
    <button
      type="button"
      className={`hd-btn hd-btn--${tone}`}
      aria-label={accessibleName}
      aria-disabled="true"
      aria-describedby={unavailableId}
      disabled
      style={{ opacity: 0.45, cursor: 'default' }}
    >
      {icon ? <Icon name="external" /> : null}
      {label}
    </button>
  )
}
