import {
  asWorkflowId,
  asWorkflowNodeId,
  WORKFLOW_EDITOR_UNAVAILABLE,
  type WorkflowEditorDefinition,
  type WorkflowEditorEdge,
  type WorkflowEditorField,
  type WorkflowEditorLoad,
  type WorkflowEditorNode,
  type WorkflowEditorSection,
  type WorkflowId,
  type WorkflowNodeFrame,
  type WorkflowNodeIcon,
  type WorkflowNodeVisual,
} from '../../model'

/**
 * Editor preview from HarflowDesign commit
 * 3643d083700be4032c93237813b573d04bab6ab1
 * v2/scripts/screens-workflow-editor.js workflow-editor/node-selected
 * and workflow-editor/orchestrator.
 * Only explicitly mapped definitions exist. Titles are not a lookup key.
 */

export const EDITOR_RELEASE_ID = asWorkflowId('wf-release-checklist')
export const EDITOR_NIGHTLY_ID = asWorkflowId('wf-nightly-audit')

const RELEASE_REVIEW = asWorkflowNodeId('release-review')
const NIGHTLY_AUDIT = asWorkflowNodeId('nightly-audit')

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

function node(input: NodeInput): WorkflowEditorNode {
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

function text(id: string, label: string, value: string): WorkflowEditorField {
  return { kind: 'text', id, label, value }
}

function choice(id: string, label: string, value: string): WorkflowEditorField {
  return { kind: 'choice', id, label, value }
}

const ORCHESTRATOR_PREFACE = "Every workflow has one. It can't be removed."
const ORCHESTRATOR_CLOSING =
  'Select a node or connection to edit its instructions and conditions.'
const RELEASE_ORCHESTRATOR_INSTRUCTIONS =
  'Choose the next node from the run so far. Prefer the review path when tests pass, and stop for the person if a release gate cannot be verified.'
const NIGHTLY_ORCHESTRATOR_INSTRUCTIONS =
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

function orchestratorSections(spec: OrchestratorLimits): readonly WorkflowEditorSection[] {
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

function brief(title: string, role: string, harness: string | null): WorkflowEditorSection[] {
  const fields: WorkflowEditorField[] = [
    text('name', 'Node name', title),
    choice('role', 'Role', role),
  ]
  if (harness) fields.push(choice('harness', 'Harness', harness))
  return [{ id: 'node', label: 'NODE', fields }]
}

function reviewSections(): readonly WorkflowEditorSection[] {
  return [
    {
      id: 'node',
      label: 'NODE',
      fields: [
        text('name', 'Node name', 'Review'),
        choice('role', 'Role', 'Review'),
        {
          kind: 'switch',
          id: 'optional',
          label: 'Optional',
          hint: 'Continue if this node fails within a parallel branch.',
          checked: false,
        },
      ],
    },
    {
      id: 'instructions',
      label: 'INSTRUCTIONS',
      fields: [
        text(
          'instructions',
          'Instructions',
          'Review the changelog, version bump and test results against the release checklist. Report anything missing and reject the release if a required check failed.',
        ),
      ],
    },
    {
      id: 'agent',
      label: 'AGENT',
      fields: [
        choice('harness', 'Harness', 'Claude Code'),
        choice('model', 'Model', 'Opus 5.5'),
        choice('effort', 'Effort', 'High'),
        text('turns', 'Turn limit', ''),
        { kind: 'switch', id: 'approvals', label: 'Caller approvals', hint: null, checked: false },
        {
          kind: 'note',
          id: 'fallback',
          text: 'Fallback harnesses (1): Codex · gpt-6-astra. Tried in order for confirmed quota, model or availability failures.',
        },
      ],
    },
    {
      id: 'run',
      label: 'RUN',
      fields: [
        choice('execution', 'Execution', 'Headless'),
        choice('session', 'Session', 'Let agent decide'),
        {
          kind: 'switch',
          id: 'time',
          label: 'Time limit',
          hint: 'Stop and settle the attempt before retrying or using a fallback.',
          checked: true,
        },
        text('limit', 'Limit', '15 minutes'),
        { kind: 'stepper', id: 'attempts', label: 'Attempts per visit', value: '3' },
        { kind: 'stepper', id: 'questions', label: 'Context questions', value: '10' },
      ],
    },
    {
      id: 'access',
      label: 'ACCESS',
      fields: [choice('access', 'Access level', 'Read-only')],
    },
  ]
}

function releaseDefinition(): WorkflowEditorDefinition {
  const frame = (x: number, y: number, width: number, height: number): WorkflowNodeFrame => ({
    x,
    y,
    width,
    height,
  })
  const nodes: WorkflowEditorNode[] = [
    node({ id: 'release-start', placement: 'path', visual: 'terminal', title: 'Start', kindLabel: 'Start', meta: null, frame: frame(8, 251, 70, 38), icon: 'play', sections: brief('Start', 'Start', null) }),
    node({ id: 'release-plan', placement: 'path', visual: 'agent', title: 'Plan', kindLabel: 'Planning', meta: 'Claude Code', frame: frame(134, 229, 128, 82), icon: null, sections: brief('Plan', 'Planning', 'Claude Code') }),
    node({ id: 'release-parallel-start', placement: 'path', visual: 'boundary', title: 'Checks', kindLabel: 'Parallel start', meta: null, frame: frame(318, 240, 112, 60), icon: 'parallel', sections: brief('Checks', 'Parallel start', null) }),
    node({ id: 'release-implement', placement: 'path', visual: 'agent', title: 'Implement changelog', kindLabel: 'Implementation', meta: 'Claude Code', frame: frame(486, 168, 172, 82), icon: null, sections: brief('Implement changelog', 'Implementation', 'Claude Code') }),
    node({ id: 'release-tests', placement: 'path', visual: 'agent', title: 'Run tests', kindLabel: 'Task', meta: 'Codex', frame: frame(486, 290, 172, 82), icon: null, sections: brief('Run tests', 'Task', 'Codex') }),
    node({ id: 'release-parallel-end', placement: 'path', visual: 'boundary', title: 'Checks', kindLabel: 'Parallel end', meta: null, frame: frame(714, 240, 112, 60), icon: 'parallel', sections: brief('Checks', 'Parallel end', null) }),
    node({ id: 'release-review', placement: 'path', visual: 'agent', title: 'Review', kindLabel: 'Review', meta: 'Claude Code', frame: frame(882, 229, 128, 82), icon: null, sections: reviewSections() }),
    node({ id: 'release-end', placement: 'path', visual: 'terminal', title: 'End', kindLabel: 'End', meta: null, frame: frame(1066, 251, 60, 38), icon: 'flag', sections: brief('End', 'End', null) }),
    node({
      id: 'release-orchestrator',
      placement: 'standalone',
      visual: 'orchestrator',
      title: 'Orchestrator',
      kindLabel: 'Always present',
      meta: 'Claude Code · Opus 5.5',
      locked: true,
      frame: null,
      icon: 'lock',
      preface: ORCHESTRATOR_PREFACE,
      closing: ORCHESTRATOR_CLOSING,
      sections: orchestratorSections({
        prefix: 'release-orchestrator',
        instructions: RELEASE_ORCHESTRATOR_INSTRUCTIONS,
        decisionAttempts: '3',
        inspections: '20',
        onDemandCalls: '5',
        parallelAgents: '4',
        transitionLimit: '100',
      }),
    }),
    node({ id: 'release-security', placement: 'standalone', visual: 'ondemand', title: 'Security reviewer', kindLabel: 'On demand', meta: 'Codex', frame: null, icon: 'zap', sections: brief('Security reviewer', 'On demand', 'Codex') }),
    node({ id: 'release-docs', placement: 'standalone', visual: 'ondemand', title: 'Docs checker', kindLabel: 'On demand', meta: 'Claude Code', frame: null, icon: 'zap', sections: brief('Docs checker', 'On demand', 'Claude Code') }),
  ]
  const edge = (id: string, from: string, to: string, loop = false): WorkflowEditorEdge => ({
    id,
    from: asWorkflowNodeId(from),
    to: asWorkflowNodeId(to),
    loop,
  })
  return {
    workflowId: EDITOR_RELEASE_ID,
    title: 'Release checklist',
    revisionLabel: 'Revision 7',
    boardWidth: 1140,
    boardHeight: 430,
    defaultSelectedId: RELEASE_REVIEW,
    nodes,
    edges: [
      edge('e1', 'release-start', 'release-plan'),
      edge('e2', 'release-plan', 'release-parallel-start'),
      edge('e3', 'release-parallel-start', 'release-implement'),
      edge('e4', 'release-parallel-start', 'release-tests'),
      edge('e5', 'release-implement', 'release-parallel-end'),
      edge('e6', 'release-tests', 'release-parallel-end'),
      edge('e7', 'release-parallel-end', 'release-review'),
      edge('e8', 'release-review', 'release-end'),
    ],
  }
}

function nightlyDefinition(): WorkflowEditorDefinition {
  const frame = (x: number, y: number, width: number, height: number): WorkflowNodeFrame => ({
    x,
    y,
    width,
    height,
  })
  return {
    workflowId: EDITOR_NIGHTLY_ID,
    title: 'Nightly dependency audit',
    revisionLabel: 'Revision 2',
    boardWidth: 520,
    boardHeight: 240,
    defaultSelectedId: NIGHTLY_AUDIT,
    nodes: [
      node({ id: 'nightly-start', placement: 'path', visual: 'terminal', title: 'Start', kindLabel: 'Start', meta: null, frame: frame(8, 80, 70, 38), icon: 'play', sections: brief('Start', 'Start', null) }),
      node({ id: 'nightly-audit', placement: 'path', visual: 'agent', title: 'Audit lockfiles', kindLabel: 'Task', meta: 'Claude Code', frame: frame(134, 58, 160, 82), icon: null, sections: brief('Audit lockfiles', 'Task', 'Claude Code') }),
      node({ id: 'nightly-end', placement: 'path', visual: 'terminal', title: 'End', kindLabel: 'End', meta: null, frame: frame(360, 80, 60, 38), icon: 'flag', sections: brief('End', 'End', null) }),
      node({
        id: 'nightly-orchestrator',
        placement: 'standalone',
        visual: 'orchestrator',
        title: 'Orchestrator',
        kindLabel: 'Always present',
        meta: 'Claude Code · Opus 5.5',
        locked: true,
        frame: null,
        icon: 'lock',
        preface: ORCHESTRATOR_PREFACE,
        closing: ORCHESTRATOR_CLOSING,
        sections: orchestratorSections({
          prefix: 'nightly-orchestrator',
          instructions: NIGHTLY_ORCHESTRATOR_INSTRUCTIONS,
          decisionAttempts: '2',
          inspections: '12',
          onDemandCalls: '1',
          parallelAgents: '2',
          transitionLimit: '40',
        }),
      }),
      node({ id: 'nightly-lockfile', placement: 'standalone', visual: 'ondemand', title: 'Lockfile checker', kindLabel: 'On demand', meta: 'Codex', frame: null, icon: 'zap', sections: brief('Lockfile checker', 'On demand', 'Codex') }),
    ],
    edges: [
      { id: 'n1', from: asWorkflowNodeId('nightly-start'), to: asWorkflowNodeId('nightly-audit'), loop: false },
      { id: 'n2', from: asWorkflowNodeId('nightly-audit'), to: asWorkflowNodeId('nightly-end'), loop: false },
      // Start has no input port. The retry returns to Audit lockfiles, which does.
      { id: 'n3', from: asWorkflowNodeId('nightly-audit'), to: asWorkflowNodeId('nightly-audit'), loop: true },
    ],
  }
}

const DEFINITIONS: Readonly<Record<string, WorkflowEditorDefinition>> = {
  [EDITOR_RELEASE_ID]: releaseDefinition(),
  [EDITOR_NIGHTLY_ID]: nightlyDefinition(),
}

export function workflowEditorLoadFor(id: WorkflowId): WorkflowEditorLoad {
  const found = DEFINITIONS[id]
  if (!found) return { kind: 'unavailable', message: WORKFLOW_EDITOR_UNAVAILABLE }
  return { kind: 'ready', definition: found }
}
