import type { WorkflowEditorDefinition, WorkflowEditorNode, WorkflowNodeId } from '../model'
import { workflowScene } from '../presentation'
import { Icon, type IconName } from './Icon'

const HELP_ID = 'workflow-editor-unavailable'
const SCALE = 0.65

type Props = {
  readonly definition: WorkflowEditorDefinition
  readonly selectedId: WorkflowNodeId | null
  readonly onSelect: (id: WorkflowNodeId) => void
}

/** Read-only canvas. The 65% specimen scale stays fixed; overflow scrolls instead of clipping. */
export function WorkflowEditorCanvas({ definition, selectedId, onSelect }: Props) {
  const scene = workflowScene(definition)
  const markerId = `workflow-edge-${definition.workflowId}`
  return (
    <div className="hd-canvas">
      <div
        className="hd-canvas__port hd-thin-scroll"
        aria-label="Workflow canvas"
        tabIndex={0}
        data-content-width={scene.width}
        data-content-height={scene.height}
      >
        <div style={{ width: scene.width * SCALE, height: scene.height * SCALE }}>
          <div
            style={{
              width: scene.width,
              height: scene.height,
              transform: `scale(${SCALE})`,
              transformOrigin: '0 0',
            }}
          >
            <svg
              className="hd-edge"
              style={{ left: 0, top: 0 }}
              width={scene.width}
              height={scene.height}
              viewBox={`0 0 ${scene.width} ${scene.height}`}
              aria-hidden="true"
            >
              <defs>
                <marker
                  id={markerId}
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="10"
                  markerHeight="10"
                  markerUnits="userSpaceOnUse"
                  orient="auto"
                >
                  <path className="hd-edge__chevron" d="M2 1 L9 5 L2 9" />
                </marker>
              </defs>
              {scene.routes.map((route) =>
                'd' in route ? (
                  <path
                    key={route.id}
                    d={route.d}
                    markerEnd={`url(#${markerId})`}
                    data-loop={route.loop ? 'true' : 'false'}
                    style={route.loop ? { strokeDasharray: '6 4' } : undefined}
                  />
                ) : null,
              )}
            </svg>
            {definition.nodes
              .filter((node) => node.placement === 'path')
              .map((node) => (
                <PathNode
                  key={node.id}
                  node={node}
                  selected={node.id === selectedId}
                  onSelect={onSelect}
                />
              ))}
          </div>
        </div>
      </div>
      <Unavailable routes={scene.routes} />
      <NodeTray />
      <Zoom />
    </div>
  )
}

function Unavailable({ routes }: { readonly routes: ReturnType<typeof workflowScene>['routes'] }) {
  const notes = routes.filter((route) => 'unavailable' in route)
  if (notes.length === 0) return null
  return (
    <div className="hd-sr">
      {notes.map((route) =>
        'unavailable' in route ? (
          <p key={route.id} role="status">
            {route.unavailable}
          </p>
        ) : null,
      )}
    </div>
  )
}

function PathNode({
  node,
  selected,
  onSelect,
}: {
  readonly node: WorkflowEditorNode
  readonly selected: boolean
  readonly onSelect: (id: WorkflowNodeId) => void
}) {
  if (!node.frame) return null
  const visual =
    node.visual === 'terminal' ? ' hd-node--terminal' : node.visual === 'boundary' ? ' hd-node--boundary' : ''
  return (
    <button
      type="button"
      className={`hd-node${visual}${selected ? ' is-selected' : ''}`}
      style={{
        left: node.frame.x,
        top: node.frame.y,
        minWidth: 0,
        width: node.frame.width,
        height: node.frame.height,
      }}
      aria-pressed={selected}
      aria-label={node.locked ? `${node.title}, locked` : node.title}
      onClick={() => onSelect(node.id)}
    >
      {node.visual !== 'terminal' ? <div className="hd-node__kind">{node.kindLabel}</div> : null}
      <div className="hd-node__head" style={{ whiteSpace: 'nowrap' }}>
        {node.icon ? <Icon name={node.icon} size="sm" /> : null}
        <span>{node.title}</span>
      </div>
      {node.meta ? (
        <div className="hd-node__meta" style={{ whiteSpace: 'nowrap' }}>
          <Icon name="harness" size="sm" />
          {node.meta}
        </div>
      ) : null}
      <Ports node={node} />
    </button>
  )
}

function Ports({ node }: { readonly node: WorkflowEditorNode }) {
  const incoming = node.icon !== 'play' && !node.locked
  const outgoing = node.icon !== 'flag' && !node.locked
  return (
    <>
      {incoming ? <span className="hd-port hd-port--in" /> : null}
      {outgoing ? <span className="hd-port hd-port--out" /> : null}
    </>
  )
}

const TRAY: readonly { label: string; icon: IconName }[] = [
  { label: 'Planning', icon: 'target' },
  { label: 'Implementation', icon: 'pencil' },
  { label: 'Review', icon: 'eye' },
  { label: 'Task', icon: 'task' },
  { label: 'Run workflow', icon: 'workflow' },
  { label: 'Start', icon: 'play' },
  { label: 'Parallel group', icon: 'parallel' },
  { label: 'End', icon: 'flag' },
]

function NodeTray() {
  return (
    <div className="hd-tray" role="toolbar" aria-label="Add node" style={{ position: 'absolute', left: 'var(--space-4)', bottom: 'var(--space-4)', flexWrap: 'wrap', maxWidth: 420 }}>
      {TRAY.map((item) => (
        <button key={item.label} type="button" className="hd-chip" disabled aria-disabled="true" aria-describedby={HELP_ID}>
          <Icon name={item.icon} size="sm" />
          {item.label}
        </button>
      ))}
    </div>
  )
}

function Zoom() {
  return (
    <div className="hd-zoom" role="group" aria-label="Zoom" style={{ position: 'absolute', right: 'var(--space-4)', bottom: 'var(--space-4)' }}>
      <button type="button" className="hd-btn hd-btn--ghost hd-btn--sm" aria-label="Zoom out" disabled aria-disabled="true" aria-describedby={HELP_ID}>−</button>
      <span style={{ padding: '0 6px' }}>65%</span>
      <button type="button" className="hd-btn hd-btn--ghost hd-btn--sm" aria-label="Zoom in" disabled aria-disabled="true" aria-describedby={HELP_ID}>+</button>
    </div>
  )
}
