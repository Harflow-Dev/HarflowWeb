import { isSubmittablePrompt } from '../model'
import { selectionsAreSubmittable } from './reconcileSelections'
import type { NewTaskScreenState } from './screenState'
import { taskOptionsProblem } from './taskOptions'

/** Merges a partial into new-task state and recomputes canSubmit. */
export function withNewTaskCanSubmit(
  state: NewTaskScreenState,
  partial: Partial<NewTaskScreenState>,
): NewTaskScreenState {
  const merged = { ...state, ...partial }
  const blocked =
    merged.submission.kind === 'pending' || merged.submission.kind === 'unknown'
  const context = merged.context
  const qualified =
    context.kind === 'ready' && context.composer.qualification === 'ready'
  const validSelections =
    context.kind === 'ready' &&
    selectionsAreSubmittable(context.composer, {
      selectedRepositoryId: merged.selectedRepositoryId,
      selectedHarnessId: merged.selectedHarnessId,
      selectedModelId: merged.selectedModelId,
      selectedAccess: merged.selectedAccess,
    })
  const optionsOk =
    taskOptionsProblem({
      effort: merged.effort,
      turns: merged.turns,
      approvals: merged.approvals,
      harnessId: merged.selectedHarnessId,
      access: merged.selectedAccess,
    }) === ''
  return {
    ...merged,
    canSubmit:
      !blocked &&
      isSubmittablePrompt(merged.prompt) &&
      context.kind === 'ready' &&
      qualified &&
      validSelections &&
      optionsOk,
  }
}
