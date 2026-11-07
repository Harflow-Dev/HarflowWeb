import { isSubmittablePrompt } from '../model'
import type { NewTaskScreenState } from './screenState'
import {
  taskOptionsCustomized,
  taskOptionsProblem,
} from './taskOptions'

export function newTaskOptionsAreCustomized(state: NewTaskScreenState): boolean {
  return taskOptionsCustomized(state.effort, state.turns, state.approvals)
}

/**
 * Composer status copy. Validation and an empty draft outrank a prior
 * accepted/refused outcome so a new draft does not keep the old message.
 */
export function newTaskStatusMessage(state: NewTaskScreenState): string {
  if (state.submission.kind === 'pending') return 'Starting task…'
  if (state.submission.kind === 'unknown') {
    return 'The outcome is unknown. Review Recent work before starting again.'
  }
  const options = taskOptionsProblem({
    effort: state.effort,
    turns: state.turns,
    approvals: state.approvals,
    harnessId: state.selectedHarnessId,
    access: state.selectedAccess,
  })
  if (options) return options
  if (!isSubmittablePrompt(state.prompt)) {
    if (state.submission.kind === 'accepted') return 'Task created.'
    return 'Describe a task to continue.'
  }
  if (state.submission.kind === 'refused') {
    return 'Start was refused. Review the settings and try again.'
  }
  const model =
    state.context.kind === 'ready'
      ? state.context.composer.harnesses
          .find((h) => h.id === state.selectedHarnessId)
          ?.models.find((m) => m.id === state.selectedModelId)?.label
      : null
  return model ? `Ready to start · ${model}` : 'Ready to start'
}
