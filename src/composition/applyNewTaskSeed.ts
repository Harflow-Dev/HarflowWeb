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
  AppScreenState,
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
      const taskId = asTaskId(seed.openTaskId)
      whenLoaded(
        presenter,
        (state) => ({
          open: state.task.selectedTaskId === taskId,
          kind: state.task.load.kind,
        }),
        () => presenter.setTaskChangesPaneOpen(true),
      )
    }
  }
  if (seed.openWorkflowEditorId !== undefined) {
    presenter.openWorkflowEditor(asWorkflowId(seed.openWorkflowEditorId))
    if (seed.openWorkflowEditorNodeId !== undefined) {
      const nodeId = asWorkflowNodeId(seed.openWorkflowEditorNodeId)
      const workflowId = asWorkflowId(seed.openWorkflowEditorId)
      whenLoaded(
        presenter,
        (state) => ({
          open: state.workflowEditor.workflowId === workflowId,
          kind: state.workflowEditor.load.kind,
        }),
        () => presenter.selectWorkflowNode(nodeId),
      )
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

type LoadProbe = {
  /** Whether the screen is still showing the seeded item. */
  readonly open: boolean
  readonly kind: 'loading' | 'unavailable' | 'ready'
}

/**
 * Runs `apply` once the seeded item finishes loading, only if it is still the
 * open item. Stops listening on ready, unavailable, or when another item is
 * opened. Checks the current state first because subscribers may run
 * synchronously and the load may already be settled.
 */
function whenLoaded(
  presenter: AppPresenter,
  probe: (state: AppScreenState) => LoadProbe,
  apply: () => void,
): void {
  let unsub: (() => void) | undefined
  let finished = false
  const check = (state: AppScreenState): void => {
    if (finished) return
    const { open, kind } = probe(state)
    if (!open) {
      finished = true
    } else if (kind === 'loading') {
      return
    } else {
      finished = true
      if (kind === 'ready') apply()
    }
    unsub?.()
  }
  check(presenter.getState())
  if (finished) return
  unsub = presenter.subscribe(check)
  // The subscription replays the current state synchronously, which may have
  // already finished before `unsub` was assigned.
  if (finished) unsub()
}
