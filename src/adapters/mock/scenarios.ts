import { asTaskId, type ContextLoad, type StartTaskOutcome } from '../../model'
import {
  emptySidebar,
  partialSidebar,
  populatedComposer,
  populatedSidebar,
} from './fixtures'

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

export type ScenarioDefinition = {
  readonly id: ScenarioId
  readonly label: string
  readonly description: string
  readonly context: ContextLoad | 'defer'
  readonly startOutcome: StartTaskOutcome
  /** When true, startTask waits until the test/preview resolves it. */
  readonly holdStart: boolean
}

export const SCENARIOS: readonly ScenarioDefinition[] = [
  {
    id: 'populated',
    label: 'Populated',
    description: 'Sidebar and composer context ready (design default fixture).',
    context: {
      kind: 'ready',
      composer: populatedComposer(),
      sidebar: populatedSidebar(),
    },
    startOutcome: {
      kind: 'accepted',
      taskId: asTaskId('task-mock-accepted'),
    },
    holdStart: false,
  },
  {
    id: 'empty-sidebar',
    label: 'Empty sidebar',
    description: 'Composer ready; Running and Recent empty.',
    context: {
      kind: 'ready',
      composer: populatedComposer(),
      sidebar: emptySidebar(),
    },
    startOutcome: {
      kind: 'accepted',
      taskId: asTaskId('task-mock-accepted'),
    },
    holdStart: false,
  },
  {
    id: 'loading',
    label: 'Context loading',
    description: 'Proposal status: loading — no approved specimen.',
    context: { kind: 'loading' },
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
    context: {
      kind: 'ready',
      composer: populatedComposer(),
      sidebar: partialSidebar(),
    },
    startOutcome: {
      kind: 'accepted',
      taskId: asTaskId('task-mock-accepted'),
    },
    holdStart: false,
  },
  {
    id: 'submit-accepted',
    label: 'Submit accepted',
    description: 'Maps to ctl-launch-run-accepted.json semantics.',
    context: {
      kind: 'ready',
      composer: populatedComposer(),
      sidebar: populatedSidebar(),
    },
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
    context: {
      kind: 'ready',
      composer: populatedComposer(),
      sidebar: populatedSidebar(),
    },
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
    context: {
      kind: 'ready',
      composer: populatedComposer(),
      sidebar: populatedSidebar(),
    },
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
    context: {
      kind: 'ready',
      composer: populatedComposer(),
      sidebar: populatedSidebar(),
    },
    startOutcome: {
      kind: 'accepted',
      taskId: asTaskId('task-stale'),
    },
    holdStart: true,
  },
]

export function scenarioById(id: ScenarioId): ScenarioDefinition {
  const found = SCENARIOS.find((s) => s.id === id)
  if (!found) {
    throw new Error(`Unknown scenario: ${id}`)
  }
  return found
}
