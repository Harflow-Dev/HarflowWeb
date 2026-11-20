import type {
  LoadContextUseCase,
  LoadHarnessesUseCase,
  LoadNeedsYouUseCase,
  LoadParallelGroupUseCase,
  LoadMessagingCapabilityUseCase,
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
  RefreshTaskApprovalUseCase,
  RespondTaskApprovalUseCase,
  StartTaskUseCase,
} from '../application'
import type {
  AccessLevel,
  Appearance,
  ApprovalDecision,
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
import { bindAppPresenter } from './appPresenterBindings'
import type { AppRoute, AppScreenState, SettingsSection } from './appState'
import type { ParallelGroupQueuedOutcome } from './parallelGroupState'
import type { TaskApprovalSeed } from './taskSessionApproval'
import type { TaskMessagingSeed } from './taskSessionMessaging'
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
  revealTaskEventsFacts(group: 'enforcement' | 'notices' | 'continuity'): void
  loadTaskEarlierEvents(): void
  /** Cancel a queued task message in the mock; returns false when refused. */
  cancelTaskQueuedMessage(messageId: string): boolean
  seedTaskMessagingChrome(taskId: TaskId, seed: TaskMessagingSeed): void
  seedTaskApprovalChrome(taskId: TaskId, seed: TaskApprovalSeed): void
  respondTaskApproval(decision: ApprovalDecision): void
  refreshTaskApproval(): void
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
  readonly respondTaskApproval: RespondTaskApprovalUseCase
  readonly refreshTaskApproval: RefreshTaskApprovalUseCase
  readonly loadHarnesses: LoadHarnessesUseCase
  readonly loadSettingsGeneral: LoadSettingsGeneralUseCase
  readonly loadNeedsYou: LoadNeedsYouUseCase
  readonly loadWorkflowRun: LoadWorkflowRunUseCase
  readonly loadWorkflowEditor: LoadWorkflowEditorUseCase
  readonly loadWorkflowExecution: LoadWorkflowExecutionUseCase
  readonly loadParallelGroup: LoadParallelGroupUseCase
  readonly loadMessagingCapability: LoadMessagingCapabilityUseCase
  readonly loadPendingLaunchCapability: LoadPendingLaunchCapabilityUseCase
  readonly loadPendingLaunchInventory: LoadPendingLaunchInventoryUseCase
  readonly loadPendingLaunchStatus: LoadPendingLaunchStatusUseCase
}

export function createAppPresenter(deps: Deps): AppPresenter {
  return bindAppPresenter(new AppSession(deps))
}
