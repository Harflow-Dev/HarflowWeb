import {
  asWorkflowNodeId,
  type WorkflowEditorEdge,
  type WorkflowEditorField,
  type WorkflowEditorNode,
  type WorkflowEditorSection,
  type WorkflowNodeFrame,
  type WorkflowNodeIcon,
  type WorkflowNodeVisual,
} from '../../model'

type NodeInput = {
  readonly id: string
  readonly placement: 'path' | 'standalone'
  readonly visual: WorkflowNodeVisual
  readonly title: string
  readonly kindLabel: string
  readonly meta: string | null
  readonly locked?: boolean
  readonly frame: WorkflowNodeFrame | null
  readonly icon: WorkflowNodeIcon | null
  readonly preface?: string
  readonly closing?: string
  readonly sections: readonly WorkflowEditorSection[]
}

export function node(input: NodeInput): WorkflowEditorNode {
  return {
    id: asWorkflowNodeId(input.id),
    placement: input.placement,
    visual: input.visual,
    title: input.title,
    kindLabel: input.kindLabel,
    meta: input.meta,
    locked: input.locked === true,
    frame: input.frame,
    icon: input.icon,
    preface: input.preface ?? null,
    closing: input.closing ?? null,
    sections: input.sections,
  }
}

export function text(id: string, label: string, value: string): WorkflowEditorField {
  return { kind: 'text', id, label, value }
}

export function choice(id: string, label: string, value: string): WorkflowEditorField {
  return { kind: 'choice', id, label, value }
}

export function nodeFrame(
  x: number,
  y: number,
  width: number,
  height: number,
): WorkflowNodeFrame {
  return { x, y, width, height }
}

export function editorEdge(
  id: string,
  from: string,
  to: string,
  loop = false,
): WorkflowEditorEdge {
  return {
    id,
    from: asWorkflowNodeId(from),
    to: asWorkflowNodeId(to),
    loop,
  }
}

export const ORCHESTRATOR_PREFACE = "Every workflow has one. It can't be removed."
export const ORCHESTRATOR_CLOSING =
  'Select a node or connection to edit its instructions and conditions.'
export const RELEASE_ORCHESTRATOR_INSTRUCTIONS =
  'Choose the next node from the run so far. Prefer the review path when tests pass, and stop for the person if a release gate cannot be verified.'
export const NIGHTLY_ORCHESTRATOR_INSTRUCTIONS =
  'Choose the next node from the lockfile audit. Repeat Audit lockfiles when a dependency is still unresolved, and stop for the person if the lockfile cannot be read.'

type OrchestratorLimits = {
  readonly prefix: string
  readonly instructions: string
  readonly decisionAttempts: string
  readonly inspections: string
  readonly onDemandCalls: string
  readonly parallelAgents: string
  readonly transitionLimit: string
}

export function orchestratorSections(
  spec: OrchestratorLimits,
): readonly WorkflowEditorSection[] {
  const id = (name: string) => `${spec.prefix}-${name}`
  return [
    {
      id: 'agent',
      label: 'AGENT',
      fields: [
        choice(id('harness'), 'Harness', 'Claude Code'),
        choice(id('model'), 'Model', 'Opus 5.5'),
        choice(id('effort'), 'Effort', 'High'),
        { kind: 'text', id: id('turns'), label: 'Turn limit', value: '', layout: 'row' },
        { kind: 'switch', id: id('approvals'), label: 'Caller approvals', hint: null, checked: false },
        {
          kind: 'fallbacks',
          id: id('fallbacks'),
          entries: ['Codex · gpt-6-astra'],
          hint: 'Tried in order for confirmed quota, model or availability failures.',
        },
      ],
    },
    {
      id: 'instructions',
      label: 'INSTRUCTIONS',
      fields: [
        {
          kind: 'text',
          id: id('instructions'),
          label: 'Orchestrator instructions',
          value: spec.instructions,
          hideLabel: true,
        },
      ],
    },
    {
      id: 'limits',
      label: 'LIMITS',
      fields: [
        { kind: 'stepper', id: id('decisions'), label: 'Decision attempts', value: spec.decisionAttempts },
        { kind: 'stepper', id: id('inspections'), label: 'Inspections', value: spec.inspections },
        { kind: 'stepper', id: id('calls'), label: 'On-demand calls per decision', value: spec.onDemandCalls },
        { kind: 'stepper', id: id('parallel'), label: 'Parallel agents', value: spec.parallelAgents },
        { kind: 'stepper', id: id('transitions'), label: 'Transition limit', value: spec.transitionLimit },
      ],
    },
  ]
}

export function brief(
  title: string,
  role: string,
  harness: string | null,
): WorkflowEditorSection[] {
  const fields: WorkflowEditorField[] = [
    text('name', 'Node name', title),
    choice('role', 'Role', role),
  ]
  if (harness) fields.push(choice('harness', 'Harness', harness))
  return [{ id: 'node', label: 'NODE', fields }]
}
