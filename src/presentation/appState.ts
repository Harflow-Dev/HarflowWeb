import type { HarnessesScreenState } from './harnessesState'
import type { NeedsYouScreenState } from './needsYouState'
import type { NewTaskScreenState } from './screenState'
import type { ResourcesScreenState } from './resourcesState'
import type { StatisticsScreenState } from './statisticsState'
import type { TaskScreenState } from './taskState'
import type { ParallelGroupScreenState } from './parallelGroupState'
import type { WorkflowEditorScreenState } from './workflowEditorState'
import type { WorkflowExecutionScreenState } from './workflowExecutionState'
import type { WorkflowsScreenState } from './workflowsState'

export type SettingsSection = 'general' | 'harnesses'

/** In-slice destinations with approved screens. */
export type AppRoute =
  | 'new-task'
  | 'workflows'
  | 'resources'
  | 'statistics'
  | 'task'
  | 'needs-you'
  | 'settings'
  | 'parallel-group'

export type AppScreenState = {
  readonly route: AppRoute
  readonly newTask: NewTaskScreenState
  readonly workflows: WorkflowsScreenState
  readonly resources: ResourcesScreenState
  readonly statistics: StatisticsScreenState
  readonly task: TaskScreenState
  readonly settingsSection: SettingsSection
  readonly harnesses: HarnessesScreenState
  readonly needsYou: NeedsYouScreenState
  readonly workflowEditor: WorkflowEditorScreenState
  readonly workflowExecution: WorkflowExecutionScreenState
  readonly parallelGroup: ParallelGroupScreenState
}
