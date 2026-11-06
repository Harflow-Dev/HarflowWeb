import type {
  WorkflowNodeId,
  WorkflowRunNode,
  WorkflowRunNodeStatus,
  WorkflowRunObservation,
} from '../model'
import { workflowRunScene } from '../presentation'
import { Icon } from './Icon'

const SCALE = 0.7

type Props = {
  readonly run: WorkflowRunObservation
  readonly selectedNodeId: WorkflowNodeId
}

/** Read-only run graph. Scale stays at the specimen 70%; overflow scrolls. */
export function WorkflowRunCanvas({ run, selectedNodeId }: Props) {
  const scene = workflowRunScene(run)
  const markerId = `run-edge-${run.runId}`
  const active = new Set(run.edges.filter((edge) => edge.active).map((edge) => edge.id))
  const drawn = scene.routes.filter((route): route is Extract<typeof route, { d: string }> => 'd' in route)
  const resting = drawn.filter((route) => !active.has(route.id))
  const live = drawn.filter((route) => active.has(route.id))
  return (
    <div className="hd-canvas">
      <div
        className="hd-canvas__port hd-thin-scroll"
        role="region"
        aria-label="Workflow graph"
        tabIndex={0}
        style={{ scrollbarGutter: 'auto' }}
      >
        <div aria-hidden="true" style={{ width: scene.width * SCALE, height: scene.height * SCALE }}>
          <div
            style={{
              width: scene.width,
              height: scene.height,
              transform: `scale(${SCALE})`,
              transformOrigin: '0 0',
            }}
          >
            <EdgeLayer
              className="hd-edge"
              markerId={markerId}
              width={scene.width}
              height={scene.height}
              routes={resting}
            />
            <EdgeLayer
              className="hd-edge hd-edge--active"
              markerId={markerId}
              width={scene.width}
              height={scene.height}
              routes={live}
              defineMarker
            />
            {run.nodes
              .filter((node) => node.placement === 'path')
              .map((node) => (
                <PathNode
                  key={node.id}
                  node={node}
                  selected={node.id === selectedNodeId}
                />
              ))}
          </div>
        </div>
      </div>
      <NodeList run={run} selectedNodeId={selectedNodeId} />
    </div>
  )
}

function NodeList({
  run,
  selectedNodeId,
}: {
  readonly run: WorkflowRunObservation
  readonly selectedNodeId: WorkflowNodeId
}) {
  return (
    <ul className="hd-sr" aria-label={run.graphLabel}>
      {run.nodes.map((node) => {
        const selected = node.id === selectedNodeId
        return (
          <li key={node.id} aria-current={selected ? 'true' : undefined}>
            {`${node.title}, ${statusName(node.status)}, ${selected ? 'selected' : 'not selected'}`}
          </li>
        )
      })}
    </ul>
  )
}

function statusName(status: WorkflowRunNodeStatus): string {
  if (status === 'done') return 'Done'
  if (status === 'needs-you') return 'Needs you'
  if (status === 'pending') return 'Pending'
  return 'Not called'
}

function EdgeLayer({
  className,
  markerId,
  width,
  height,
  routes,
  defineMarker = false,
}: {
  readonly className: string
  readonly markerId: string
  readonly width: number
  readonly height: number
  readonly routes: readonly { id: string; d: string; loop: boolean }[]
  readonly defineMarker?: boolean
}) {
  return (
    <svg className={className} style={{ left: 0, top: 0 }} width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {defineMarker ? (
        <defs>
          <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
            <path className="hd-edge__chevron" d="M2 1 L9 5 L2 9" />
          </marker>
        </defs>
      ) : null}
      {routes.map((route) => (
        <path key={route.id} d={route.d} markerEnd={`url(#${markerId})`} />
      ))}
    </svg>
  )
}

function PathNode({
  node,
  selected,
}: {
  readonly node: WorkflowRunNode
  readonly selected: boolean
}) {
  if (!node.frame) return null
  const tone =
    node.status === 'done' ? ' hd-node--done' : node.status === 'needs-you' ? ' hd-node--waiting' : ''
  return (
    <div
      className={`hd-node${tone}${selected ? ' is-selected' : ''}`}
      style={{
        left: node.frame.x,
        top: node.frame.y,
        minWidth: 0,
        width: node.frame.width,
        height: node.frame.height,
      }}
    >
      <div className="hd-node__head" style={{ whiteSpace: 'nowrap' }}>
        <NodeMark node={node} />
        <span>{node.title}</span>
      </div>
      <div className="hd-node__kind">{node.kindLabel}</div>
      <div className="hd-node__meta">{node.meta}</div>
    </div>
  )
}

function NodeMark({ node }: { readonly node: WorkflowRunNode }) {
  if (node.status === 'done') {
    return (
      <span className="hd-glyph hd-glyph--done" aria-label="Done">
        <Icon name="check" size="sm" />
      </span>
    )
  }
  if (node.status === 'needs-you') {
    return (
      <span className="hd-glyph hd-glyph--attention" aria-label="Needs you">
        <Icon name="hand" size="sm" />
      </span>
    )
  }
  return <span className="hd-glyph hd-glyph--queued" aria-label="Pending" />
}
