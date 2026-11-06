import type { WorkflowNodeId, WorkflowRunLoad, WorkflowRunNode, WorkflowRunObservation } from '../model'
import { resolveWorkflowRunSelection, workflowRunOnDemandFor } from '../presentation'
import { Icon } from './Icon'
import { WorkflowRunCanvas } from './WorkflowRunCanvas'
import { WorkflowRunDetail } from './WorkflowRunDetail'
import { WorkflowRunOnDemandPane } from './WorkflowRunOnDemandPane'
import {
  RUN_CALL_UNAVAILABLE_ID,
  RUN_UNAVAILABLE_ID,
  WORKFLOW_RUN_ACTION_EXPLANATION,
  WORKFLOW_RUN_CALL_EXPLANATION,
} from './workflowRunUnavailable'

type Props = {
  readonly load: WorkflowRunLoad
  readonly selectedNodeId?: WorkflowNodeId | null
  readonly onSelectNode?: (id: WorkflowNodeId | null) => void
}

/** Approved workflow-run graph. Mutations and unapproved node details stay disabled. */
export function WorkflowRunView({ load, selectedNodeId = null, onSelectNode }: Props) {
  if (load.kind === 'loading') {
    return <p role="status">Loading workflow run…</p>
  }
  if (load.kind === 'unavailable') {
    return <p role="status">{load.message}</p>
  }
  const run = load.run
  const display = resolveWorkflowRunSelection(run, selectedNodeId)
  return (
    <>
      <p id={RUN_UNAVAILABLE_ID} className="hd-sr">
        {WORKFLOW_RUN_ACTION_EXPLANATION}
      </p>
      <p id={RUN_CALL_UNAVAILABLE_ID} className="hd-sr">
        {WORKFLOW_RUN_CALL_EXPLANATION}
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
      <Standalone
        run={run}
        selectedNodeId={display.nodeId}
        {...(onSelectNode ? { onSelectNode } : {})}
      />
      <div className="hd-split">
        <WorkflowRunCanvas run={run} selectedNodeId={display.nodeId} />
        {display.onDemand ? (
          <WorkflowRunOnDemandPane
            detail={display.onDemand}
            onClose={() => onSelectNode?.(null)}
          />
        ) : (
          <WorkflowRunDetail detail={run.detail} />
        )}
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

function Standalone({
  run,
  selectedNodeId,
  onSelectNode,
}: {
  readonly run: WorkflowRunObservation
  readonly selectedNodeId: WorkflowNodeId
  readonly onSelectNode?: (id: WorkflowNodeId | null) => void
}) {
  const nodes = run.nodes.filter((node) => node.placement === 'standalone')
  return (
    <div className="hd-standalone" style={{ flex: 'none' }}>
      <span className="hd-standalone__label">
        <strong>Standalone</strong>
        Outside the workflow path
      </span>
      <div className="hd-standalone__nodes hd-thin-scroll">
        {nodes.map((node) => (
          <StandaloneNode
            key={node.id}
            node={node}
            selectable={workflowRunOnDemandFor(run, node.id) !== null}
            selected={node.id === selectedNodeId}
            {...(onSelectNode ? { onSelectNode } : {})}
          />
        ))}
      </div>
    </div>
  )
}

function StandaloneNode({
  node,
  selectable,
  selected,
  onSelectNode,
}: {
  readonly node: WorkflowRunNode
  readonly selectable: boolean
  readonly selected: boolean
  readonly onSelectNode?: (id: WorkflowNodeId | null) => void
}) {
  const pressed = selectable && selected
  return (
    <button
      type="button"
      className={`hd-node hd-node--ondemand${node.status === 'idle' ? ' hd-node--idle' : ''}${pressed ? ' is-selected' : ''}`}
      aria-label={standaloneName(node, pressed)}
      aria-pressed={selectable ? pressed : undefined}
      disabled={!selectable}
      aria-disabled={selectable ? undefined : 'true'}
      aria-describedby={selectable ? undefined : RUN_UNAVAILABLE_ID}
      onClick={() => {
        if (selectable) onSelectNode?.(node.id)
      }}
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
  )
}

function standaloneName(node: WorkflowRunNode, selected: boolean): string {
  const status = node.status === 'idle' ? 'not called' : 'done'
  return `${node.title}, on demand node, ${status}, ${selected ? 'selected' : 'not selected'}`
}
