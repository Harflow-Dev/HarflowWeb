import type { NewTaskScenarioSeed } from '../adapters/mock'
import {
  asParallelGroupId,
  asTaskId,
  asWorkflowId,
  asWorkflowNodeId,
  asWorkflowRunId,
} from '../model'
import type {
  AppPresenter,
  ApprovalsMode,
  EffortLevel,
  OpenMenu,
} from '../presentation'

/**
 * Applies preview-only presentation chrome after context is ready.
 * Qualification and start outcomes stay on the observation / start contract.
 */
export function applyNewTaskSeed(
  presenter: AppPresenter,
  seed: NewTaskScenarioSeed | undefined,
): void {
  if (seed === undefined) return
  if (seed.sidebarCollapsed === true) presenter.setSidebarCollapsed(true)
  if (seed.prompt !== undefined) presenter.setPrompt(seed.prompt)
  if (seed.effort !== undefined) {
    presenter.setEffort(seed.effort as EffortLevel)
  }
  if (seed.turns !== undefined) presenter.setTurns(seed.turns)
  if (seed.approvals !== undefined) {
    presenter.setApprovals(seed.approvals as ApprovalsMode)
  }
  if (seed.optionsOpen === true) presenter.setOptionsOpen(true)
  if (seed.openMenu !== undefined) {
    presenter.setOpenMenu(seed.openMenu as OpenMenu)
  }
  if (seed.autoSubmit === true) presenter.submit()
  if (seed.openRoute !== undefined) presenter.navigate(seed.openRoute)
  if (seed.settingsSection !== undefined) {
    presenter.selectSettingsSection(seed.settingsSection)
  }
  if (seed.settingsExpandedHarnessId !== undefined) {
    presenter.setExpandedHarness(seed.settingsExpandedHarnessId)
  }
  if (seed.openTaskId !== undefined) {
    presenter.openTask(asTaskId(seed.openTaskId))
    if (seed.eventsPaneOpen === true) {
      // Wait until the task observation is ready before opening Events.
      const unsub = presenter.subscribe((state) => {
        if (state.task.load.kind !== 'ready') return
        unsub()
        presenter.setTaskChangesPaneOpen(true)
      })
    }
  }
  if (seed.openWorkflowEditorId !== undefined) {
    presenter.openWorkflowEditor(asWorkflowId(seed.openWorkflowEditorId))
    if (seed.openWorkflowEditorNodeId !== undefined) {
      const nodeId = asWorkflowNodeId(seed.openWorkflowEditorNodeId)
      const unsub = presenter.subscribe((state) => {
        if (state.workflowEditor.load.kind !== 'ready') return
        unsub()
        presenter.selectWorkflowNode(nodeId)
      })
    }
  }
  if (seed.openWorkflowExecutionId !== undefined) {
    presenter.openWorkflowExecution(
      asWorkflowRunId(seed.openWorkflowExecutionId),
    )
    if (seed.workflowRunView === 'parallel') {
      presenter.setWorkflowRunViewMode('parallel')
    }
  }
  if (seed.openParallelGroupId !== undefined) {
    presenter.openParallelGroup(asParallelGroupId(seed.openParallelGroupId))
  }
}
