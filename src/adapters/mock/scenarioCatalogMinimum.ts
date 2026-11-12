import { accepted, base, readyContext } from './scenarioBase'
import type { ScenarioDefinition } from './scenarios'

/**
 * Approved HarflowDesign 1000 × 620 minimum-window preview scenarios
 * (approval 246cc97; frame CSS last at cd606f0).
 */
export const MINIMUM_LOADED_SCENARIOS: readonly ScenarioDefinition[] = [
  base({
    id: 'needs-you-waiting-minimum',
    label: 'Needs you · minimum',
    description:
      'Approved needs-you/waiting-minimum (Design 246cc97). Waiting list in the 1000×620 frame; sidebar body scrolls.',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: { frame: 'minimum', openRoute: 'needs-you' },
  }),
  base({
    id: 'parallel-group-lanes-minimum',
    label: 'Parallel group · minimum',
    description:
      'Approved parallel-group/lanes-minimum (Design 246cc97). 360pt lanes; top-bar meta drops to a focusable dot.',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: {
      frame: 'minimum',
      openParallelGroupId: 'parallel-group-preload-bridge',
    },
  }),
  base({
    id: 'workflow-run-parallel-minimum',
    label: 'Workflow run Parallel · minimum',
    description:
      'Approved workflow-run/parallel-minimum (Design 246cc97). Nightly Parallel lanes at 1000×620.',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: {
      frame: 'minimum',
      openRoute: 'workflows',
      openWorkflowExecutionId: 'run-nightly-dependency-audit',
      workflowRunView: 'parallel',
    },
  }),
  base({
    id: 'workflow-editor-node-selected-minimum',
    label: 'Workflow editor · minimum',
    description:
      'Approved workflow-editor/node-selected-minimum (Design 246cc97). Inspector 288; canvas scrolls; meta drops.',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: {
      frame: 'minimum',
      openRoute: 'workflows',
      openWorkflowEditorId: 'wf-release-checklist',
    },
  }),
  base({
    id: 'workflow-editor-orchestrator-minimum',
    label: 'Workflow editor orchestrator · minimum',
    description:
      'Approved workflow-editor/orchestrator-minimum (Design 246cc97). Locked orchestrator at 1000×620.',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: {
      frame: 'minimum',
      openRoute: 'workflows',
      openWorkflowEditorId: 'wf-release-checklist',
      openWorkflowEditorNodeId: 'release-orchestrator',
    },
  }),
]

/** Minimum-frame loading variants; deferred observations reuse existing skeletons. */
export const MINIMUM_LOADING_SCENARIOS: readonly ScenarioDefinition[] = [
  base({
    id: 'needs-you-loading-minimum',
    label: 'Needs you loading · minimum',
    description:
      'Approved needs-you/loading-minimum (Design 246cc97). Waiting skeleton in the 1000×620 frame.',
    context: readyContext(),
    needsYou: 'defer',
    startOutcome: accepted,
    holdStart: false,
    seed: { frame: 'minimum', openRoute: 'needs-you' },
  }),
  base({
    id: 'parallel-group-loading-minimum',
    label: 'Parallel group loading · minimum',
    description:
      'Approved parallel-group/loading-minimum (Design 246cc97). Lane skeleton; no focusable meta.',
    context: readyContext(),
    parallelGroups: 'defer',
    startOutcome: accepted,
    holdStart: false,
    seed: {
      frame: 'minimum',
      openParallelGroupId: 'parallel-group-preload-bridge',
    },
  }),
  base({
    id: 'workflow-run-loading-parallel-minimum',
    label: 'Workflow run loading Parallel · minimum',
    description:
      'Approved workflow-run/loading-parallel-minimum (Design 246cc97). Parallel skeleton at 1000×620.',
    context: readyContext(),
    workflowExecutions: 'defer',
    startOutcome: accepted,
    holdStart: false,
    seed: {
      frame: 'minimum',
      openRoute: 'workflows',
      openWorkflowExecutionId: 'run-nightly-dependency-audit',
      workflowRunView: 'parallel',
    },
  }),
  base({
    id: 'workflow-editor-loading-minimum',
    label: 'Workflow editor loading · minimum',
    description:
      'Approved workflow-editor/loading-minimum (Design 246cc97). Editor skeleton; inspector 288; no meta.',
    context: readyContext(),
    workflowEditors: 'defer',
    startOutcome: accepted,
    holdStart: false,
    seed: {
      frame: 'minimum',
      openRoute: 'workflows',
      openWorkflowEditorId: 'wf-release-checklist',
    },
  }),
]

export const MINIMUM_SCENARIOS: readonly ScenarioDefinition[] = [
  ...MINIMUM_LOADED_SCENARIOS,
  ...MINIMUM_LOADING_SCENARIOS,
]
