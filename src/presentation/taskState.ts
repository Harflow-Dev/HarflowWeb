import type { TaskId, TaskLoad } from '../model'

export type TaskScreenState = {
  readonly selectedTaskId: TaskId | null
  readonly load: TaskLoad
}

export function initialTaskState(): TaskScreenState {
  return {
    selectedTaskId: null,
    load: { kind: 'loading' },
  }
}
