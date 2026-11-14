import type {
  AccessLevel,
  Appearance,
  HarnessId,
  ModelId,
  ParallelGroupId,
  PendingLaunchId,
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
  closePendingLaunches,
  closeWorkflowExecution,
  navigationUpdatesRoute,
} from './appNavigation'
import type { AppRoute, AppScreenState, SettingsSection } from './appState'
import type { PresenterSession } from './presenterSession'
import type { ParallelGroupQueuedOutcome } from './parallelGroupState'
import type { PendingLaunchStopOutcome } from './pendingLaunchesState'
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
    if (route === 'pending-launches' && this.route === 'pending-launches') {
      this.children.pendingLaunches.openInventory()
      this.emit()
      return
    }
    const update = navigationUpdatesRoute(
      this.route,
      route,
      this.children.workflowExecution,
      this.children.parallelGroup,
      this.children.pendingLaunches,
    )
    if (!update) return
    this.route = route
    if (route === 'pending-launches') {
      this.children.pendingLaunches.openInventory()
    }
    this.emit()
  }

  openWorkflowExecution(id: WorkflowRunId): void {
    closeParallelGroup(this.children.parallelGroup)
    closePendingLaunches(this.children.pendingLaunches)
    this.route = 'workflows'
    this.children.workflowExecution.open(id)
    this.emit()
  }

  openParallelGroup(id: ParallelGroupId): void {
    closeWorkflowExecution(this.children.workflowExecution)
    closePendingLaunches(this.children.pendingLaunches)
    this.route = 'parallel-group'
    this.children.parallelGroup.open(id)
    this.emit()
  }

  openPendingLaunches(): void {
    closeWorkflowExecution(this.children.workflowExecution)
    closeParallelGroup(this.children.parallelGroup)
    this.route = 'pending-launches'
    this.children.pendingLaunches.openInventory()
    this.emit()
  }

  openPendingLaunch(id: PendingLaunchId): void {
    closeWorkflowExecution(this.children.workflowExecution)
    closeParallelGroup(this.children.parallelGroup)
    this.route = 'pending-launches'
    this.children.pendingLaunches.openLaunch(id)
    this.emit()
  }

  setPendingLaunchStopConfirm(open: boolean): void {
    this.children.pendingLaunches.setStopConfirm(open)
  }

  /** Preview seeding: show a prior Stop outcome on the selected launch. */
  seedPendingLaunchStopOutcome(outcome: PendingLaunchStopOutcome): void {
    this.children.pendingLaunches.setStopOutcome(outcome)
  }

  setParallelGroupShowPrompt(show: boolean): void {
    this.children.parallelGroup.setShowPrompt(show)
  }

  setParallelGroupOpenMenuLaneId(laneId: string | null): void {
    this.children.parallelGroup.setOpenMenuLaneId(laneId)
  }

  setParallelGroupCancelAllConfirm(open: boolean): void {
    this.children.parallelGroup.setCancelAllConfirm(open)
  }

  applyParallelGroupChrome(chrome: {
    readonly showPrompt?: boolean
    readonly openMenuLaneId?: string | null
    readonly cancelAllConfirm?: boolean
    readonly queuedCancelOutcome?: ParallelGroupQueuedOutcome | null
  }): void {
    this.children.parallelGroup.applyChrome(chrome)
  }

  openWorkflowRun(id: WorkflowId): void {
    closePendingLaunches(this.children.pendingLaunches)
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
    closePendingLaunches(this.children.pendingLaunches)
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
    closePendingLaunches(this.children.pendingLaunches)
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

  setExpandedHarness(id: string | null): void {
    this.children.harnesses.setExpandedId(id)
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
