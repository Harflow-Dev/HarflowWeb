import type { NewTaskScenarioSeed } from '../adapters/mock'
import {
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
import { applyNeedsYouApprovalSeed } from './applyNeedsYouApprovalSeed'
import { applyParallelGroupSeed } from './applyParallelGroupSeed'
import { applyPendingLaunchSeed } from './applyPendingLaunchSeed'
import { applyTaskOpenSeed } from './applyTaskOpenSeed'

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
  applyTaskOpenSeed(presenter, seed, whenLoaded)
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
  applyParallelGroupSeed(presenter, seed, whenLoaded)
  applyPendingLaunchSeed(presenter, seed, whenLoaded)
  applyNeedsYouApprovalSeed(presenter, seed, whenLoaded)
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
