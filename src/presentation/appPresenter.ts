import type {
  LoadContextUseCase,
  LoadWorkflowsUseCase,
  StartTaskUseCase,
} from '../application'
import type {
  AccessLevel,
  Appearance,
  HarnessId,
  ModelId,
  RepositoryId,
} from '../model'
import { AppSession, type AppListener } from './appSession'
import type { AppRoute, AppScreenState } from './appState'
import type { OpenMenu } from './screenState'

export type AppPresenter = {
  subscribe(listener: AppListener): () => void
  getState(): AppScreenState
  start(): void
  dispose(): void
  navigate(route: AppRoute): void
  setAppearance(appearance: Appearance): void
  cycleAppearance(): void
  setSidebarCollapsed(collapsed: boolean): void
  setPrompt(prompt: string): void
  setOpenMenu(menu: OpenMenu): void
  selectRepository(id: RepositoryId): void
  selectHarness(id: HarnessId): void
  selectModel(id: ModelId): void
  selectAccess(access: AccessLevel): void
  submit(): void
}

type Deps = {
  readonly loadContext: LoadContextUseCase
  readonly startTask: StartTaskUseCase
  readonly loadWorkflows: LoadWorkflowsUseCase
}

export function createAppPresenter(deps: Deps): AppPresenter {
  const session = new AppSession(deps)
  return {
    subscribe: (listener) => session.subscribe(listener),
    getState: () => session.getState(),
    start: () => session.start(),
    dispose: () => session.dispose(),
    navigate: (route) => session.navigate(route),
    setAppearance: (appearance) => session.setAppearance(appearance),
    cycleAppearance: () => session.cycleAppearance(),
    setSidebarCollapsed: (collapsed) => session.setSidebarCollapsed(collapsed),
    setPrompt: (prompt) => session.setPrompt(prompt),
    setOpenMenu: (menu) => session.setOpenMenu(menu),
    selectRepository: (id) => session.selectRepository(id),
    selectHarness: (id) => session.selectHarness(id),
    selectModel: (id) => session.selectModel(id),
    selectAccess: (access) => session.selectAccess(access),
    submit: () => session.submit(),
  }
}
