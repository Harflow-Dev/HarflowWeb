import type {
  ContextLoad,
  HarnessesLoad,
  NeedsYouLoad,
  ResourcesLoad,
  StartTaskOutcome,
  StatisticsLoad,
  StatisticsRangeId,
  TaskChangesLoad,
  TaskChangesQuery,
  TaskId,
  TaskLoad,
  WorkflowsLoad,
} from '../../model'
import { SCENARIOS } from './scenarioCatalog'
import type { NewTaskScenarioSeed } from './scenarioSeed'

export type { NewTaskScenarioSeed } from './scenarioSeed'

export type StatisticsScenario =
  | 'default'
  | 'defer'
  | ((range: StatisticsRangeId) => StatisticsLoad)

export type TasksScenario =
  | 'default'
  | 'defer'
  | ((taskId: TaskId) => TaskLoad)

export type TaskChangesScenario =
  | 'default'
  | 'defer'
  | ((query: TaskChangesQuery) => TaskChangesLoad)

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
  | 'resources-slots'
  | 'statistics-overview'
  | 'task-running'
  | 'task-failed'
  | 'task-done'
  | 'needs-you-empty'
  | 'composer-loading'
  | 'composer-unqualified'
  | 'composer-invalid'
  | 'composer-starting'
  | 'composer-refused'
  | 'composer-options-closed'
  | 'composer-harness-open'
  | 'sidebar-collapsed'
  | 'sidebar-minimum'

export type ScenarioDefinition = {
  readonly id: ScenarioId
  readonly label: string
  readonly description: string
  readonly context: ContextLoad | 'defer'
  readonly workflows: WorkflowsLoad | 'defer'
  readonly resources: ResourcesLoad | 'defer'
  readonly statistics: StatisticsScenario
  readonly tasks: TasksScenario
  readonly taskChanges: TaskChangesScenario
  readonly harnesses: HarnessesLoad | 'defer'
  readonly needsYou: NeedsYouLoad | 'defer'
  readonly startOutcome: StartTaskOutcome
  readonly holdStart: boolean
  readonly seed?: NewTaskScenarioSeed
}

export { SCENARIOS }

export function scenarioById(id: ScenarioId): ScenarioDefinition {
  const found = SCENARIOS.find((s) => s.id === id)
  if (!found) {
    throw new Error(`Unknown scenario: ${id}`)
  }
  return found
}
