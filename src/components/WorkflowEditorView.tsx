import type { WorkflowEditorDefinition, WorkflowEditorNode, WorkflowNodeId } from '../model'
import { findWorkflowEditorNode } from '../model'
import { Icon } from './Icon'
import { WorkflowEditorCanvas } from './WorkflowEditorCanvas'
import { WorkflowEditorInspector } from './WorkflowEditorInspector'

export const WORKFLOW_EDITOR_EXPLANATION =
  'Unavailable. This preview does not edit, save, delete, connect, or run the workflow.'

const HELP_ID = 'workflow-editor-unavailable'

type Props = {
  readonly definition: WorkflowEditorDefinition
  readonly selectedId: WorkflowNodeId | null
  readonly onClose: () => void
  readonly onSelect: (id: WorkflowNodeId) => void
}

export function WorkflowEditorView({ definition, selectedId, onClose, onSelect }: Props) {
  const selected = selectedId ? findWorkflowEditorNode(definition, selectedId) : null
  const missing = selectedId !== null && selected === null
  const pathCount = definition.nodes.filter((node) => node.placement === 'path').length
  const demandCount = definition.nodes.filter((node) => node.visual === 'ondemand').length
  return (
    <>
      <div className="hd-topbar">
        <button type="button" className="hd-btn hd-btn--ghost hd-btn--sm" onClick={onClose}>
          <Icon name="arrow-left" size="sm" />
          Workflows
        </button>
        <span className="hd-topbar__title">{definition.title}</span>
        <span className="hd-topbar__meta">{definition.revisionLabel}</span>
        <span className="hd-topbar__spacer" />
        <LockedButton label="Edit with agent" icon="sparkle" />
        <LockedButton label="More actions" iconOnly />
        <LockedButton label="Discard" />
        <LockedButton label="Save" tone="secondary" />
        <LockedButton label="Run" icon="play" />
      </div>
      <Standalone definition={definition} selectedId={selectedId} onSelect={onSelect} />
      <div className="hd-split">
        <div style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <WorkflowEditorCanvas definition={definition} selectedId={selectedId} onSelect={onSelect} />
          <div className="caption hd-faint" role="status" style={{ flex: 'none', padding: '6px var(--space-4)', borderTop: '1px solid var(--border)' }}>
            {pathCount} path nodes · {demandCount} on demand
          </div>
        </div>
        <WorkflowEditorInspector node={selected} missing={missing} />
      </div>
      <p id={HELP_ID} className="hd-sr">
        {WORKFLOW_EDITOR_EXPLANATION}
      </p>
    </>
  )
}

function Standalone({
  definition,
  selectedId,
  onSelect,
}: {
  readonly definition: WorkflowEditorDefinition
  readonly selectedId: WorkflowNodeId | null
  readonly onSelect: (id: WorkflowNodeId) => void
}) {
  const nodes = definition.nodes.filter((node) => node.placement === 'standalone')
  return (
    <div className="hd-standalone">
      <span className="hd-standalone__label">
        <strong>Standalone</strong>
        Outside the workflow path
      </span>
      <div className="hd-standalone__nodes">
        {nodes.map((node) => (
          <StandaloneNode
            key={node.id}
            node={node}
            selected={node.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
      <button
        type="button"
        className="hd-btn hd-btn--icon hd-btn--sm"
        aria-label="Add on-demand node"
        disabled
        aria-disabled="true"
        aria-describedby={HELP_ID}
      >
        <Icon name="plus" size="sm" />
      </button>
    </div>
  )
}

function StandaloneNode({
  node,
  selected,
  onSelect,
}: {
  readonly node: WorkflowEditorNode
  readonly selected: boolean
  readonly onSelect: (id: WorkflowNodeId) => void
}) {
  const tone = node.visual === 'orchestrator' ? ' hd-node--orchestrator' : ' hd-node--ondemand'
  return (
    <button
      type="button"
      className={`hd-node${tone}${selected ? ' is-selected' : ''}`}
      style={{ position: 'relative' }}
      aria-pressed={selected}
      aria-label={node.locked ? `${node.title}, locked` : `${node.title}, on demand node`}
      onClick={() => onSelect(node.id)}
    >
      <div className="hd-node__kind">
        {node.icon ? <Icon name={node.icon} size="sm" /> : null}
        {node.kindLabel}
      </div>
      <div className="hd-node__head">
        <span>{node.title}</span>
      </div>
      {node.meta ? (
        <div className="hd-node__meta">
          <Icon name="harness" size="sm" />
          {node.meta}
        </div>
      ) : null}
    </button>
  )
}

function LockedButton({
  label,
  icon,
  iconOnly = false,
  tone,
}: {
  readonly label: string
  readonly icon?: 'sparkle' | 'play'
  readonly iconOnly?: boolean
  readonly tone?: 'secondary'
}) {
  const toneClass = iconOnly
    ? 'hd-btn hd-btn--icon hd-btn--sm'
    : icon === 'play'
      ? 'hd-btn hd-btn--primary hd-btn--sm'
      : tone === 'secondary'
        ? 'hd-btn hd-btn--secondary hd-btn--sm'
        : 'hd-btn hd-btn--ghost hd-btn--sm'
  return (
    <button
      type="button"
      className={toneClass}
      aria-label={iconOnly ? label : undefined}
      disabled
      aria-disabled="true"
      aria-describedby={HELP_ID}
    >
      {icon ? <Icon name={icon} size="sm" /> : null}
      {iconOnly ? null : label}
    </button>
  )
}
