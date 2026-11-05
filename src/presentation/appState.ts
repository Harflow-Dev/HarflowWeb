import type { NewTaskScreenState } from './screenState'
import type { ResourcesScreenState } from './resourcesState'
import type { StatisticsScreenState } from './statisticsState'
import type { TaskScreenState } from './taskState'
import type { WorkflowsScreenState } from './workflowsState'

/** In-slice destinations with approved screens. */
export type AppRoute =
  | 'new-task'
  | 'workflows'
  | 'resources'
  | 'statistics'
  | 'task'

export type AppScreenState = {
  readonly route: AppRoute
  readonly newTask: NewTaskScreenState
  readonly workflows: WorkflowsScreenState
  readonly resources: ResourcesScreenState
  readonly statistics: StatisticsScreenState
  readonly task: TaskScreenState
}
