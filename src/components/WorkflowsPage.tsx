import type { WorkflowSummary } from '../model'
import { Icon } from './Icon'

type Props = {
  readonly workflows: readonly WorkflowSummary[]
  readonly onUnavailable: (label: string) => void
}

export function WorkflowsPage({ workflows, onUnavailable }: Props) {
  if (workflows.length === 0) {
    return <WorkflowsEmpty onUnavailable={onUnavailable} />
  }
  return (
    <div className="hd-page">
      <div className="hd-page__head">
        <h1 className="hd-page__title">Workflows</h1>
        <button
          type="button"
          className="hd-btn hd-btn--secondary"
          aria-label="New workflow (unavailable in this slice)"
          title="New workflow — unavailable in this slice"
          onClick={() => onUnavailable('New workflow')}
        >
          <Icon name="plus" size="sm" />
          New workflow
        </button>
      </div>
      <div className="hd-list" role="list">
        {workflows.map((row) => (
          <WorkflowRow key={row.id} row={row} onUnavailable={onUnavailable} />
        ))}
      </div>
    </div>
  )
}

function WorkflowsEmpty({
  onUnavailable,
}: {
  onUnavailable: (label: string) => void
}) {
  return (
    <div className="hd-page">
      <div className="hd-page__head">
        <h1 className="hd-page__title">Workflows</h1>
      </div>
      <div className="hd-empty" style={{ paddingTop: 120 }}>
        <div className="hd-empty__icon">
          <Icon name="workflow" />
        </div>
        <div className="hd-empty__title">No workflows yet</div>
        <div className="hd-empty__text">
          A workflow chains agents into steps you can run again. Build one on the
          canvas, or describe what you need and an agent drafts it.
        </div>
        <div
          className="hd-row"
          style={{ justifyContent: 'center', marginTop: 'var(--space-3)' }}
        >
          <button
            type="button"
            className="hd-btn hd-btn--primary"
            aria-label="New workflow (unavailable in this slice)"
            title="New workflow — unavailable in this slice"
            onClick={() => onUnavailable('New workflow')}
          >
            <Icon name="plus" size="sm" />
            New workflow
          </button>
          <button
            type="button"
            className="hd-btn hd-btn--secondary"
            aria-label="Describe one to an agent (unavailable in this slice)"
            title="Describe one to an agent — unavailable in this slice"
            onClick={() => onUnavailable('Describe one to an agent')}
          >
            Describe one to an agent
          </button>
        </div>
      </div>
    </div>
  )
}

function WorkflowRow({
  row,
  onUnavailable,
}: {
  row: WorkflowSummary
  onUnavailable: (label: string) => void
}) {
  return (
    <div className="hd-list-row" role="listitem">
      <span className="hd-list-row__icon">
        <Icon name="workflow" />
      </span>
      <span className="hd-list-row__body">
        <span className="hd-list-row__title">{row.title}</span>
        <span className="hd-list-row__desc">{row.description}</span>
      </span>
      <span className="hd-list-row__meta">
        <span>
          {row.nodeCount} {row.nodeCount === 1 ? 'node' : 'nodes'}
        </span>
      </span>
      <span className="hd-list-row__actions">
        <button
          type="button"
          className="hd-btn hd-btn--ghost"
          aria-label={`Edit ${row.title} (unavailable in this slice)`}
          title="Edit — unavailable in this slice"
          onClick={() => onUnavailable(`Edit ${row.title}`)}
        >
          <Icon name="pencil" size="sm" />
          Edit
        </button>
        <button
          type="button"
          className="hd-btn hd-btn--secondary"
          aria-label={`Run ${row.title} (unavailable in this slice)`}
          title="Run — unavailable in this slice"
          onClick={() => onUnavailable(`Run ${row.title}`)}
        >
          <Icon name="play" size="sm" />
          Run
        </button>
      </span>
    </div>
  )
}
