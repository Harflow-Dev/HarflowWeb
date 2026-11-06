import type {
  LoadContextUseCase,
  LoadHarnessesUseCase,
  LoadNeedsYouUseCase,
  LoadResourcesUseCase,
  LoadStatisticsUseCase,
  LoadTaskChangesUseCase,
  LoadTaskUseCase,
  LoadWorkflowsUseCase,
  StartTaskUseCase,
} from '../application'
import type {
  AccessLevel,
  Appearance,
  HarnessId,
  ModelId,
  RepositoryId,
  StatisticsRangeId,
  TaskId,
} from '../model'
import { AppSession, type AppListener } from './appSession'
import type { AppRoute, AppScreenState, SettingsSection } from './appState'
import type { OpenMenu } from './screenState'

export type AppPresenter = {
  subscribe(listener: AppListener): () => void
  getState(): AppScreenState
  start(): void
  dispose(): void
  navigate(route: AppRoute): void
  openTask(taskId: TaskId): void
  setTaskChangesPaneOpen(open: boolean): void
  selectTaskChangedFile(path: string): void
  selectStatisticsRange(range: StatisticsRangeId): void
  selectSettingsSection(section: SettingsSection): void
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
  readonly loadResources: LoadResourcesUseCase
  readonly loadStatistics: LoadStatisticsUseCase
  readonly loadTask: LoadTaskUseCase
  readonly loadTaskChanges: LoadTaskChangesUseCase
  readonly loadHarnesses: LoadHarnessesUseCase
  readonly loadNeedsYou: LoadNeedsYouUseCase
}

export function createAppPresenter(deps: Deps): AppPresenter {
  const session = new AppSession(deps)
  return {
    subscribe: (listener) => session.subscribe(listener),
    getState: () => session.getState(),
    start: () => session.start(),
    dispose: () => session.dispose(),
    navigate: (route) => session.navigate(route),
    openTask: (taskId) => session.openTask(taskId),
    setTaskChangesPaneOpen: (open) => session.setTaskChangesPaneOpen(open),
    selectTaskChangedFile: (path) => session.selectTaskChangedFile(path),
    selectStatisticsRange: (range) => session.selectStatisticsRange(range),
    selectSettingsSection: (section) => session.selectSettingsSection(section),
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
