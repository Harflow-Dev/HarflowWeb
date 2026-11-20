import * as needsYouNav from './appSessionNeedsYou'
import type { AppPresenter } from './appPresenter'
import type { AppSession } from './appSession'

function bindNavigation(session: AppSession): Pick<
  AppPresenter,
  | 'navigate'
  | 'openWorkflowRun'
  | 'closeWorkflowRun'
  | 'openWorkflowExecution'
  | 'openParallelGroup'
  | 'openPendingLaunches'
  | 'openPendingLaunch'
  | 'openWorkflowEditor'
  | 'closeWorkflowEditor'
  | 'openTask'
> {
  return {
    navigate: (route) => session.navigate(route),
    openWorkflowRun: (id) => session.openWorkflowRun(id),
    closeWorkflowRun: () => session.closeWorkflowRun(),
    openWorkflowExecution: (id) => session.openWorkflowExecution(id),
    openParallelGroup: (id) => session.openParallelGroup(id),
    openPendingLaunches: () => session.openPendingLaunches(),
    openPendingLaunch: (id) => session.openPendingLaunch(id),
    openWorkflowEditor: (id) => session.openWorkflowEditor(id),
    closeWorkflowEditor: () => session.closeWorkflowEditor(),
    openTask: (taskId) => session.openTask(taskId),
  }
}

function bindTaskChrome(session: AppSession): Pick<
  AppPresenter,
  | 'setTaskChangesPaneOpen'
  | 'selectTaskChangedEntry'
  | 'selectTaskChangesTurn'
  | 'setTaskRepositoryExpanded'
  | 'seedTaskCommandChrome'
  | 'setTaskOverflowMenuOpen'
  | 'openTaskDialog'
  | 'closeTaskDialog'
  | 'seedTaskOverflowChrome'
  | 'seedTaskChangesChrome'
  | 'setTaskPaneTab'
  | 'revealTaskEventsFacts'
  | 'loadTaskEarlierEvents'
  | 'seedTaskMessagingChrome'
  | 'cancelTaskQueuedMessage'
  | 'seedTaskApprovalChrome'
  | 'respondTaskApproval'
  | 'refreshTaskApproval'
> {
  return {
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
    revealTaskEventsFacts: (group) => session.revealTaskEventsFacts(group),
    loadTaskEarlierEvents: () => session.loadTaskEarlierEvents(),
    seedTaskMessagingChrome: (id, seed) =>
      session.seedTaskMessagingChrome(id, seed),
    cancelTaskQueuedMessage: (messageId) =>
      session.cancelTaskQueuedMessage(messageId),
    seedTaskApprovalChrome: (id, seed) =>
      session.seedTaskApprovalChrome(id, seed),
    respondTaskApproval: (decision) => session.respondTaskApproval(decision),
    refreshTaskApproval: () => session.refreshTaskApproval(),
  }
}

function bindNeedsYou(session: AppSession): Pick<
  AppPresenter,
  | 'seedNeedsYouApprovalChrome'
  | 'respondNeedsYouTaskApproval'
  | 'refreshNeedsYouTaskApproval'
  | 'answerNeedsYouCheckpoint'
  | 'refreshNeedsYouCheckpoint'
> {
  const ctx = () => session.presenterNav()
  return {
    seedNeedsYouApprovalChrome: (seed) =>
      needsYouNav.seedNeedsYouApprovalChrome(ctx(), seed),
    respondNeedsYouTaskApproval: (itemId, decision) =>
      needsYouNav.respondNeedsYouTaskApproval(ctx(), itemId, decision),
    refreshNeedsYouTaskApproval: (itemId) =>
      needsYouNav.refreshNeedsYouTaskApproval(ctx(), itemId),
    answerNeedsYouCheckpoint: (itemId, decision) =>
      needsYouNav.answerNeedsYouCheckpoint(ctx(), itemId, decision),
    refreshNeedsYouCheckpoint: (itemId) =>
      needsYouNav.refreshNeedsYouCheckpoint(ctx(), itemId),
  }
}

function bindComposer(session: AppSession): Pick<
  AppPresenter,
  | 'setPrompt'
  | 'setOpenMenu'
  | 'setOptionsOpen'
  | 'setEffort'
  | 'setTurns'
  | 'setApprovals'
  | 'selectRepository'
  | 'selectHarness'
  | 'selectModel'
  | 'selectAccess'
  | 'submit'
  | 'setAppearance'
  | 'cycleAppearance'
  | 'setSidebarCollapsed'
  | 'selectStatisticsRange'
  | 'selectSettingsSection'
  | 'setExpandedHarness'
> {
  return {
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
    setAppearance: (appearance) => session.setAppearance(appearance),
    cycleAppearance: () => session.cycleAppearance(),
    setSidebarCollapsed: (collapsed) => session.setSidebarCollapsed(collapsed),
    selectStatisticsRange: (range) => session.selectStatisticsRange(range),
    selectSettingsSection: (section) => session.selectSettingsSection(section),
    setExpandedHarness: (id) => session.setExpandedHarness(id),
  }
}

function bindWorkflowSurfaces(session: AppSession): Pick<
  AppPresenter,
  | 'setWorkflowRunTask'
  | 'setWorkflowRunGoal'
  | 'setWorkflowRunGoalOpen'
  | 'selectWorkflowRunRepository'
  | 'selectWorkflowRunOverride'
  | 'setParallelGroupShowPrompt'
  | 'setParallelGroupOpenMenuLaneId'
  | 'setParallelGroupCancelAllConfirm'
  | 'applyParallelGroupChrome'
  | 'setPendingLaunchStopConfirm'
  | 'seedPendingLaunchStopOutcome'
  | 'selectWorkflowNode'
  | 'selectWorkflowRunNode'
  | 'setWorkflowRunViewMode'
> {
  return {
    setWorkflowRunTask: (task) => session.setWorkflowRunTask(task),
    setWorkflowRunGoal: (goal) => session.setWorkflowRunGoal(goal),
    setWorkflowRunGoalOpen: (open) => session.setWorkflowRunGoalOpen(open),
    selectWorkflowRunRepository: (id) => session.selectWorkflowRunRepository(id),
    selectWorkflowRunOverride: (id) => session.selectWorkflowRunOverride(id),
    setParallelGroupShowPrompt: (show) =>
      session.setParallelGroupShowPrompt(show),
    setParallelGroupOpenMenuLaneId: (laneId) =>
      session.setParallelGroupOpenMenuLaneId(laneId),
    setParallelGroupCancelAllConfirm: (open) =>
      session.setParallelGroupCancelAllConfirm(open),
    applyParallelGroupChrome: (chrome) =>
      session.applyParallelGroupChrome(chrome),
    setPendingLaunchStopConfirm: (open) =>
      session.setPendingLaunchStopConfirm(open),
    seedPendingLaunchStopOutcome: (outcome) =>
      session.seedPendingLaunchStopOutcome(outcome),
    selectWorkflowNode: (id) => session.selectWorkflowNode(id),
    selectWorkflowRunNode: (id) => session.selectWorkflowRunNode(id),
    setWorkflowRunViewMode: (mode) => session.setWorkflowRunViewMode(mode),
  }
}

/** Bind AppSession methods onto the AppPresenter surface. */
export function bindAppPresenter(session: AppSession): AppPresenter {
  return {
    subscribe: (listener) => session.subscribe(listener),
    getState: () => session.getState(),
    start: () => session.start(),
    dispose: () => session.dispose(),
    ...bindNavigation(session),
    ...bindWorkflowSurfaces(session),
    ...bindTaskChrome(session),
    ...bindNeedsYou(session),
    ...bindComposer(session),
  }
}
