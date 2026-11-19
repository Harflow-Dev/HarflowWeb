import type {
  AccessLevel,
  Appearance,
  HarnessId,
  ModelId,
  ParallelGroupId,
  PendingLaunchId,
  RepositoryId,
  StatisticsRangeId,
  TaskChangesEntryRef,
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
  navigationUpdatesRoute,
} from './appNavigation'
import type { AppRoute, AppScreenState, SettingsSection } from './appState'
import type { PresenterSession } from './presenterSession'
import * as parallelNav from './appSessionParallel'
import type { PendingLaunchStopOutcome } from './pendingLaunchesState'
import type { OpenMenu } from './screenState'
import type { WorkflowRunViewMode } from './workflowRunParallel'
import type {
  TaskChangesChrome,
  TaskCommandChrome,
  TaskDialogKind,
  TaskDialogOpener,
  TaskOverflowChrome,
} from './taskState'

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
  private readonly nav: parallelNav.AppNavContext
  private settingsSection: SettingsSection = 'general'
  private readonly listeners = new Set<AppListener>()
  private snapshot: AppScreenState

  constructor(deps: AppSessionDeps) {
    this.children = createAppChildSessions(deps)
    this.nav = {
      children: this.children,
      setRoute: (route) => this.setRoute(route),
      emit: () => this.emit(),
    }
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
    this.setRoute(route)
    if (route === 'pending-launches') {
      this.children.pendingLaunches.openInventory()
    }
    this.emit()
  }

  openWorkflowExecution(id: WorkflowRunId): void {
    closeParallelGroup(this.children.parallelGroup)
    closePendingLaunches(this.children.pendingLaunches)
    this.setRoute('workflows')
    this.children.workflowExecution.open(id); this.emit()
  }

  openParallelGroup(id: ParallelGroupId): void {
    parallelNav.openParallelGroup(this.nav, id)
  }

  openPendingLaunches(): void {
    parallelNav.openPendingLaunches(this.nav)
  }

  openPendingLaunch(id: PendingLaunchId): void {
    parallelNav.openPendingLaunch(this.nav, id)
  }

  setPendingLaunchStopConfirm(open: boolean): void {
    parallelNav.setPendingLaunchStopConfirm(this.nav, open)
  }

  seedPendingLaunchStopOutcome(outcome: PendingLaunchStopOutcome): void {
    parallelNav.seedPendingLaunchStopOutcome(this.nav, outcome)
  }

  setParallelGroupShowPrompt(show: boolean): void {
    parallelNav.setParallelGroupShowPrompt(this.nav, show)
  }

  setParallelGroupOpenMenuLaneId(laneId: string | null): void {
    parallelNav.setParallelGroupOpenMenuLaneId(this.nav, laneId)
  }

  setParallelGroupCancelAllConfirm(open: boolean): void {
    parallelNav.setParallelGroupCancelAllConfirm(this.nav, open)
  }

  applyParallelGroupChrome(chrome: parallelNav.ParallelGroupChrome): void {
    parallelNav.applyParallelGroupChrome(this.nav, chrome)
  }

  openWorkflowRun(id: WorkflowId): void {
    closePendingLaunches(this.children.pendingLaunches)
    this.setRoute('workflows')
    this.children.workflows.openRun(id)
    this.emit()
  }

  closeWorkflowRun(): void { this.children.workflows.closeRun() }
  setWorkflowRunTask(task: string): void { this.children.workflows.setTask(task) }
  setWorkflowRunGoal(goal: string): void { this.children.workflows.setGoal(goal) }
  setWorkflowRunGoalOpen(open: boolean): void { this.children.workflows.setGoalOpen(open) }
  selectWorkflowRunRepository(id: RepositoryId): void { this.children.workflows.selectRepository(id) }
  selectWorkflowRunOverride(id: WorkflowOverrideId): void { this.children.workflows.selectOverride(id) }

  openWorkflowEditor(id: WorkflowId): void {
    closePendingLaunches(this.children.pendingLaunches)
    this.setRoute('workflows')
    this.children.workflowEditor.open(id)
    this.emit()
  }

  closeWorkflowEditor(): void { this.children.workflowEditor.close() }
  selectWorkflowNode(id: WorkflowNodeId): void { this.children.workflowEditor.select(id) }
  selectWorkflowRunNode(id: WorkflowNodeId | null): void {
    this.children.workflowExecution.selectNode(id)
  }
  setWorkflowRunViewMode(mode: WorkflowRunViewMode): void {
    this.children.workflowExecution.setViewMode(mode)
  }
  openTask(taskId: TaskId): void { parallelNav.openTask(this.nav, taskId) }

  setTaskChangesPaneOpen(open: boolean): void {
    this.children.task.setChangesPaneOpen(open)
  }
  selectTaskChangedEntry(entry: TaskChangesEntryRef): void {
    this.children.task.selectChangedEntry(entry)
  }
  selectTaskChangesTurn(taskId: TaskId): void {
    this.children.task.selectChangesTurn(taskId)
  }
  setTaskRepositoryExpanded(root: string, expanded: boolean): void {
    this.children.task.setRepositoryExpanded(root, expanded)
  }
  seedTaskCommandChrome(taskId: TaskId, chrome: TaskCommandChrome): void {
    this.children.task.seedTaskCommandChrome(taskId, chrome); this.emit()
  }
  setTaskOverflowMenuOpen(open: boolean): void {
    this.children.task.setOverflowMenuOpen(open)
  }
  openTaskDialog(dialog: TaskDialogKind, opener: TaskDialogOpener | null): void {
    this.children.task.openTaskDialog(dialog, opener)
  }
  closeTaskDialog(): void { this.children.task.closeTaskDialog() }
  seedTaskOverflowChrome(taskId: TaskId, chrome: TaskOverflowChrome): void {
    this.children.task.seedTaskOverflowChrome(taskId, chrome); this.emit()
  }
  seedTaskChangesChrome(taskId: TaskId, chrome: TaskChangesChrome): void {
    this.children.task.seedTaskChangesChrome(taskId, chrome); this.emit()
  }
  setTaskPaneTab(tab: 'changes' | 'events'): void {
    this.children.task.setPaneTab(tab)
  }
  revealTaskEventsFacts(
    group: 'enforcement' | 'notices' | 'continuity',
  ): void {
    this.children.task.revealEventsFacts(group)
  }
  loadTaskEarlierEvents(): void {
    this.children.task.loadEarlierEvents()
  }
  cancelTaskQueuedMessage(messageId: string): boolean {
    return this.children.task.cancelQueuedMessage(messageId)
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

  setAppearance(appearance: Appearance): void { this.children.newTask.setAppearance(appearance) }
  cycleAppearance(): void { this.children.newTask.cycleAppearance() }
  setSidebarCollapsed(collapsed: boolean): void { this.children.newTask.setSidebarCollapsed(collapsed) }
  setPrompt(prompt: string): void { this.children.newTask.setPrompt(prompt) }
  setOpenMenu(menu: OpenMenu): void { this.children.newTask.setOpenMenu(menu) }
  /** Direct New task session for composer options and draft controls. */
  composer(): PresenterSession { return this.children.newTask }
  selectRepository(id: RepositoryId): void { this.children.newTask.selectRepository(id) }
  selectHarness(id: HarnessId): void { this.children.newTask.selectHarness(id) }
  selectModel(id: ModelId): void { this.children.newTask.selectModel(id) }
  selectAccess(access: AccessLevel): void { this.children.newTask.selectAccess(access) }
  submit(): void { this.children.newTask.submit() }

  /** Leaving the task route drops command lifecycle chrome seeded on it. */
  private setRoute(next: AppRoute): void {
    if (this.route === 'task' && next !== 'task') {
      this.children.task.clearCommandChrome()
    }
    this.route = next
  }

  private buildSnapshot(): AppScreenState {
    return buildAppSnapshot(this.route, this.settingsSection, this.children)
  }

  private emit(): void {
    this.snapshot = this.buildSnapshot()
    for (const listener of this.listeners) listener(this.snapshot)
  }
}
