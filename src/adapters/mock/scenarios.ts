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
import type { ScenarioId } from './scenarioIds'
import type { NewTaskScenarioSeed } from './scenarioSeed'

export type { ScenarioId } from './scenarioIds'
export type { NewTaskScenarioSeed } from './scenarioSeed'
export type { TaskMessagesScenarioId } from './scenarioIdsTaskMessages'
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
  /** Engine `messaging.v1` capability; defaults to available. */
  readonly messagingCapability: boolean | 'defer'
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
  /**
   * Cross-surface state: inbox task approvals also show on the task screen
   * of the same task even when its feed carries no approval. Declared only by
   * the scenarios that exercise Needs you and task-screen interplay.
   */
  readonly crossSurfaceApprovals?: boolean
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
