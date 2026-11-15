import { accepted, base, readyContext } from './scenarioBase'
import { TASK_EVENTS_LOADING_SCENARIO } from './scenarioCatalogTaskEvents'
import type { ScenarioDefinition } from './scenarios'

/** Approved Design 9d19fd7 first-load skeleton preview scenarios. */
export const LOADING_SCENARIOS: readonly ScenarioDefinition[] = [
  base({
    id: 'new-task-loading',
    label: 'New task loading',
    description:
      'Approved new-task/loading skeleton (Design 9d19fd7). Deferred context; greeting and composer frame stay real.',
    context: 'defer',
    needsYou: 'defer',
    startOutcome: {
      kind: 'refused',
      code: 'unavailable',
      reason: 'Context is still loading.',
    },
    holdStart: false,
  }),
  base({
    id: 'sidebar-loading',
    label: 'Sidebar loading',
    description:
      'Approved sidebar/loading (Design 9d19fd7). Composer stays operable; Running/Recent and Needs you count are placeholders.',
    context: readyContext(undefined, { sidebarListingLoading: true }),
    needsYou: 'defer',
    startOutcome: accepted,
    holdStart: false,
  }),
  base({
    id: 'task-loading',
    label: 'Task loading',
    description:
      'Approved task/loading skeleton (Design 9d19fd7) mirroring task/running-stop. Deferred task observation; open the mapped running row after selecting.',
    context: readyContext(),
    tasks: 'defer',
    startOutcome: accepted,
    holdStart: false,
    seed: { openTaskId: 'task-slot-release' },
  }),
  base({
    id: 'workflows-loading',
    label: 'Workflows loading',
    description:
      'Approved workflows/loading skeleton (Design 9d19fd7). Deferred workflows list.',
    context: readyContext(),
    workflows: 'defer',
    startOutcome: accepted,
    holdStart: false,
    seed: { openRoute: 'workflows' },
  }),
  base({
    id: 'workflow-editor-loading',
    label: 'Workflow editor loading',
    description:
      'Approved workflow-editor/loading skeleton (Design 9d19fd7). Deferred editor for Release checklist.',
    context: readyContext(),
    workflowEditors: 'defer',
    startOutcome: accepted,
    holdStart: false,
    seed: {
      openRoute: 'workflows',
      openWorkflowEditorId: 'wf-release-checklist',
    },
  }),
  base({
    id: 'workflow-run-loading',
    label: 'Workflow run loading',
    description:
      'Approved workflow-run/loading skeleton (Design 9d19fd7) mirroring on-demand.',
    context: readyContext(),
    workflowExecutions: 'defer',
    startOutcome: accepted,
    holdStart: false,
    seed: {
      openRoute: 'workflows',
      openWorkflowExecutionId: 'run-nightly-dependency-audit',
    },
  }),
  base({
    id: 'workflow-run-loading-parallel',
    label: 'Workflow run loading · Parallel',
    description:
      'Approved workflow-run/loading-parallel skeleton (Design 9d19fd7).',
    context: readyContext(),
    workflowExecutions: 'defer',
    startOutcome: accepted,
    holdStart: false,
    seed: {
      openRoute: 'workflows',
      openWorkflowExecutionId: 'run-nightly-dependency-audit',
      workflowRunView: 'parallel',
    },
  }),
  base({
    id: 'parallel-group-loading',
    label: 'Parallel group loading',
    description:
      'Approved parallel-group/loading skeleton (Design 9d19fd7) for Review preload bridge.',
    context: readyContext(),
    parallelGroups: 'defer',
    startOutcome: accepted,
    holdStart: false,
    seed: { openParallelGroupId: 'parallel-group-preload-bridge' },
  }),
  base({
    id: 'parallel-group-loading-two',
    label: 'Parallel group loading · two lanes',
    description:
      'Approved parallel-group/loading-two (Design 2153ab1): two skeleton lanes while the member count is unknown (null).',
    context: readyContext(),
    parallelGroups: 'defer',
    startOutcome: accepted,
    holdStart: false,
    seed: { openParallelGroupId: 'parallel-group-loading-two' },
  }),
  base({
    id: 'resources-loading',
    label: 'Resources loading',
    description:
      'Approved resources/loading skeleton (Design 9d19fd7). Deferred resources observation.',
    context: readyContext(),
    resources: 'defer',
    startOutcome: accepted,
    holdStart: false,
    seed: { openRoute: 'resources' },
  }),
  base({
    id: 'statistics-loading',
    label: 'Statistics loading',
    description:
      'Approved statistics/loading skeleton (Design 9d19fd7). Deferred statistics observation.',
    context: readyContext(),
    statistics: 'defer',
    startOutcome: accepted,
    holdStart: false,
    seed: { openRoute: 'statistics' },
  }),
  base({
    id: 'settings-loading-general',
    label: 'Settings loading · General',
    description:
      'Approved settings/loading-general skeleton (Design 9d19fd7). Deferred settings-general observation.',
    context: readyContext(),
    settingsGeneral: 'defer',
    startOutcome: accepted,
    holdStart: false,
    seed: { openRoute: 'settings', settingsSection: 'general' },
  }),
  base({
    id: 'settings-loading-harnesses',
    label: 'Settings loading · Harnesses',
    description:
      'Approved settings/loading-harnesses skeleton (Design 9d19fd7). Deferred harnesses observation.',
    context: readyContext(),
    harnesses: 'defer',
    startOutcome: accepted,
    holdStart: false,
    seed: { openRoute: 'settings', settingsSection: 'harnesses' },
  }),
  base({
    id: 'settings-loading-mcp-approvals',
    label: 'Settings loading · MCP approvals',
    description:
      'Approved settings/loading-mcp-approvals skeleton (Design 9d19fd7). Deferred harnesses with an expanded harness (MCP approvals).',
    context: readyContext(),
    harnesses: 'defer',
    startOutcome: accepted,
    holdStart: false,
    seed: {
      openRoute: 'settings',
      settingsSection: 'harnesses',
      settingsExpandedHarnessId: 'claude-code',
    },
  }),
  TASK_EVENTS_LOADING_SCENARIO,
]
