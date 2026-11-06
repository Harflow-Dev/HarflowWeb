import type { NeedsYouItem, NeedsYouLoad, TaskId, WorkflowRunId } from '../model'
import { needsYouContextText } from '../model'
import { Icon } from './Icon'

const UNAVAILABLE_ID = 'needs-you-action-unavailable'
export const NEEDS_YOU_ACTION_EXPLANATION =
  'Unavailable. This does not approve, reject, send an answer, or open a workflow run.'

type Props = {
  readonly load: NeedsYouLoad
  readonly onOpenTask: (taskId: TaskId) => void
  readonly onOpenRun: (runId: WorkflowRunId) => void
}

/** Approved needs-you/waiting and needs-you/empty composition. */
export function NeedsYouPage({ load, onOpenTask, onOpenRun }: Props) {
  return (
    <div className="hd-page">
      <div className="hd-page__head">
        <h1 className="hd-page__title">Needs you</h1>
        <WaitingBadge load={load} />
      </div>
      <NeedsYouBody load={load} onOpenTask={onOpenTask} onOpenRun={onOpenRun} />
    </div>
  )
}

function WaitingBadge({ load }: { readonly load: NeedsYouLoad }) {
  if (load.kind !== 'ready' || load.observation.coverage !== 'complete') {
    return null
  }
  if (load.observation.items.length === 0) return null
  return (
    <span className="hd-badge hd-badge--attention">
      {load.observation.items.length} waiting
    </span>
  )
}

function NeedsYouBody({
  load,
  onOpenTask,
  onOpenRun,
}: {
  readonly load: NeedsYouLoad
  readonly onOpenTask: (taskId: TaskId) => void
  readonly onOpenRun: (runId: WorkflowRunId) => void
}) {
  if (load.kind === 'loading') {
    return (
      <p role="status">
        Loading requests… (proposal — not a design-approved specimen)
      </p>
    )
  }
  if (load.kind === 'unavailable') {
    return <p role="status">{load.message}</p>
  }
  if (load.observation.coverage === 'partial') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <ActionExplanation />
        <p className="hd-sr">
          Fixture requests. Not commands or answers on this computer.
        </p>
        <p role="status">{load.observation.coverageNote}</p>
        <p className="caption">
          {load.observation.items.length} known. Not a complete total.
        </p>
        {load.observation.items.map((item) => (
          <NeedsYouCard key={item.id} item={item} onOpenTask={onOpenTask} onOpenRun={onOpenRun} />
        ))}
      </div>
    )
  }
  if (load.observation.items.length === 0) {
    return <NeedsYouEmpty />
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <ActionExplanation />
      <p className="hd-sr">
        Fixture requests. Not commands or answers on this computer.
      </p>
      {load.observation.items.map((item) => (
        <NeedsYouCard key={item.id} item={item} onOpenTask={onOpenTask} onOpenRun={onOpenRun} />
      ))}
    </div>
  )
}

function ActionExplanation() {
  return (
    <p id={UNAVAILABLE_ID} className="hd-sr">
      {NEEDS_YOU_ACTION_EXPLANATION}
    </p>
  )
}

function NeedsYouEmpty() {
  return (
    <div className="hd-empty" style={{ paddingTop: 120 }}>
      <div className="hd-empty__icon">
        <Icon name="hand" />
      </div>
      <div className="hd-empty__title">Nothing needs you</div>
      <div className="hd-empty__text">
        Approvals and questions from running tasks and workflows appear here,
        so you can answer them in one place.
      </div>
    </div>
  )
}

function NeedsYouCard({
  item,
  onOpenTask,
  onOpenRun,
}: {
  readonly item: NeedsYouItem
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
        <ApprovalActions item={item} onOpenTask={onOpenTask} onOpenRun={onOpenRun} />
      ) : (
        <QuestionActions item={item} onOpenTask={onOpenTask} onOpenRun={onOpenRun} />
      )}
    </section>
  )
}

function ApprovalActions({
  item,
  onOpenTask,
  onOpenRun,
}: {
  readonly item: Extract<NeedsYouItem, { kind: 'approval' }>
  readonly onOpenTask: (taskId: TaskId) => void
  readonly onOpenRun: (runId: WorkflowRunId) => void
}) {
  return (
    <div className="hd-approval__actions">
      <UnavailableButton label={item.approveLabel} tone="primary" />
      <UnavailableButton label={item.rejectLabel} tone="secondary" />
      <span style={{ flex: 1 }} />
      <DestinationButton item={item} onOpenTask={onOpenTask} onOpenRun={onOpenRun} />
    </div>
  )
}

function QuestionActions({
  item,
  onOpenTask,
  onOpenRun,
}: {
  readonly item: Extract<NeedsYouItem, { kind: 'question' }>
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
        aria-describedby={UNAVAILABLE_ID}
        style={{ flex: 1, width: 'auto', minWidth: 0 }}
      />
      <UnavailableButton label="Send" tone="primary" />
      <DestinationButton item={item} onOpenTask={onOpenTask} onOpenRun={onOpenRun} />
    </div>
  )
}

function DestinationButton({
  item,
  onOpenTask,
  onOpenRun,
}: {
  readonly item: NeedsYouItem
  readonly onOpenTask: (taskId: TaskId) => void
  readonly onOpenRun: (runId: WorkflowRunId) => void
}) {
  if (item.context.kind === 'workflow') {
    const runId = item.context.runId
    if (runId === null) return <UnavailableButton label="Open run" tone="ghost" icon />
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
}: {
  readonly label: string
  readonly tone: 'primary' | 'secondary' | 'ghost'
  readonly icon?: boolean
  readonly accessibleName?: string
}) {
  return (
    <button
      type="button"
      className={`hd-btn hd-btn--${tone}`}
      aria-label={accessibleName}
      aria-disabled="true"
      aria-describedby={UNAVAILABLE_ID}
      disabled
      style={{ opacity: 0.45, cursor: 'default' }}
    >
      {icon ? <Icon name="external" /> : null}
      {label}
    </button>
  )
}
