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
import type { AppRoute, AppScreenState } from './appState'
import { PresenterSession } from './presenterSession'
import type { OpenMenu } from './screenState'
import { WorkflowsSession } from './workflowsSession'

export type AppListener = (state: AppScreenState) => void

type Deps = {
  readonly loadContext: LoadContextUseCase
  readonly startTask: StartTaskUseCase
  readonly loadWorkflows: LoadWorkflowsUseCase
}

/**
 * App shell session: owns new-task + workflows lifetimes and route.
 * Navigating does not dispose either child session, so drafts and in-flight
 * launches survive and resume correctly on return.
 */
export class AppSession {
  private route: AppRoute = 'new-task'
  private readonly newTask: PresenterSession
  private readonly workflows: WorkflowsSession
  private readonly listeners = new Set<AppListener>()
  /** Stable snapshot for useSyncExternalStore. */
  private snapshot: AppScreenState

  constructor(deps: Deps) {
    this.newTask = new PresenterSession({
      loadContext: deps.loadContext,
      startTask: deps.startTask,
    })
    this.workflows = new WorkflowsSession(deps.loadWorkflows)
    this.snapshot = this.buildSnapshot()
    this.newTask.subscribe(() => this.emit())
    this.workflows.subscribe(() => this.emit())
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
  }

  dispose(): void {
    this.newTask.dispose()
    this.workflows.dispose()
  }

  navigate(route: AppRoute): void {
    if (this.route === route) return
    this.route = route
    this.emit()
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

  /** Test/helper access to the new-task child without re-subscribing. */
  getNewTaskState() {
    return this.newTask.getState()
  }

  private buildSnapshot(): AppScreenState {
    return {
      route: this.route,
      newTask: this.newTask.getState(),
      workflows: this.workflows.getState(),
    }
  }

  private emit(): void {
    this.snapshot = this.buildSnapshot()
    for (const listener of this.listeners) listener(this.snapshot)
  }
}
