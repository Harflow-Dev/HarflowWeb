import type {
  ContextLoad,
  HarnessesLoad,
  NeedsYouLoad,
  ResourcesLoad,
  SettingsGeneralLoad,
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
import { resolveScenarioRoute } from './scenarioRoute'
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

export type DeferredSurface = 'default' | 'defer'

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
  | 'workflows-loading'
  | 'workflow-editor-loading'
  | 'workflow-run-loading'
  | 'workflow-run-loading-parallel'
  | 'parallel-group-loading'
  | 'resources-loading'
  | 'statistics-loading'
  | 'settings-loading-general'
  | 'settings-loading-harnesses'
  | 'settings-loading-mcp-approvals'
  | 'task-changes-loading'
  | 'task-events-loading'
  | 'resources-slots'
  | 'statistics-overview'
  | 'task-running'
  | 'task-failed'
  | 'task-done'
  | 'needs-you-empty'
  | 'needs-you-loading'
  | 'new-task-loading'
  | 'sidebar-loading'
  | 'task-loading'
  | 'composer-loading'
  | 'composer-unqualified'
  | 'composer-invalid'
  | 'composer-starting'
  | 'composer-refused'
  | 'composer-options-closed'
  | 'composer-harness-open'
  | 'sidebar-collapsed'
  | 'sidebar-minimum'
  | 'needs-you-waiting-minimum'
  | 'parallel-group-lanes-minimum'
  | 'workflow-run-parallel-minimum'
  | 'workflow-editor-node-selected-minimum'
  | 'workflow-editor-orchestrator-minimum'
  | 'needs-you-loading-minimum'
  | 'parallel-group-loading-minimum'
  | 'workflow-run-loading-parallel-minimum'
  | 'workflow-editor-loading-minimum'
  | 'transcript-observed'
  | 'transcript-loading'
  | 'transcript-partial'
  | 'transcript-unavailable'
  | 'transcript-integrity-failed'
  | 'transcript-reconnecting'
  | 'transcript-capacity'
  | 'transcript-sources'
  | 'transcript-observed/events'
  | 'transcript-loading/events'
  | 'transcript-partial/events'
  | 'transcript-unavailable/events'
  | 'transcript-integrity-failed/events'
  | 'transcript-reconnecting/events'
  | 'transcript-capacity/events'
  | 'transcript-sources/events'
  | 'parallel-group-lanes-titled'
  | 'parallel-group-lane-menu-open'
  | 'parallel-group-prompt-shown'
  | 'parallel-group-cancel-all-confirm'
  | 'parallel-group-lanes-settled'
  | 'parallel-group-lane-failed'
  | 'parallel-group-lane-cancelled'
  | 'parallel-group-lane-taken-over'
  | 'parallel-group-lane-activity-unavailable'
  | 'parallel-group-lane-history-boundary'
  | 'parallel-group-group-empty'
  | 'parallel-group-two-lanes'
  | 'parallel-group-loading-two'
  | 'parallel-group-lanes-titled-minimum'
  | 'parallel-group-lane-menu-open-minimum'
  | 'parallel-group-prompt-shown-minimum'
  | 'parallel-group-cancel-all-confirm-minimum'
  | 'parallel-group-lanes-settled-minimum'
  | 'parallel-group-lane-cancelled-minimum'
  | 'parallel-group-lane-failed-minimum'
  | 'parallel-group-group-empty-minimum'

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
  readonly settingsGeneral: SettingsGeneralLoad | 'defer'
  readonly needsYou: NeedsYouLoad | 'defer'
  readonly workflowEditors: DeferredSurface
  readonly workflowExecutions: DeferredSurface
  readonly parallelGroups: DeferredSurface
  readonly startOutcome: StartTaskOutcome
  readonly holdStart: boolean
  readonly seed?: NewTaskScenarioSeed
}

export { SCENARIOS }

export function scenarioById(id: ScenarioId | string): ScenarioDefinition {
  const found = SCENARIOS.find((s) => s.id === id)
  if (found) return found
  // Design-style task/transcript-*/events refs resolve onto catalog rows.
  const resolved = resolveScenarioRoute(id)
  if (resolved?.transcriptBase) {
    const key = (
      resolved.eventsPaneOpen
        ? `${resolved.transcriptBase}/events`
        : resolved.transcriptBase
    ) as ScenarioId
    const match = SCENARIOS.find((s) => s.id === key)
    if (match) return match
  }
  throw new Error(`Unknown scenario: ${id}`)
}
