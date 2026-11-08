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
import {
  buildAppSnapshot,
  createAppChildSessions,
  disposeAppChildSessions,
  startAppChildSessions,
  subscribeAppChildSessions,
  type AppChildSessions,
  type AppSessionDeps,
} from './appChildSessions'
import {
  closeParallelGroup,
  closeWorkflowExecution,
  navigationUpdatesRoute,
} from './appNavigation'
import type { AppRoute, AppScreenState, SettingsSection } from './appState'
import type { PresenterSession } from './presenterSession'
import type { OpenMenu } from './screenState'
import type { WorkflowRunViewMode } from './workflowRunParallel'

export type AppListener = (state: AppScreenState) => void

/**
 * App shell session: owns new-task, workflows, resources, statistics, and
 * task, settings, and Needs you lifetimes + route. Navigating does not
 * dispose child sessions, so drafts, range selection, task identity,
 * the Settings section, appearance, and in-flight launches survive.
 */
export class AppSession {
  private route: AppRoute = 'new-task'
  private readonly children: AppChildSessions
  private settingsSection: SettingsSection = 'general'
  private readonly listeners = new Set<AppListener>()
  private snapshot: AppScreenState

  constructor(deps: AppSessionDeps) {
    this.children = createAppChildSessions(deps)
    this.snapshot = this.buildSnapshot()
    subscribeAppChildSessions(this.children, () => this.emit())
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
    startAppChildSessions(this.children)
  }

  dispose(): void {
    disposeAppChildSessions(this.children)
  }

  navigate(route: AppRoute): void {
    const update = navigationUpdatesRoute(
      this.route,
      route,
      this.children.workflowExecution,
      this.children.parallelGroup,
    )
    if (!update) return
    this.route = route
    this.emit()
  }

  openWorkflowExecution(id: WorkflowRunId): void {
    closeParallelGroup(this.children.parallelGroup)
    this.route = 'workflows'
    this.children.workflowExecution.open(id)
    this.emit()
  }

  openParallelGroup(id: ParallelGroupId): void {
    closeWorkflowExecution(this.children.workflowExecution)
    this.route = 'parallel-group'
    this.children.parallelGroup.open(id)
    this.emit()
  }

  openWorkflowRun(id: WorkflowId): void {
    this.route = 'workflows'
    this.children.workflows.openRun(id)
    this.emit()
  }

  closeWorkflowRun(): void { this.children.workflows.closeRun() }

  setWorkflowRunTask(task: string): void {
    this.children.workflows.setTask(task)
  }

  setWorkflowRunGoal(goal: string): void {
    this.children.workflows.setGoal(goal)
  }

  setWorkflowRunGoalOpen(open: boolean): void {
    this.children.workflows.setGoalOpen(open)
  }

  selectWorkflowRunRepository(id: RepositoryId): void {
    this.children.workflows.selectRepository(id)
  }

  selectWorkflowRunOverride(id: WorkflowOverrideId): void {
    this.children.workflows.selectOverride(id)
  }

  openWorkflowEditor(id: WorkflowId): void {
    this.route = 'workflows'
    this.children.workflowEditor.open(id)
    this.emit()
  }

  closeWorkflowEditor(): void { this.children.workflowEditor.close() }

  selectWorkflowNode(id: WorkflowNodeId): void {
    this.children.workflowEditor.select(id)
  }

  selectWorkflowRunNode(id: WorkflowNodeId | null): void {
    this.children.workflowExecution.selectNode(id)
  }

  setWorkflowRunViewMode(mode: WorkflowRunViewMode): void {
    this.children.workflowExecution.setViewMode(mode)
  }

  openTask(taskId: TaskId): void {
    closeWorkflowExecution(this.children.workflowExecution)
    closeParallelGroup(this.children.parallelGroup)
    this.route = 'task'
    this.children.task.openTask(taskId)
    this.emit()
  }

  setTaskChangesPaneOpen(open: boolean): void {
    this.children.task.setChangesPaneOpen(open)
  }

  selectTaskChangedFile(path: string): void {
    this.children.task.selectChangedFile(path)
  }

  selectStatisticsRange(range: StatisticsRangeId): void {
    this.children.statistics.selectRange(range)
  }

  selectSettingsSection(section: SettingsSection): void {
    if (this.settingsSection === section) return
    this.settingsSection = section
    this.emit()
  }

  setAppearance(appearance: Appearance): void {
    this.children.newTask.setAppearance(appearance)
  }

  cycleAppearance(): void {
    this.children.newTask.cycleAppearance()
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this.children.newTask.setSidebarCollapsed(collapsed)
  }

  setPrompt(prompt: string): void {
    this.children.newTask.setPrompt(prompt)
  }

  setOpenMenu(menu: OpenMenu): void {
    this.children.newTask.setOpenMenu(menu)
  }

  /** Direct New task session for composer options and draft controls. */
  composer(): PresenterSession { return this.children.newTask }

  selectRepository(id: RepositoryId): void {
    this.children.newTask.selectRepository(id)
  }

  selectHarness(id: HarnessId): void {
    this.children.newTask.selectHarness(id)
  }

  selectModel(id: ModelId): void {
    this.children.newTask.selectModel(id)
  }

  selectAccess(access: AccessLevel): void {
    this.children.newTask.selectAccess(access)
  }

  submit(): void {
    this.children.newTask.submit()
  }

  private buildSnapshot(): AppScreenState {
    return buildAppSnapshot(this.route, this.settingsSection, this.children)
  }

  private emit(): void {
    this.snapshot = this.buildSnapshot()
    for (const listener of this.listeners) listener(this.snapshot)
  }
}
