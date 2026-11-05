import type { NewTaskScreenState } from './screenState'
import type { ResourcesScreenState } from './resourcesState'
import type { WorkflowsScreenState } from './workflowsState'

/** In-slice destinations with approved screens. */
export type AppRoute = 'new-task' | 'workflows' | 'resources'

export type AppScreenState = {
  readonly route: AppRoute
  readonly newTask: NewTaskScreenState
  readonly workflows: WorkflowsScreenState
  readonly resources: ResourcesScreenState
}
