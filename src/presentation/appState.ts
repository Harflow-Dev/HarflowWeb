import type { NewTaskScreenState } from './screenState'
import type { WorkflowsScreenState } from './workflowsState'

/** In-slice destinations with approved screens. */
export type AppRoute = 'new-task' | 'workflows'

export type AppScreenState = {
  readonly route: AppRoute
  readonly newTask: NewTaskScreenState
  readonly workflows: WorkflowsScreenState
}
