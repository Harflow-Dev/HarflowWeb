import type {
  LoadContextUseCase,
  LoadResourcesUseCase,
  LoadStatisticsUseCase,
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
import type { AppRoute, AppScreenState } from './appState'
import { PresenterSession } from './presenterSession'
import { ResourcesSession } from './resourcesSession'
import type { OpenMenu } from './screenState'
import { StatisticsSession } from './statisticsSession'
import { TaskSession } from './taskSession'
import { WorkflowsSession } from './workflowsSession'

export type AppListener = (state: AppScreenState) => void

type Deps = {
  readonly loadContext: LoadContextUseCase
  readonly startTask: StartTaskUseCase
  readonly loadWorkflows: LoadWorkflowsUseCase
  readonly loadResources: LoadResourcesUseCase
  readonly loadStatistics: LoadStatisticsUseCase
  readonly loadTask: LoadTaskUseCase
}

/**
 * App shell session: owns new-task, workflows, resources, statistics, and
 * running-task lifetimes + route. Navigating does not dispose child sessions,
 * so drafts, range selection, task identity, and in-flight launches survive.
 */
export class AppSession {
  private route: AppRoute = 'new-task'
  private readonly newTask: PresenterSession
  private readonly workflows: WorkflowsSession
  private readonly resources: ResourcesSession
  private readonly statistics: StatisticsSession
  private readonly task: TaskSession
  private readonly listeners = new Set<AppListener>()
  private snapshot: AppScreenState

  constructor(deps: Deps) {
    this.newTask = new PresenterSession({
      loadContext: deps.loadContext,
      startTask: deps.startTask,
    })
    this.workflows = new WorkflowsSession(deps.loadWorkflows)
    this.resources = new ResourcesSession(deps.loadResources)
    this.statistics = new StatisticsSession(deps.loadStatistics)
    this.task = new TaskSession(deps.loadTask)
    this.snapshot = this.buildSnapshot()
    this.newTask.subscribe(() => this.emit())
    this.workflows.subscribe(() => this.emit())
    this.resources.subscribe(() => this.emit())
    this.statistics.subscribe(() => this.emit())
    this.task.subscribe(() => this.emit())
  }

  subscribe(listener: AppListener): () => void {
    this.listeners.add(listener)
    listener(this.snapshot)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getState(): AppScreenState {
    return this.snapshot
  }

  start(): void {
    this.newTask.start()
    this.workflows.start()
    this.resources.start()
    this.statistics.start()
    this.task.start()
  }

  dispose(): void {
    this.newTask.dispose()
    this.workflows.dispose()
    this.resources.dispose()
    this.statistics.dispose()
    this.task.dispose()
  }

  navigate(route: AppRoute): void {
    if (this.route === route) return
    this.route = route
    this.emit()
  }

  openTask(taskId: TaskId): void {
    this.route = 'task'
    this.task.openTask(taskId)
    this.emit()
  }

  selectStatisticsRange(range: StatisticsRangeId): void {
    this.statistics.selectRange(range)
  }

  setAppearance(appearance: Appearance): void {
    this.newTask.setAppearance(appearance)
  }

  cycleAppearance(): void {
    this.newTask.cycleAppearance()
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this.newTask.setSidebarCollapsed(collapsed)
  }

  setPrompt(prompt: string): void {
    this.newTask.setPrompt(prompt)
  }

  setOpenMenu(menu: OpenMenu): void {
    this.newTask.setOpenMenu(menu)
  }

  selectRepository(id: RepositoryId): void {
    this.newTask.selectRepository(id)
  }

  selectHarness(id: HarnessId): void {
    this.newTask.selectHarness(id)
  }

  selectModel(id: ModelId): void {
    this.newTask.selectModel(id)
  }

  selectAccess(access: AccessLevel): void {
    this.newTask.selectAccess(access)
  }

  submit(): void {
    this.newTask.submit()
  }

  private buildSnapshot(): AppScreenState {
    return {
      route: this.route,
      newTask: this.newTask.getState(),
      workflows: this.workflows.getState(),
      resources: this.resources.getState(),
      statistics: this.statistics.getState(),
      task: this.task.getState(),
    }
  }

  private emit(): void {
    this.snapshot = this.buildSnapshot()
    for (const listener of this.listeners) listener(this.snapshot)
  }
}
