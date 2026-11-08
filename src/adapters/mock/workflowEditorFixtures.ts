import {
  WORKFLOW_EDITOR_UNAVAILABLE,
  type WorkflowEditorDefinition,
  type WorkflowEditorLoad,
  type WorkflowId,
} from '../../model'
import {
  NIGHTLY_ORCHESTRATOR_INSTRUCTIONS,
  ORCHESTRATOR_CLOSING,
  ORCHESTRATOR_PREFACE,
  brief,
  editorEdge,
  node,
  nodeFrame,
  orchestratorSections,
} from './workflowEditorBuilders'
import {
  EDITOR_NIGHTLY_ID,
  EDITOR_RELEASE_ID,
  NIGHTLY_AUDIT_NODE_ID,
} from './workflowEditorIds'
import { releaseDefinition } from './workflowEditorRelease'

/**
 * Editor preview from HarflowDesign commit
 * 3643d083700be4032c93237813b573d04bab6ab1
 * v2/scripts/screens-workflow-editor.js workflow-editor/node-selected
 * and workflow-editor/orchestrator.
 * Only explicitly mapped definitions exist. Titles are not a lookup key.
 */

export { EDITOR_NIGHTLY_ID, EDITOR_RELEASE_ID }

function nightlyDefinition(): WorkflowEditorDefinition {
  return {
    workflowId: EDITOR_NIGHTLY_ID,
    title: 'Nightly dependency audit',
    revisionLabel: 'Revision 2',
    boardWidth: 520,
    boardHeight: 240,
    defaultSelectedId: NIGHTLY_AUDIT_NODE_ID,
    nodes: [
      node({ id: 'nightly-start', placement: 'path', visual: 'terminal', title: 'Start', kindLabel: 'Start', meta: null, frame: nodeFrame(8, 80, 70, 38), icon: 'play', sections: brief('Start', 'Start', null) }),
      node({ id: 'nightly-audit', placement: 'path', visual: 'agent', title: 'Audit lockfiles', kindLabel: 'Task', meta: 'Claude Code', frame: nodeFrame(134, 58, 160, 82), icon: null, sections: brief('Audit lockfiles', 'Task', 'Claude Code') }),
      node({ id: 'nightly-end', placement: 'path', visual: 'terminal', title: 'End', kindLabel: 'End', meta: null, frame: nodeFrame(360, 80, 60, 38), icon: 'flag', sections: brief('End', 'End', null) }),
      nightlyOrchestrator(),
      node({ id: 'nightly-lockfile', placement: 'standalone', visual: 'ondemand', title: 'Lockfile checker', kindLabel: 'On demand', meta: 'Codex', frame: null, icon: 'zap', sections: brief('Lockfile checker', 'On demand', 'Codex') }),
    ],
    edges: [
      editorEdge('n1', 'nightly-start', 'nightly-audit'),
      editorEdge('n2', 'nightly-audit', 'nightly-end'),
      // Start has no input port. The retry returns to Audit lockfiles, which does.
      editorEdge('n3', 'nightly-audit', 'nightly-audit', true),
    ],
  }
}

function nightlyOrchestrator(): WorkflowEditorDefinition['nodes'][number] {
  return node({
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
  })
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
