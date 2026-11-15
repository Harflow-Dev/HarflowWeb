import type { LoadTaskChangesUseCase } from '../application'
import type {
  ObservationHandle,
  TaskChangesEntryRef,
  TaskChangesLoad,
  TaskId,
} from '../model'
import type { TaskScreenState } from './taskState'

export { changesEntriesEqual } from './taskChangesFormat'

type Publish = (next: TaskScreenState) => void

function entryKey(entry: TaskChangesEntryRef | null): string {
  if (!entry) return ''
  return `${entry.repositoryRoot}\0${entry.scope}\0${entry.path}`
}

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
    expectedEntry: TaskChangesEntryRef | null,
    expectedTurn: TaskId | null,
  ) => void
}): void {
  const taskId = args.state.selectedTaskId
  if (!taskId || !args.state.changesPaneOpen) return
  const gen = args.bumpEpoch()
  const queryEntry = args.state.changesQueryEntry
  const turnTaskId = args.state.changesTurnTaskId
  args.setHandle(null)
  args.setHandle(
    args.loadTaskChanges.observe(
      { taskId, selectedEntry: queryEntry, turnTaskId },
      (load) =>
        args.apply(load, gen, taskId, queryEntry, turnTaskId),
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
    readonly expectedEntry: TaskChangesEntryRef | null
    readonly expectedTurn: TaskId | null
    readonly load: TaskChangesLoad
    readonly publish: Publish
  },
): void {
  if (args.disposed || args.gen !== args.epoch) return
  if (!args.state.changesPaneOpen) return
  if (args.expectedTask !== args.state.selectedTaskId) return
  if (entryKey(args.expectedEntry) !== entryKey(args.state.changesQueryEntry)) {
    return
  }
  if (args.expectedTurn !== args.state.changesTurnTaskId) return
  if (args.load.kind === 'ready') {
    if (args.load.observation.taskId !== (args.expectedTurn ?? args.expectedTask)) {
      // Turn reads return that turn's task id on the observation.
      if (args.load.observation.taskId !== args.expectedTask) {
        if (
          args.expectedTurn === null ||
          args.load.observation.taskId !== args.expectedTurn
        ) {
          return
        }
      }
    }
    if (
      args.expectedEntry !== null &&
      args.load.observation.selectedEntry !== null &&
      entryKey(args.load.observation.selectedEntry) !==
        entryKey(args.expectedEntry)
    ) {
      return
    }
    const expanded =
      args.state.expandedRepos.length > 0
        ? args.state.expandedRepos
        : defaultExpanded(args.load.observation.repositories.map((r) => r.repositoryRoot))
    args.publish({
      ...args.state,
      selectedChangeEntry: args.load.observation.selectedEntry,
      changesList: args.load.observation,
      changesLoad: args.load,
      expandedRepos: expanded,
    })
    return
  }
  args.publish({ ...args.state, changesLoad: args.load })
}

function defaultExpanded(roots: readonly string[]): readonly string[] {
  return roots.length <= 1 ? roots : roots.slice(0, 1)
}

// changesEntriesEqual re-exported from taskChangesFormat above.
