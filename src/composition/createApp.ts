import {
  createLoadContextUseCase,
  createLoadResourcesUseCase,
  createLoadWorkflowsUseCase,
  createStartTaskUseCase,
} from '../application'
import {
  createMockEngine,
  type MockEngineControls,
  type ScenarioId,
} from '../adapters/mock'
import { createAppPresenter, type AppPresenter } from '../presentation'

export type AppBundle = {
  readonly presenter: AppPresenter
  readonly mock: MockEngineControls
}

/**
 * Single composition root: constructs mock adapter, use cases, presenter.
 * Features must not import concrete adapters; only this module may.
 */
export function createApp(scenario: ScenarioId = 'populated'): AppBundle {
  const mock = createMockEngine(scenario)
  const loadContext = createLoadContextUseCase(mock.engine)
  const startTask = createStartTaskUseCase(mock.engine)
  const loadWorkflows = createLoadWorkflowsUseCase(mock.engine)
  const loadResources = createLoadResourcesUseCase(mock.engine)
  const presenter = createAppPresenter({
    loadContext,
    startTask,
    loadWorkflows,
    loadResources,
  })
  return { presenter, mock }
}
