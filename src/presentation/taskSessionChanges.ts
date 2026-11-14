import type { LoadTaskChangesUseCase } from '../application'
import type {
  ObservationHandle,
  TaskChangesLoad,
  TaskId,
} from '../model'
import type { TaskScreenState } from './taskState'

type Publish = (next: TaskScreenState) => void

/** Changes-pane observation helpers shared by TaskSession. */
export function beginTaskChangesObservation(args: {
  readonly state: TaskScreenState
  readonly loadTaskChanges: LoadTaskChangesUseCase
  readonly bumpEpoch: () => number
  readonly setHandle: (handle: ObservationHandle | null) => void
  readonly apply: (
    load: TaskChangesLoad,
    gen: number,
    expectedTask: TaskId,
    expectedQueryPath: string | null,
  ) => void
}): void {
  const taskId = args.state.selectedTaskId
  if (!taskId || !args.state.changesPaneOpen) return
  const gen = args.bumpEpoch()
  const queryPath = args.state.changesQueryPath
  args.setHandle(null)
  args.setHandle(
    args.loadTaskChanges.observe({ taskId, selectedPath: queryPath }, (load) =>
      args.apply(load, gen, taskId, queryPath),
    ),
  )
}

export function applyTaskChangesLoad(
  args: {
    readonly state: TaskScreenState
    readonly disposed: boolean
    readonly epoch: number
    readonly gen: number
    readonly expectedTask: TaskId
    readonly expectedQueryPath: string | null
    readonly load: TaskChangesLoad
    readonly publish: Publish
  },
): void {
  if (args.disposed || args.gen !== args.epoch) return
  if (!args.state.changesPaneOpen) return
  if (args.expectedTask !== args.state.selectedTaskId) return
  if (args.expectedQueryPath !== args.state.changesQueryPath) return
  if (args.load.kind === 'ready') {
    if (args.load.observation.taskId !== args.expectedTask) return
    if (
      args.expectedQueryPath !== null &&
      args.load.observation.selectedPath !== args.expectedQueryPath
    ) {
      return
    }
    args.publish({
      ...args.state,
      selectedChangePath: args.load.observation.selectedPath,
      changesFiles: args.load.observation.files,
      changesLoad: args.load,
    })
    return
  }
  args.publish({ ...args.state, changesLoad: args.load })
}
