import type { NewTaskScenarioSeed } from '../adapters/mock'
import { asTaskId } from '../model'
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
}
