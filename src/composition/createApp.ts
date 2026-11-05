import {
  createLoadContextUseCase,
  createStartTaskUseCase,
} from '../application'
import {
  createMockEngine,
  type MockEngineControls,
  type ScenarioId,
} from '../adapters/mock'
import { createNewTaskPresenter, type NewTaskPresenter } from '../presentation'

export type AppBundle = {
  readonly presenter: NewTaskPresenter
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
  const presenter = createNewTaskPresenter({ loadContext, startTask })
  return { presenter, mock }
}
