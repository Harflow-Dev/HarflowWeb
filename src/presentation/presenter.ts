import type { LoadContextUseCase, StartTaskUseCase } from '../application'
import type {
  AccessLevel,
  Appearance,
  HarnessId,
  ModelId,
  RepositoryId,
} from '../model'
import {
  PresenterSession,
  type PresenterListener,
} from './presenterSession'
import type { NewTaskScreenState, OpenMenu } from './screenState'

export type { PresenterListener }

export type NewTaskPresenter = {
  subscribe(listener: PresenterListener): () => void
  getState(): NewTaskScreenState
  start(): void
  dispose(): void
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
}

export function createNewTaskPresenter(deps: Deps): NewTaskPresenter {
  const session = new PresenterSession(deps)
  return {
    subscribe: (listener) => session.subscribe(listener),
    getState: () => session.getState(),
    start: () => session.start(),
    dispose: () => session.dispose(),
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
