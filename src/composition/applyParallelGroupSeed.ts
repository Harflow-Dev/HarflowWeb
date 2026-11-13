import type { NewTaskScenarioSeed } from '../adapters/mock'
import { asParallelGroupId } from '../model'
import type { AppPresenter, AppScreenState } from '../presentation'

type LoadProbe = {
  readonly open: boolean
  readonly kind: 'loading' | 'unavailable' | 'ready'
}

/**
 * Opens a Parallel group and applies preview chrome after the observation is ready.
 */
export function applyParallelGroupSeed(
  presenter: AppPresenter,
  seed: NewTaskScenarioSeed,
  whenLoaded: (
    presenter: AppPresenter,
    probe: (state: AppScreenState) => LoadProbe,
    apply: () => void,
  ) => void,
): void {
  if (seed.openParallelGroupId === undefined) return
  const groupId = asParallelGroupId(seed.openParallelGroupId)
  presenter.openParallelGroup(groupId)
  const wantsChrome =
    seed.parallelGroupShowPrompt === true ||
    seed.parallelGroupOpenMenuLaneId !== undefined ||
    seed.parallelGroupCancelAllConfirm === true
  if (!wantsChrome) return
  whenLoaded(
    presenter,
    (state) => ({
      open: state.parallelGroup.groupId === groupId,
      kind: state.parallelGroup.load.kind,
    }),
    () => {
      const chrome: {
        showPrompt?: boolean
        openMenuLaneId?: string | null
        cancelAllConfirm?: boolean
      } = {}
      if (seed.parallelGroupShowPrompt !== undefined) {
        chrome.showPrompt = seed.parallelGroupShowPrompt
      }
      if (seed.parallelGroupOpenMenuLaneId !== undefined) {
        chrome.openMenuLaneId = seed.parallelGroupOpenMenuLaneId
      }
      if (seed.parallelGroupCancelAllConfirm !== undefined) {
        chrome.cancelAllConfirm = seed.parallelGroupCancelAllConfirm
      }
      presenter.applyParallelGroupChrome(chrome)
    },
  )
}
