/**
 * Mock EnginePort observation surface (subscribe + read paths).
 */
import type { TaskId, TaskLoad } from '../../model'
import type { ScenarioDefinition } from './scenarios'
import type { MockListenerSets } from './mockEngineCore'
import {
  mockObserveAuxSurfaces,
  mockObserveShellSurfaces,
} from './mockEngineObserveCatalog'
import { mockObservePendingSurfaces } from './mockEngineObservePending'
import {
  mockObserveStatisticsSurface,
  mockObserveTaskEventSurfaces,
} from './mockEngineObserveTasks'
import {
  mockObserveWorkflowListSurfaces,
  mockObserveWorkflowRunSurfaces,
} from './mockEngineObserveWorkflows'

export type MockEngineObserveOptions = {
  readonly getScenario: () => ScenarioDefinition
  readonly listeners: MockListenerSets
  readonly resolveTask: (taskId: TaskId) => TaskLoad
}

export function buildMockEngineObservePort(options: MockEngineObserveOptions) {
  return {
    ...mockObserveShellSurfaces(options),
    ...mockObserveAuxSurfaces(options),
    ...mockObserveStatisticsSurface(options),
    ...mockObserveTaskEventSurfaces(options),
    ...mockObserveWorkflowListSurfaces(options),
    ...mockObserveWorkflowRunSurfaces(options),
    ...mockObservePendingSurfaces(options),
  }
}