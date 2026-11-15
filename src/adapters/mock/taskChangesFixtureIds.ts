import { asTaskId } from '../../model'

export const TASK_CHANGES_SINGLE_ID = asTaskId('task-changes-single')
export const TASK_CHANGES_MULTI_ID = asTaskId('task-changes-multi')
export const TASK_CHANGES_MULTI_LIMITED_ID = asTaskId(
  'task-changes-multi-limited',
)
export const TASK_CHANGES_SAME_PATH_ID = asTaskId('task-changes-same-path')
export const TASK_CHANGES_ROW_STATES_ID = asTaskId('task-changes-row-states')
export const TASK_CHANGES_INCOMPLETE_ID = asTaskId('task-changes-incomplete')
export const TASK_CHANGES_NOT_CAPTURED_ID = asTaskId(
  'task-changes-not-captured',
)
export const TASK_CHANGES_UNMERGED_ID = asTaskId('task-changes-unmerged')
export const TASK_CHANGES_RUNNING_ID = asTaskId('task-changes-running')
export const TASK_CHANGES_ZERO_ID = asTaskId('task-changes-zero')
export const TASK_CHANGES_NO_REPOSITORY_ID = asTaskId(
  'task-changes-no-repository',
)
export const TASK_CHANGES_TEXT_ID = asTaskId('task-changes-text')
export const TASK_CHANGES_LOADING_ID = asTaskId('task-changes-loading')
export const TASK_CHANGES_ERROR_ID = asTaskId('task-changes-error')
// Turn members are real tasks, so their ids look like engine task ids; the
// current turn's id begins 7be02d91 as the design draws it.
export const TASK_CHANGES_TURNS_ID = asTaskId(
  '7be02d91-5a3c-4e8f-b1d6-0c42a9e73f58',
)
export const TASK_CHANGES_TURN_2_ID = asTaskId(
  'c3a8f5e0-91b4-4d27-8e6a-5f10b7d92c34',
)
export const TASK_CHANGES_TURN_1_ID = asTaskId(
  '2d9e6b14-07f8-4a53-9c1e-b84a3d60e5f7',
)
