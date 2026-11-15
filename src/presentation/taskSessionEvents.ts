import type { LoadTaskEventsUseCase } from '../application'
import type {
  ObservationHandle,
  TaskEventsLoad,
  TaskId,
} from '../model'
import type { TaskEventsChrome, TaskScreenState } from './taskState'

type Publish = (next: TaskScreenState) => void

export type EventsPaneHost = {
  isDisposed(): boolean
  getState(): TaskScreenState
  readonly loadTaskEvents: LoadTaskEventsUseCase
  eventsEpoch(): number
  bumpEventsEpoch(): number
  setEventsObservation(handle: ObservationHandle | null): void
  publish(next: TaskScreenState): void
}

export function seededEventsChromeState(
  state: TaskScreenState,
  taskId: TaskId,
  chrome: TaskEventsChrome,
): TaskScreenState | null {
  if (state.selectedTaskId !== taskId) return null
  if (!state.changesPaneOpen) return null
  return {
    ...state,
    paneTab: chrome.paneTab ?? state.paneTab,
    eventsEarlierLoaded:
      chrome.earlierLoaded !== undefined
        ? chrome.earlierLoaded
        : state.eventsEarlierLoaded,
    eventsEarlierError:
      chrome.earlierError !== undefined
        ? chrome.earlierError
        : state.eventsEarlierError,
  }
}

export function paneTabState(
  state: TaskScreenState,
  tab: 'changes' | 'events',
): TaskScreenState | null {
  if (tab === state.paneTab) return null
  return {
    ...state,
    paneTab: tab,
    eventsLoad:
      tab === 'events' && state.eventsList === null
        ? { kind: 'loading' }
        : state.eventsLoad,
    changesLoad:
      tab === 'changes' && state.changesList === null
        ? { kind: 'loading' }
        : state.changesLoad,
  }
}

export function appliedEarlierEventsState(
  state: TaskScreenState,
): TaskScreenState | null {
  if (!state.changesPaneOpen || state.paneTab !== 'events') return null
  if (state.eventsLoad.kind !== 'ready') return null
  const observation = state.eventsLoad.observation
  if (!observation.hasEarlier) return null
  if (observation.earlierPage.length === 0) {
    return { ...state, eventsEarlierError: true, eventsEarlierLoaded: false }
  }
  return { ...state, eventsEarlierLoaded: true, eventsEarlierError: false }
}

export function beginTaskEventsObservation(args: {
  readonly state: TaskScreenState
  readonly loadTaskEvents: LoadTaskEventsUseCase
  readonly bumpEpoch: () => number
  readonly setHandle: (handle: ObservationHandle | null) => void
  readonly apply: (
    load: TaskEventsLoad,
    gen: number,
    expectedTask: TaskId,
  ) => void
}): void {
  const taskId = args.state.selectedTaskId
  if (!taskId || !args.state.changesPaneOpen) return
  if (args.state.paneTab !== 'events') return
  const gen = args.bumpEpoch()
  args.setHandle(null)
  args.setHandle(
    args.loadTaskEvents.observe({ taskId }, (load) =>
      args.apply(load, gen, taskId),
    ),
  )
}

export function applyTaskEventsLoad(args: {
  readonly state: TaskScreenState
  readonly disposed: boolean
  readonly epoch: number
  readonly gen: number
  readonly expectedTask: TaskId
  readonly load: TaskEventsLoad
  readonly publish: Publish
}): void {
  if (args.disposed || args.gen !== args.epoch) return
  if (!args.state.changesPaneOpen) return
  if (args.state.paneTab !== 'events') return
  if (args.expectedTask !== args.state.selectedTaskId) return
  if (args.load.kind === 'ready') {
    if (args.load.observation.taskId !== args.expectedTask) return
    args.publish({
      ...args.state,
      eventsList: args.load.observation,
      eventsLoad: args.load,
    })
    return
  }
  args.publish({ ...args.state, eventsLoad: args.load })
}

export function beginPaneEventsObservation(host: EventsPaneHost): void {
  const state = host.getState()
  if (!state.selectedTaskId || !state.changesPaneOpen) return
  if (state.paneTab !== 'events') return
  host.setEventsObservation(null)
  beginTaskEventsObservation({
    state,
    loadTaskEvents: host.loadTaskEvents,
    bumpEpoch: () => host.bumpEventsEpoch(),
    setHandle: (handle) => host.setEventsObservation(handle),
    apply: (load, gen, expectedTask) =>
      applyTaskEventsLoad({
        state: host.getState(),
        disposed: host.isDisposed(),
        epoch: host.eventsEpoch(),
        gen,
        expectedTask,
        load,
        publish: (next) => host.publish(next),
      }),
  })
}
