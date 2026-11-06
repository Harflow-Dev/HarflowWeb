import type { WorkflowRunLoad, WorkflowRunNode } from '../model'
import { Icon } from './Icon'
import { WorkflowRunCanvas } from './WorkflowRunCanvas'
import { WorkflowRunDetail } from './WorkflowRunDetail'
import { RUN_UNAVAILABLE_ID, WORKFLOW_RUN_ACTION_EXPLANATION } from './workflowRunUnavailable'

type Props = {
  readonly load: WorkflowRunLoad
}

/** Approved workflow-run/graph-needs-you composition. Mutations stay disabled. */
export function WorkflowRunView({ load }: Props) {
  if (load.kind === 'loading') {
    return <p role="status">Loading workflow run…</p>
  }
  if (load.kind === 'unavailable') {
    return <p role="status">{load.message}</p>
  }
  const run = load.run
  return (
    <>
      <p id={RUN_UNAVAILABLE_ID} className="hd-sr">
        {WORKFLOW_RUN_ACTION_EXPLANATION}
      </p>
      <div className="hd-topbar">
        <span className="hd-topbar__title">{run.title}</span>
        <span className="hd-badge hd-badge--attention">
          <Icon name="hand" size="sm" />
          {run.statusLabel}
        </span>
        <span className="hd-topbar__meta">{run.progressLabel}</span>
        <span className="hd-topbar__spacer" />
        <div className="hd-seg" role="group" aria-label="Run view">
          <button type="button" className="hd-seg__item is-active" aria-current="page">
            Graph
          </button>
          <button
            type="button"
            className="hd-seg__item"
            disabled
            aria-disabled="true"
            aria-describedby={RUN_UNAVAILABLE_ID}
          >
            Parallel
          </button>
        </div>
        <DisabledBar label="Pause" icon="pause" />
        <DisabledBar label="Cancel run" />
        <button
          type="button"
          className="hd-btn hd-btn--icon hd-btn--sm"
          aria-label="More actions"
          disabled
          aria-disabled="true"
          aria-describedby={RUN_UNAVAILABLE_ID}
        >
          <Icon name="more" />
        </button>
      </div>
      <Standalone nodes={run.nodes.filter((node) => node.placement === 'standalone')} />
      <div className="hd-split">
        <WorkflowRunCanvas run={run} />
        <WorkflowRunDetail detail={run.detail} />
      </div>
    </>
  )
}

function DisabledBar({
  label,
  icon,
}: {
  readonly label: string
  readonly icon?: 'pause'
}) {
  return (
    <button
      type="button"
      className="hd-btn hd-btn--ghost"
      disabled
      aria-disabled="true"
      aria-describedby={RUN_UNAVAILABLE_ID}
      style={{ opacity: 0.45, cursor: 'default' }}
    >
      {icon ? <Icon name={icon} size="sm" /> : null}
      {label}
    </button>
  )
}

function Standalone({ nodes }: { readonly nodes: readonly WorkflowRunNode[] }) {
  return (
    <div className="hd-standalone" style={{ flex: 'none' }}>
      <span className="hd-standalone__label">
        <strong>Standalone</strong>
        Outside the workflow path
      </span>
      <div className="hd-standalone__nodes hd-thin-scroll">
        {nodes.map((node) => (
          <button
            key={node.id}
            type="button"
            className={`hd-node hd-node--ondemand${node.status === 'idle' ? ' hd-node--idle' : ''}`}
            aria-label={standaloneName(node)}
            disabled
            aria-disabled="true"
            aria-describedby={RUN_UNAVAILABLE_ID}
          >
            <div className="hd-node__kind">
              <Icon name="zap" size="sm" />
              {node.kindLabel}
            </div>
            <div className="hd-node__head">
              <span>{node.title}</span>
            </div>
            <div className="hd-node__meta">
              {node.status === 'done' ? (
                <span className="hd-glyph hd-glyph--done" aria-label="Done">
                  <Icon name="check" size="sm" />
                </span>
              ) : null}
              {node.meta}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function standaloneName(node: WorkflowRunNode): string {
  if (node.status === 'idle') return `${node.title}, on demand node, not called`
  return `${node.title}, on demand node, 2 calls`
}
