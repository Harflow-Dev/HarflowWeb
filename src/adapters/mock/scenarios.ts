import type {
  ContextLoad,
  HarnessesLoad,
  NeedsYouLoad,
  PendingLaunchInventoryLoad,
  ResourcesLoad,
  SettingsGeneralLoad,
  StartTaskOutcome,
  StatisticsLoad,
  StatisticsRangeId,
  TaskChangesLoad,
  TaskChangesQuery,
  TaskEventsLoad,
  TaskEventsQuery,
  TaskId,
  TaskLoad,
  WorkflowsLoad,
} from '../../model'
import type { PendingLaunchStatusFixtureId } from './pendingLaunchFixtures'
import { SCENARIOS } from './scenarioCatalog'
import { resolveScenarioRoute } from './scenarioRoute'
import type { NewTaskScenarioSeed } from './scenarioSeed'
import type { TaskPaneTopbarScenarioId } from './scenarioIdsTaskPaneTopbar'

export type { NewTaskScenarioSeed } from './scenarioSeed'
export type { TaskPaneTopbarScenarioId } from './scenarioIdsTaskPaneTopbar'

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

export type TaskEventsScenario =
  | 'default'
  | 'defer'
  | ((query: TaskEventsQuery) => TaskEventsLoad)

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
  | 'task-changes-single'
  | 'task-changes-multi'
  | 'task-changes-multi-limited'
  | 'task-changes-same-path'
  | 'task-changes-row-states'
  | 'task-changes-incomplete'
  | 'task-changes-not-captured'
  | 'task-changes-unmerged'
  | 'task-changes-running'
  | 'task-changes-zero'
  | 'task-changes-no-repository'
  | 'task-changes-text'
  | 'task-changes-loading'
  | 'task-changes-error'
  | 'task-changes-turns'
  | 'task-events-populated'
  | 'task-events-page'
  | 'task-events-page-error'
  | 'task-events-not-started'
  | 'task-events-loading'
  | 'task-events-empty'
  | 'task-events-error'
  | TaskPaneTopbarScenarioId
  | 'resources-slots'
  | 'statistics-overview'
  | 'task-running'
  | 'task-running-stop'
  | 'task-stop-requested'
  | 'task-cancelled'
  | 'task-timed-out'
  | 'task-settling'
  | 'task-unknown-failed'
  | 'task-unknown-done'
  | 'task-owner-lost'
  | 'task-unverified'
  | 'task-launch-unknown'
  | 'task-status-unavailable'
  | 'task-pending'
  | 'task-taken-over'
  | 'task-continue-starting'
  | 'task-continue-started'
  | 'task-failed'
  | 'task-failed-continue'
  | 'task-done'
  | 'task-overflow-running'
  | 'task-overflow-settled'
  | 'task-overflow-subtask'
  | 'task-stop-dialog'
  | 'task-stop-dialog-earlier-turns'
  | 'task-takeover-dialog'
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
  | 'parallel-group-lane-messages-queued'
  | 'parallel-group-lane-message-delivering'
  | 'parallel-group-lane-message-uncertain'
  | 'parallel-group-lane-message-cancelled'
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
  | 'pending-launches-inventory'
  | 'pending-launches-loading'
  | 'pending-launches-empty'
  | 'pending-launches-failed'
  | 'pending-launches-incomplete'
  | 'pending-launches-waiting'
  | 'pending-launches-preparing'
  | 'pending-launches-preparing-handshake'
  | 'pending-launches-granted'
  | 'pending-launches-not-started'
  | 'pending-launches-unavailable'
  | 'pending-launches-missing'
  | 'pending-launches-recorded'
  | 'pending-launches-handoff-failed'
  | 'pending-launches-stop-confirm'
  | 'pending-launches-stop-requested'
  | 'pending-launches-stop-uncertain'
  | 'pending-launches-stop-refused'
  | 'pending-launches-waiting-minimum'
  | 'pending-launches-stop-confirm-minimum'
  | 'pending-launches-stop-requested-minimum'

export type PendingLaunchStatusScenario =
  | 'default'
  | 'defer'
  | PendingLaunchStatusFixtureId

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
  readonly taskEvents: TaskEventsScenario
  readonly harnesses: HarnessesLoad | 'defer'
  readonly settingsGeneral: SettingsGeneralLoad | 'defer'
  readonly needsYou: NeedsYouLoad | 'defer'
  readonly workflowEditors: DeferredSurface
  readonly workflowExecutions: DeferredSurface
  readonly parallelGroups: DeferredSurface
  /** When false (default), Pending launches nav is hidden. */
  readonly pendingLaunchCapability: boolean | 'defer'
  readonly pendingLaunchInventory:
    | 'default'
    | 'defer'
    | PendingLaunchInventoryLoad
  readonly pendingLaunchStatus: PendingLaunchStatusScenario
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
