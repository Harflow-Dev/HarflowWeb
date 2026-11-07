import type {
  LoadContextUseCase,
  LoadHarnessesUseCase,
  LoadNeedsYouUseCase,
  LoadParallelGroupUseCase,
  LoadResourcesUseCase,
  LoadWorkflowEditorUseCase,
  LoadWorkflowExecutionUseCase,
  LoadWorkflowRunUseCase,
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
  ParallelGroupId,
  RepositoryId,
  StatisticsRangeId,
  TaskId,
  WorkflowId,
  WorkflowNodeId,
  WorkflowRunId,
  WorkflowOverrideId,
} from '../model'
import type { AppRoute, AppScreenState, SettingsSection } from './appState'
import { HarnessesSession } from './harnessesSession'
import { NeedsYouSession } from './needsYouSession'
import { ParallelGroupSession } from './parallelGroupSession'
import { PresenterSession } from './presenterSession'
import { ResourcesSession } from './resourcesSession'
import type { OpenMenu } from './screenState'
import { StatisticsSession } from './statisticsSession'
import { TaskSession } from './taskSession'
import { WorkflowEditorSession } from './workflowEditorSession'
import { WorkflowExecutionSession } from './workflowExecutionSession'
import type { WorkflowRunViewMode } from './workflowRunParallel'
import { WorkflowsSession } from './workflowsSession'

export type AppListener = (state: AppScreenState) => void

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
  readonly loadWorkflowRun: LoadWorkflowRunUseCase
  readonly loadWorkflowEditor: LoadWorkflowEditorUseCase
  readonly loadWorkflowExecution: LoadWorkflowExecutionUseCase
  readonly loadParallelGroup: LoadParallelGroupUseCase
}

/**
 * App shell session: owns new-task, workflows, resources, statistics, and
 * task, settings, and Needs you lifetimes + route. Navigating does not
 * dispose child sessions, so drafts, range selection, task identity,
 * the Settings section, appearance, and in-flight launches survive.
 */
export class AppSession {
  private route: AppRoute = 'new-task'
  private readonly newTask: PresenterSession
  private readonly workflows: WorkflowsSession
  private readonly resources: ResourcesSession
  private readonly statistics: StatisticsSession
  private readonly task: TaskSession
  private readonly harnesses: HarnessesSession
  private readonly needsYou: NeedsYouSession
  private readonly workflowEditor: WorkflowEditorSession
  private readonly workflowExecution: WorkflowExecutionSession
  private readonly parallelGroup: ParallelGroupSession
  private settingsSection: SettingsSection = 'general'
  private readonly listeners = new Set<AppListener>()
  private snapshot: AppScreenState

  constructor(deps: Deps) {
    this.newTask = new PresenterSession({
      loadContext: deps.loadContext,
      startTask: deps.startTask,
    })
    this.workflows = new WorkflowsSession(
      deps.loadWorkflows,
      deps.loadWorkflowRun,
    )
    this.resources = new ResourcesSession(deps.loadResources)
    this.statistics = new StatisticsSession(deps.loadStatistics)
    this.task = new TaskSession(deps.loadTask, deps.loadTaskChanges)
    this.harnesses = new HarnessesSession(deps.loadHarnesses)
    this.needsYou = new NeedsYouSession(deps.loadNeedsYou)
    this.workflowEditor = new WorkflowEditorSession(deps.loadWorkflowEditor)
    this.workflowExecution = new WorkflowExecutionSession(deps.loadWorkflowExecution)
    this.parallelGroup = new ParallelGroupSession(deps.loadParallelGroup)
    this.snapshot = this.buildSnapshot()
    this.newTask.subscribe(() => this.emit())
    this.workflows.subscribe(() => this.emit())
    this.resources.subscribe(() => this.emit())
    this.statistics.subscribe(() => this.emit())
    this.task.subscribe(() => this.emit())
    this.harnesses.subscribe(() => this.emit())
    this.needsYou.subscribe(() => this.emit())
    this.workflowEditor.subscribe(() => this.emit())
    this.workflowExecution.subscribe(() => this.emit())
    this.parallelGroup.subscribe(() => this.emit())
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
    this.harnesses.start()
    this.needsYou.start()
    this.workflowEditor.start()
    this.workflowExecution.start()
    this.parallelGroup.start()
  }

  dispose(): void {
    this.newTask.dispose()
    this.workflows.dispose()
    this.resources.dispose()
    this.statistics.dispose()
    this.task.dispose()
    this.harnesses.dispose()
    this.needsYou.dispose()
    this.workflowEditor.dispose()
    this.workflowExecution.dispose()
    this.parallelGroup.dispose()
  }

  navigate(route: AppRoute): void {
    const runOpen = this.workflowExecution.getState().runId !== null
    const leavingRun = runOpen && route !== 'workflows'
    const dismissingRun = runOpen && route === 'workflows'
    if (leavingRun || dismissingRun) this.closeWorkflowExecution()
    const groupOpen = this.parallelGroup.getState().groupId !== null
    const leavingGroup = groupOpen && route !== 'parallel-group'
    if (leavingGroup) this.closeParallelGroup()
    if (
      this.route === route &&
      !leavingRun &&
      !dismissingRun &&
      !leavingGroup
    ) {
      return
    }
    this.route = route
    this.emit()
  }

  openWorkflowExecution(id: WorkflowRunId): void {
    this.closeParallelGroup()
    this.route = 'workflows'
    this.workflowExecution.open(id)
    this.emit()
  }

  openParallelGroup(id: ParallelGroupId): void {
    this.closeWorkflowExecution()
    this.route = 'parallel-group'
    this.parallelGroup.open(id)
    this.emit()
  }

  openWorkflowRun(id: WorkflowId): void {
    this.route = 'workflows'
    this.workflows.openRun(id)
    this.emit()
  }

  closeWorkflowRun(): void { this.workflows.closeRun() }

  setWorkflowRunTask(task: string): void {
    this.workflows.setTask(task)
  }

  setWorkflowRunGoal(goal: string): void {
    this.workflows.setGoal(goal)
  }

  setWorkflowRunGoalOpen(open: boolean): void {
    this.workflows.setGoalOpen(open)
  }

  selectWorkflowRunRepository(id: RepositoryId): void {
    this.workflows.selectRepository(id)
  }

  selectWorkflowRunOverride(id: WorkflowOverrideId): void {
    this.workflows.selectOverride(id)
  }

  openWorkflowEditor(id: WorkflowId): void {
    this.route = 'workflows'
    this.workflowEditor.open(id)
    this.emit()
  }

  closeWorkflowEditor(): void { this.workflowEditor.close() }

  selectWorkflowNode(id: WorkflowNodeId): void {
    this.workflowEditor.select(id)
  }

  selectWorkflowRunNode(id: WorkflowNodeId | null): void { this.workflowExecution.selectNode(id) }

  setWorkflowRunViewMode(mode: WorkflowRunViewMode): void { this.workflowExecution.setViewMode(mode) }

  openTask(taskId: TaskId): void {
    this.closeWorkflowExecution()
    this.closeParallelGroup()
    this.route = 'task'
    this.task.openTask(taskId)
    this.emit()
  }

  setTaskChangesPaneOpen(open: boolean): void { this.task.setChangesPaneOpen(open) }

  selectTaskChangedFile(path: string): void { this.task.selectChangedFile(path) }

  selectStatisticsRange(range: StatisticsRangeId): void {
    this.statistics.selectRange(range)
  }

  /** Drop the run observation before any route that is not that run. */
  private closeWorkflowExecution(): void {
    if (this.workflowExecution.getState().runId === null) return
    this.workflowExecution.close()
  }

  /** Drop the Parallel group observation before any other route. */
  private closeParallelGroup(): void {
    if (this.parallelGroup.getState().groupId === null) return
    this.parallelGroup.close()
  }

  selectSettingsSection(section: SettingsSection): void {
    if (this.settingsSection === section) return
    this.settingsSection = section
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

  /** Direct New task session for composer options and draft controls. */
  composer(): PresenterSession { return this.newTask }

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
      settingsSection: this.settingsSection,
      harnesses: this.harnesses.getState(),
      needsYou: this.needsYou.getState(),
      workflowEditor: this.workflowEditor.getState(),
      workflowExecution: this.workflowExecution.getState(),
      parallelGroup: this.parallelGroup.getState(),
    }
  }

  private emit(): void {
    this.snapshot = this.buildSnapshot()
    for (const listener of this.listeners) listener(this.snapshot)
  }
}
