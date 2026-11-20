import type { EnginePort } from '../../application'
import type {
  ContextLoad,
  HarnessesLoad,
  NeedsYouLoad,
  ParallelGroupId,
  ParallelGroupLoad,
  PendingLaunchCapabilityLoad,
  PendingLaunchId,
  PendingLaunchInventoryLoad,
  PendingLaunchStatusLoad,
  ResourcesLoad,
  SettingsGeneralLoad,
  StartTaskOutcome,
  StartTaskRequest,
  StatisticsLoad,
  StatisticsRangeId,
  TaskChangesLoad,
  TaskChangesQuery,
  TaskEventsLoad,
  TaskEventsQuery,
  TaskId,
  TaskLoad,
  WorkflowEditorLoad,
  WorkflowId,
  WorkflowRunContextLoad,
  WorkflowsLoad,
} from '../../model'
import { createHeldStartTracker, createListenerSets } from './mockEngineCore'
import { buildMockEnginePort } from './mockEnginePort'
import {
  createMockEngineRuntime,
  mockEnginePortCallbacks,
} from './mockEngineSetup'
import {
  catalogPublishers,
  republishScenario,
  surfacePublishers,
} from './mockEnginePublish'
import { scenarioById, type ScenarioId } from './scenarios'

export type MockEngineControls = {
  readonly engine: EnginePort
  setScenario(id: ScenarioId): void
  publishContext(load: ContextLoad): void
  publishWorkflows(load: WorkflowsLoad): void
  publishResources(load: ResourcesLoad): void
  publishStatistics(range: StatisticsRangeId, load: StatisticsLoad): void
  publishTask(taskId: TaskId, load: TaskLoad): void
  publishTaskChanges(query: TaskChangesQuery, load: TaskChangesLoad): void
  publishTaskEvents(query: TaskEventsQuery, load: TaskEventsLoad): void
  publishHarnesses(load: HarnessesLoad): void
  publishSettingsGeneral(load: SettingsGeneralLoad): void
  publishNeedsYou(load: NeedsYouLoad): void
  publishWorkflowRun(workflowId: WorkflowId, load: WorkflowRunContextLoad): void
  publishWorkflowEditor(workflowId: WorkflowId, load: WorkflowEditorLoad): void
  publishParallelGroup(groupId: ParallelGroupId, load: ParallelGroupLoad): void
  publishPendingLaunchCapability(load: PendingLaunchCapabilityLoad): void
  publishPendingLaunchInventory(load: PendingLaunchInventoryLoad): void
  publishPendingLaunchStatus(
    launchId: PendingLaunchId,
    load: PendingLaunchStatusLoad,
  ): void
  resolveHeldStart(outcome?: StartTaskOutcome): void
  readonly startRequestCount: () => number
  readonly lastStartRequest: () => StartTaskRequest | null
}

export function createMockEngine(
  initialScenario: ScenarioId = 'populated',
): MockEngineControls {
  let startCount = 0
  let lastStart: StartTaskRequest | null = null
  const held = createHeldStartTracker()
  const listeners = createListenerSets()
  const runtime = createMockEngineRuntime(initialScenario, listeners, {
    onRequest: (request) => {
      startCount += 1
      lastStart = request
    },
    heldStart: () => held.begin(),
  })
  const callbacks = mockEnginePortCallbacks(runtime)
  const engine = buildMockEnginePort({
    getScenario: runtime.getScenario,
    listeners,
    onStart: runtime.onStartTracked,
    ...callbacks,
  })

  return {
    engine,
    setScenario(id) {
      held.take()
      runtime.setScenarioRef(scenarioById(id))
      republishScenario(runtime.getScenario(), listeners)
    },
    ...catalogPublishers(listeners),
    ...surfacePublishers(listeners),
    resolveHeldStart(outcome) {
      held.take()?.resolve(outcome ?? runtime.getScenario().startOutcome)
    },
    startRequestCount: () => startCount,
    lastStartRequest: () => lastStart,
  }
}