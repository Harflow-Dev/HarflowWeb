import {
  asTaskId,
  type ContextLoad,
  type StartTaskOutcome,
  type WorkflowsLoad,
} from '../../model'
import {
  emptySidebar,
  partialSidebar,
  populatedComposer,
  populatedSidebar,
} from './fixtures'
import {
  emptyWorkflowsLoad,
  populatedWorkflowsLoad,
} from './workflowFixtures'

/**
 * Deterministic preview scenarios for /preview.
 * Scenario controls stay off the main product composition.
 */
export type ScenarioId =
  | 'populated'
  | 'empty-sidebar'
  | 'loading'
  | 'unavailable'
  | 'partial-sidebar'
  | 'submit-accepted'
  | 'submit-refused'
  | 'submit-unknown'
  | 'stale-response'
  | 'workflows-populated'
  | 'workflows-empty'

export type ScenarioDefinition = {
  readonly id: ScenarioId
  readonly label: string
  readonly description: string
  readonly context: ContextLoad | 'defer'
  readonly workflows: WorkflowsLoad | 'defer'
  readonly startOutcome: StartTaskOutcome
  /** When true, startTask waits until the test/preview resolves it. */
  readonly holdStart: boolean
}

function readyContext(
  sidebar = populatedSidebar(),
): ContextLoad {
  return {
    kind: 'ready',
    composer: populatedComposer(),
    sidebar,
  }
}

const accepted = {
  kind: 'accepted' as const,
  taskId: asTaskId('task-mock-accepted'),
}

export const SCENARIOS: readonly ScenarioDefinition[] = [
  {
    id: 'populated',
    label: 'Populated',
    description: 'New-task + workflows list (design default fixtures).',
    context: readyContext(),
    workflows: populatedWorkflowsLoad(),
    startOutcome: accepted,
    holdStart: false,
  },
  {
    id: 'empty-sidebar',
    label: 'Empty sidebar',
    description: 'Composer ready; Running and Recent empty.',
    context: readyContext(emptySidebar()),
    workflows: populatedWorkflowsLoad(),
    startOutcome: accepted,
    holdStart: false,
  },
  {
    id: 'loading',
    label: 'Context loading',
    description: 'Proposal status: loading — no approved specimen.',
    context: { kind: 'loading' },
    workflows: populatedWorkflowsLoad(),
    startOutcome: {
      kind: 'refused',
      code: 'unavailable',
      reason: 'Context is still loading.',
    },
    holdStart: false,
  },
  {
    id: 'unavailable',
    label: 'Context unavailable',
    description: 'Proposal status: unavailable — no approved specimen.',
    context: {
      kind: 'unavailable',
      message: 'Mock engine context is unavailable.',
    },
    workflows: populatedWorkflowsLoad(),
    startOutcome: {
      kind: 'refused',
      code: 'unavailable',
      reason: 'Context unavailable.',
    },
    holdStart: false,
  },
  {
    id: 'partial-sidebar',
    label: 'Partial sidebar',
    description: 'Incomplete coverage marked explicitly (proposal).',
    context: readyContext(partialSidebar()),
    workflows: populatedWorkflowsLoad(),
    startOutcome: accepted,
    holdStart: false,
  },
  {
    id: 'submit-accepted',
    label: 'Submit accepted',
    description: 'Maps to ctl-launch-run-accepted.json semantics.',
    context: readyContext(),
    workflows: populatedWorkflowsLoad(),
    startOutcome: {
      kind: 'accepted',
      taskId: asTaskId('task-fixture'),
    },
    holdStart: false,
  },
  {
    id: 'submit-refused',
    label: 'Submit refused',
    description: 'Maps to ctl-launch-run-refused.json semantics.',
    context: readyContext(),
    workflows: populatedWorkflowsLoad(),
    startOutcome: {
      kind: 'refused',
      code: 'invalid_params',
      reason: 'fixture refusal',
    },
    holdStart: false,
  },
  {
    id: 'submit-unknown',
    label: 'Submit unknown',
    description: 'Maps to ctl-launch-run-unknown.json; no automatic retry.',
    context: readyContext(),
    workflows: populatedWorkflowsLoad(),
    startOutcome: {
      kind: 'unknown',
      message: 'fixture: owner did not report; a task may exist',
    },
    holdStart: false,
  },
  {
    id: 'stale-response',
    label: 'Stale response',
    description:
      'Holds start; resolve after remount/disposal so the late accept is ignored.',
    context: readyContext(),
    workflows: populatedWorkflowsLoad(),
    startOutcome: {
      kind: 'accepted',
      taskId: asTaskId('task-stale'),
    },
    holdStart: true,
  },
  {
    id: 'workflows-populated',
    label: 'Workflows list',
    description: 'Approved workflows/list specimen data.',
    context: readyContext(),
    workflows: populatedWorkflowsLoad(),
    startOutcome: accepted,
    holdStart: false,
  },
  {
    id: 'workflows-empty',
    label: 'Workflows empty',
    description: 'Approved workflows/empty specimen data.',
    context: readyContext(),
    workflows: emptyWorkflowsLoad(),
    startOutcome: accepted,
    holdStart: false,
  },
]

export function scenarioById(id: ScenarioId): ScenarioDefinition {
  const found = SCENARIOS.find((s) => s.id === id)
  if (!found) {
    throw new Error(`Unknown scenario: ${id}`)
  }
  return found
}
