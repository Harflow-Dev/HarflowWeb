import {
  createMockEngine,
  type MockEngineControls,
  type ScenarioId,
} from '../adapters/mock'
import { createAppPresenter, type AppPresenter } from '../presentation'
import { createAppUseCases } from './createAppUseCases'

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
  const presenter = createAppPresenter(createAppUseCases(mock.engine))
  return { presenter, mock }
}
