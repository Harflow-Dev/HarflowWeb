import type { EnginePort } from '../../application'
import type {
  ContextLoad,
  HarnessesLoad,
  NeedsYouLoad,
  ParallelGroupId,
  ParallelGroupLoad,
  ResourcesLoad,
  StartTaskOutcome,
  StartTaskRequest,
  StatisticsLoad,
  StatisticsRangeId,
  TaskChangesLoad,
  TaskChangesQuery,
  TaskId,
  TaskLoad,
  WorkflowEditorLoad,
  WorkflowId,
  WorkflowRunContextLoad,
  WorkflowsLoad,
} from '../../model'
import {
  buildMockEnginePort,
  createHeldStartTracker,
  createListenerSets,
} from './mockEngineCore'
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
  publishHarnesses(load: HarnessesLoad): void
  publishNeedsYou(load: NeedsYouLoad): void
  publishWorkflowRun(workflowId: WorkflowId, load: WorkflowRunContextLoad): void
  publishWorkflowEditor(workflowId: WorkflowId, load: WorkflowEditorLoad): void
  publishParallelGroup(groupId: ParallelGroupId, load: ParallelGroupLoad): void
  resolveHeldStart(outcome?: StartTaskOutcome): void
  readonly startRequestCount: () => number
  readonly lastStartRequest: () => StartTaskRequest | null
}

export function createMockEngine(
  initialScenario: ScenarioId = 'populated',
): MockEngineControls {
  let scenario = scenarioById(initialScenario)
  let startCount = 0
  let lastStart: StartTaskRequest | null = null
  const held = createHeldStartTracker()
  const listeners = createListenerSets()

  const engine = buildMockEnginePort({
    getScenario: () => scenario,
    listeners,
    async onStart(request) {
      startCount += 1
      lastStart = request
      if (scenario.holdStart) return held.begin().promise
      return scenario.startOutcome
    },
  })

  return {
    engine,
    setScenario(id) {
      scenario = scenarioById(id)
      held.take()
      republishScenario(scenario, listeners)
    },
    ...catalogPublishers(listeners),
    ...surfacePublishers(listeners),
    resolveHeldStart(outcome) {
      held.take()?.resolve(outcome ?? scenario.startOutcome)
    },
    startRequestCount: () => startCount,
    lastStartRequest: () => lastStart,
  }
}
