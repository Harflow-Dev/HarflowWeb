import type { WorkflowId, WorkflowNodeId } from './ids'

/** Read-only editor preview. Fields are fixture facts, not editable settings. */
export type WorkflowEditorField =
  | { readonly kind: 'text'; readonly id: string; readonly label: string; readonly value: string }
  | { readonly kind: 'choice'; readonly id: string; readonly label: string; readonly value: string }
  | {
      readonly kind: 'switch'
      readonly id: string
      readonly label: string
      readonly hint: string | null
      readonly checked: boolean
    }
  | { readonly kind: 'stepper'; readonly id: string; readonly label: string; readonly value: string }
  | { readonly kind: 'note'; readonly id: string; readonly text: string }

export type WorkflowEditorSection = {
  readonly id: string
  readonly label: string
  readonly fields: readonly WorkflowEditorField[]
}

export type WorkflowNodeVisual =
  | 'terminal'
  | 'agent'
  | 'boundary'
  | 'orchestrator'
  | 'ondemand'

export type WorkflowNodeIcon = 'play' | 'flag' | 'parallel' | 'lock' | 'zap'

export type WorkflowNodeFrame = {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export type WorkflowEditorNode = {
  readonly id: WorkflowNodeId
  readonly placement: 'path' | 'standalone'
  readonly visual: WorkflowNodeVisual
  readonly title: string
  readonly kindLabel: string
  readonly meta: string | null
  readonly locked: boolean
  readonly frame: WorkflowNodeFrame | null
  readonly icon: WorkflowNodeIcon | null
  readonly sections: readonly WorkflowEditorSection[]
}

export type WorkflowEditorEdge = {
  readonly id: string
  readonly from: WorkflowNodeId
  readonly to: WorkflowNodeId
  /** Backward route. Dashed, and never attached to the orchestrator. */
  readonly loop: boolean
}

export type WorkflowEditorDefinition = {
  readonly workflowId: WorkflowId
  readonly title: string
  readonly revisionLabel: string
  readonly boardWidth: number
  readonly boardHeight: number
  readonly defaultSelectedId: WorkflowNodeId | null
  readonly nodes: readonly WorkflowEditorNode[]
  readonly edges: readonly WorkflowEditorEdge[]
}

export type WorkflowEditorLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable'; readonly message: string }
  | { readonly kind: 'ready'; readonly definition: WorkflowEditorDefinition }

export const WORKFLOW_EDITOR_UNAVAILABLE = 'This workflow is unavailable.'
export const WORKFLOW_NODE_UNAVAILABLE = 'This node is unavailable.'

export function workflowEditorNodes(
  definition: WorkflowEditorDefinition,
): readonly WorkflowEditorNode[] {
  return definition.nodes
}

export function findWorkflowEditorNode(
  definition: WorkflowEditorDefinition,
  id: WorkflowNodeId,
): WorkflowEditorNode | null {
  return definition.nodes.find((node) => node.id === id) ?? null
}

/** True only for a node that belongs to this definition. */
export function workflowEditorHasNode(
  definition: WorkflowEditorDefinition,
  id: WorkflowNodeId,
): boolean {
  return findWorkflowEditorNode(definition, id) !== null
}
