import type {
  LoadContextUseCase,
  LoadHarnessesUseCase,
  LoadNeedsYouUseCase,
  LoadParallelGroupUseCase,
  LoadPendingLaunchCapabilityUseCase,
  LoadPendingLaunchInventoryUseCase,
  LoadPendingLaunchStatusUseCase,
  LoadResourcesUseCase,
  LoadSettingsGeneralUseCase,
  LoadWorkflowEditorUseCase,
  LoadWorkflowExecutionUseCase,
  LoadWorkflowRunUseCase,
  LoadStatisticsUseCase,
  LoadTaskChangesUseCase,
  LoadTaskEventsUseCase,
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
import { AppSession, type AppListener } from './appSession'
import type { AppRoute, AppScreenState, SettingsSection } from './appState'
import type { ParallelGroupQueuedOutcome } from './parallelGroupState'
import type { PendingLaunchStopOutcome } from './pendingLaunchesState'
import type { OpenMenu } from './screenState'
import type { ApprovalsMode, EffortLevel } from './taskOptions'
import type { WorkflowRunViewMode } from './workflowRunParallel'
import type {
  TaskChangesChrome,
  TaskCommandChrome,
  TaskDialogKind,
  TaskDialogOpener,
  TaskOverflowChrome,
} from './taskState'

export type AppPresenter = {
  subscribe(listener: AppListener): () => void
  getState(): AppScreenState
  start(): void
  dispose(): void
  navigate(route: AppRoute): void
  openWorkflowRun(id: WorkflowId): void
  closeWorkflowRun(): void
  setWorkflowRunTask(task: string): void
  setWorkflowRunGoal(goal: string): void
  setWorkflowRunGoalOpen(open: boolean): void
  selectWorkflowRunRepository(id: RepositoryId): void
  selectWorkflowRunOverride(id: WorkflowOverrideId): void
  openWorkflowExecution(id: WorkflowRunId): void
  openParallelGroup(id: ParallelGroupId): void
  setParallelGroupShowPrompt(show: boolean): void
  setParallelGroupOpenMenuLaneId(laneId: string | null): void
  setParallelGroupCancelAllConfirm(open: boolean): void
  applyParallelGroupChrome(chrome: {
    readonly showPrompt?: boolean
    readonly openMenuLaneId?: string | null
    readonly cancelAllConfirm?: boolean
    readonly queuedCancelOutcome?: ParallelGroupQueuedOutcome | null
  }): void
  openPendingLaunches(): void
  openPendingLaunch(id: PendingLaunchId): void
  setPendingLaunchStopConfirm(open: boolean): void
  seedPendingLaunchStopOutcome(outcome: PendingLaunchStopOutcome): void
  openWorkflowEditor(id: WorkflowId): void
  closeWorkflowEditor(): void
  selectWorkflowNode(id: WorkflowNodeId): void
  selectWorkflowRunNode(id: WorkflowNodeId | null): void
  setWorkflowRunViewMode(mode: WorkflowRunViewMode): void
  openTask(taskId: TaskId): void
  setTaskChangesPaneOpen(open: boolean): void
  selectTaskChangedEntry(entry: TaskChangesEntryRef): void
  selectTaskChangesTurn(taskId: TaskId): void
  setTaskRepositoryExpanded(repositoryRoot: string, expanded: boolean): void
  seedTaskCommandChrome(taskId: TaskId, chrome: TaskCommandChrome): void
  setTaskOverflowMenuOpen(open: boolean): void
  openTaskDialog(
    dialog: TaskDialogKind,
    opener: TaskDialogOpener | null,
  ): void
  closeTaskDialog(): void
  seedTaskOverflowChrome(taskId: TaskId, chrome: TaskOverflowChrome): void
  seedTaskChangesChrome(taskId: TaskId, chrome: TaskChangesChrome): void
  setTaskPaneTab(tab: 'changes' | 'events'): void
  loadTaskEarlierEvents(): void
  selectStatisticsRange(range: StatisticsRangeId): void
  selectSettingsSection(section: SettingsSection): void
  setExpandedHarness(id: string | null): void
  setAppearance(appearance: Appearance): void
  cycleAppearance(): void
  setSidebarCollapsed(collapsed: boolean): void
  setPrompt(prompt: string): void
  setOpenMenu(menu: OpenMenu): void
  setOptionsOpen(open: boolean): void
  setEffort(effort: EffortLevel): void
  setTurns(turns: string): void
  setApprovals(approvals: ApprovalsMode): void
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
  readonly loadTaskEvents: LoadTaskEventsUseCase
  readonly loadHarnesses: LoadHarnessesUseCase
  readonly loadSettingsGeneral: LoadSettingsGeneralUseCase
  readonly loadNeedsYou: LoadNeedsYouUseCase
  readonly loadWorkflowRun: LoadWorkflowRunUseCase
  readonly loadWorkflowEditor: LoadWorkflowEditorUseCase
  readonly loadWorkflowExecution: LoadWorkflowExecutionUseCase
  readonly loadParallelGroup: LoadParallelGroupUseCase
  readonly loadPendingLaunchCapability: LoadPendingLaunchCapabilityUseCase
  readonly loadPendingLaunchInventory: LoadPendingLaunchInventoryUseCase
  readonly loadPendingLaunchStatus: LoadPendingLaunchStatusUseCase
}

export function createAppPresenter(deps: Deps): AppPresenter {
  const session = new AppSession(deps)
  return {
    subscribe: (listener) => session.subscribe(listener),
    getState: () => session.getState(),
    start: () => session.start(),
    dispose: () => session.dispose(),
    navigate: (route) => session.navigate(route),
    openWorkflowRun: (id) => session.openWorkflowRun(id),
    closeWorkflowRun: () => session.closeWorkflowRun(),
    setWorkflowRunTask: (task) => session.setWorkflowRunTask(task),
    setWorkflowRunGoal: (goal) => session.setWorkflowRunGoal(goal),
    setWorkflowRunGoalOpen: (open) => session.setWorkflowRunGoalOpen(open),
    selectWorkflowRunRepository: (id) => session.selectWorkflowRunRepository(id),
    selectWorkflowRunOverride: (id) => session.selectWorkflowRunOverride(id),
    openWorkflowExecution: (id) => session.openWorkflowExecution(id),
    openParallelGroup: (id) => session.openParallelGroup(id),
    setParallelGroupShowPrompt: (show) =>
      session.setParallelGroupShowPrompt(show),
    setParallelGroupOpenMenuLaneId: (laneId) =>
      session.setParallelGroupOpenMenuLaneId(laneId),
    setParallelGroupCancelAllConfirm: (open) =>
      session.setParallelGroupCancelAllConfirm(open),
    applyParallelGroupChrome: (chrome) =>
      session.applyParallelGroupChrome(chrome),
    openPendingLaunches: () => session.openPendingLaunches(),
    openPendingLaunch: (id) => session.openPendingLaunch(id),
    setPendingLaunchStopConfirm: (open) =>
      session.setPendingLaunchStopConfirm(open),
    seedPendingLaunchStopOutcome: (outcome) =>
      session.seedPendingLaunchStopOutcome(outcome),
    openWorkflowEditor: (id) => session.openWorkflowEditor(id),
    closeWorkflowEditor: () => session.closeWorkflowEditor(),
    selectWorkflowNode: (id) => session.selectWorkflowNode(id),
    selectWorkflowRunNode: (id) => session.selectWorkflowRunNode(id),
    setWorkflowRunViewMode: (mode) => session.setWorkflowRunViewMode(mode),
    openTask: (taskId) => session.openTask(taskId),
    setTaskChangesPaneOpen: (open) => session.setTaskChangesPaneOpen(open),
    selectTaskChangedEntry: (entry) => session.selectTaskChangedEntry(entry),
    selectTaskChangesTurn: (taskId) => session.selectTaskChangesTurn(taskId),
    setTaskRepositoryExpanded: (root, expanded) =>
      session.setTaskRepositoryExpanded(root, expanded),
    seedTaskCommandChrome: (id, c) => session.seedTaskCommandChrome(id, c),
    setTaskOverflowMenuOpen: (open) => session.setTaskOverflowMenuOpen(open),
    openTaskDialog: (dialog, opener) =>
      session.openTaskDialog(dialog, opener),
    closeTaskDialog: () => session.closeTaskDialog(),
    seedTaskOverflowChrome: (id, chrome) =>
      session.seedTaskOverflowChrome(id, chrome),
    seedTaskChangesChrome: (id, chrome) =>
      session.seedTaskChangesChrome(id, chrome),
    setTaskPaneTab: (tab) => session.setTaskPaneTab(tab),
    loadTaskEarlierEvents: () => session.loadTaskEarlierEvents(),
    selectStatisticsRange: (range) => session.selectStatisticsRange(range),
    selectSettingsSection: (section) => session.selectSettingsSection(section),
    setExpandedHarness: (id) => session.setExpandedHarness(id),
    setAppearance: (appearance) => session.setAppearance(appearance),
    cycleAppearance: () => session.cycleAppearance(),
    setSidebarCollapsed: (collapsed) => session.setSidebarCollapsed(collapsed),
    setPrompt: (prompt) => session.setPrompt(prompt),
    setOpenMenu: (menu) => session.setOpenMenu(menu),
    setOptionsOpen: (open) => session.composer().setOptionsOpen(open),
    setEffort: (effort) => session.composer().setEffort(effort),
    setTurns: (turns) => session.composer().setTurns(turns),
    setApprovals: (approvals) => session.composer().setApprovals(approvals),
    selectRepository: (id) => session.selectRepository(id),
    selectHarness: (id) => session.selectHarness(id),
    selectModel: (id) => session.selectModel(id),
    selectAccess: (access) => session.selectAccess(access),
    submit: () => session.submit(),
  }
}
