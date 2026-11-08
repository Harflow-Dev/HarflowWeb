import type {
  WorkflowEditorDefinition,
  WorkflowEditorNode,
  WorkflowEditorSection,
} from '../../model'
import {
  ORCHESTRATOR_CLOSING,
  ORCHESTRATOR_PREFACE,
  RELEASE_ORCHESTRATOR_INSTRUCTIONS,
  brief,
  choice,
  editorEdge,
  node,
  nodeFrame,
  orchestratorSections,
  text,
} from './workflowEditorBuilders'
import {
  EDITOR_RELEASE_ID,
  RELEASE_REVIEW_NODE_ID,
} from './workflowEditorIds'

function reviewNodeSection(): WorkflowEditorSection {
  return {
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
  }
}

function reviewInstructionsSection(): WorkflowEditorSection {
  return {
    id: 'instructions',
    label: 'INSTRUCTIONS',
    fields: [
      text(
        'instructions',
        'Instructions',
        'Review the changelog, version bump and test results against the release checklist. Report anything missing and reject the release if a required check failed.',
      ),
    ],
  }
}

function reviewAgentSection(): WorkflowEditorSection {
  return {
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
  }
}

function reviewRunSection(): WorkflowEditorSection {
  return {
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
  }
}

function reviewAccessSection(): WorkflowEditorSection {
  return {
    id: 'access',
    label: 'ACCESS',
    fields: [choice('access', 'Access level', 'Read-only')],
  }
}

function reviewSections(): readonly WorkflowEditorSection[] {
  return [
    reviewNodeSection(),
    reviewInstructionsSection(),
    reviewAgentSection(),
    reviewRunSection(),
    reviewAccessSection(),
  ]
}

function releasePathNodes(): WorkflowEditorNode[] {
  return [
    node({ id: 'release-start', placement: 'path', visual: 'terminal', title: 'Start', kindLabel: 'Start', meta: null, frame: nodeFrame(8, 251, 70, 38), icon: 'play', sections: brief('Start', 'Start', null) }),
    node({ id: 'release-plan', placement: 'path', visual: 'agent', title: 'Plan', kindLabel: 'Planning', meta: 'Claude Code', frame: nodeFrame(134, 229, 128, 82), icon: null, sections: brief('Plan', 'Planning', 'Claude Code') }),
    node({ id: 'release-parallel-start', placement: 'path', visual: 'boundary', title: 'Checks', kindLabel: 'Parallel start', meta: null, frame: nodeFrame(318, 240, 112, 60), icon: 'parallel', sections: brief('Checks', 'Parallel start', null) }),
    node({ id: 'release-implement', placement: 'path', visual: 'agent', title: 'Implement changelog', kindLabel: 'Implementation', meta: 'Claude Code', frame: nodeFrame(486, 168, 172, 82), icon: null, sections: brief('Implement changelog', 'Implementation', 'Claude Code') }),
    node({ id: 'release-tests', placement: 'path', visual: 'agent', title: 'Run tests', kindLabel: 'Task', meta: 'Codex', frame: nodeFrame(486, 290, 172, 82), icon: null, sections: brief('Run tests', 'Task', 'Codex') }),
    node({ id: 'release-parallel-end', placement: 'path', visual: 'boundary', title: 'Checks', kindLabel: 'Parallel end', meta: null, frame: nodeFrame(714, 240, 112, 60), icon: 'parallel', sections: brief('Checks', 'Parallel end', null) }),
    node({ id: 'release-review', placement: 'path', visual: 'agent', title: 'Review', kindLabel: 'Review', meta: 'Claude Code', frame: nodeFrame(882, 229, 128, 82), icon: null, sections: reviewSections() }),
    node({ id: 'release-end', placement: 'path', visual: 'terminal', title: 'End', kindLabel: 'End', meta: null, frame: nodeFrame(1066, 251, 60, 38), icon: 'flag', sections: brief('End', 'End', null) }),
  ]
}

function releaseStandaloneNodes(): WorkflowEditorNode[] {
  return [
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
}

function releaseEdges() {
  return [
    editorEdge('e1', 'release-start', 'release-plan'),
    editorEdge('e2', 'release-plan', 'release-parallel-start'),
    editorEdge('e3', 'release-parallel-start', 'release-implement'),
    editorEdge('e4', 'release-parallel-start', 'release-tests'),
    editorEdge('e5', 'release-implement', 'release-parallel-end'),
    editorEdge('e6', 'release-tests', 'release-parallel-end'),
    editorEdge('e7', 'release-parallel-end', 'release-review'),
    editorEdge('e8', 'release-review', 'release-end'),
  ]
}

export function releaseDefinition(): WorkflowEditorDefinition {
  return {
    workflowId: EDITOR_RELEASE_ID,
    title: 'Release checklist',
    revisionLabel: 'Revision 7',
    boardWidth: 1140,
    boardHeight: 430,
    defaultSelectedId: RELEASE_REVIEW_NODE_ID,
    nodes: [...releasePathNodes(), ...releaseStandaloneNodes()],
    edges: releaseEdges(),
  }
}
