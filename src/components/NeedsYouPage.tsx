import type { NeedsYouLoad, TaskId, WorkflowRunId } from '../model'
import { Icon } from './Icon'
import { NeedsYouCard } from './NeedsYouCard'

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
          <NeedsYouCard
            key={item.id}
            item={item}
            unavailableId={UNAVAILABLE_ID}
            onOpenTask={onOpenTask}
            onOpenRun={onOpenRun}
          />
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
        <NeedsYouCard
          key={item.id}
          item={item}
          unavailableId={UNAVAILABLE_ID}
          onOpenTask={onOpenTask}
          onOpenRun={onOpenRun}
        />
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
