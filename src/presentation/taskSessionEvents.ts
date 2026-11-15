import type { LoadTaskEventsUseCase } from '../application'
import type {
  ObservationHandle,
  TaskEventsLoad,
  TaskEventsOlderLoad,
  TaskId,
} from '../model'
import {
  IDLE_EVENTS_EARLIER,
  type TaskScreenState,
} from './taskState'
import { eventsLifecycleFor } from './taskEventsLifecycle'

type Publish = (next: TaskScreenState) => void

export type EventsPaneHost = {
  isDisposed(): boolean
  getState(): TaskScreenState
  readonly loadTaskEvents: LoadTaskEventsUseCase
  eventsEpoch(): number
  bumpEventsEpoch(): number
  setEventsObservation(handle: ObservationHandle | null): void
  setOlderObservation(handle: ObservationHandle | null): void
  publish(next: TaskScreenState): void
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

/**
 * The Events observation is read only when the task has started and its
 * status was read: pending and unread tasks draw their lifecycle body without
 * a read. A task still loading does not gate (the pane cannot be open yet).
 */
export function eventsReadAllowed(state: TaskScreenState): boolean {
  if (state.load.kind !== 'ready') return true
  const life = eventsLifecycleFor(state.load.observation, { kind: 'loading' })
  return life !== 'notStarted' && life !== 'unavailable'
}

/** Where the next older read continues: the newest page, or the last older page. */
export function olderPosition(state: TaskScreenState): {
  readonly hasOlder: boolean
  readonly cursor: string | null
} {
  if (state.eventsEarlier.status === 'loaded') {
    return {
      hasOlder: state.eventsEarlier.hasOlder,
      cursor: state.eventsEarlier.olderCursor,
    }
  }
  const list = state.eventsList
  return { hasOlder: list?.hasOlder ?? false, cursor: list?.olderCursor ?? null }
}

/** Marks a Load earlier read as started; null when it cannot start. */
export function startedEarlierState(
  state: TaskScreenState,
): TaskScreenState | null {
  if (!state.changesPaneOpen || state.paneTab !== 'events') return null
  if (state.eventsLoad.kind !== 'ready') return null
  if (state.eventsEarlier.status === 'loading') return null
  if (state.eventsEarlier.status === 'error') return null
  const position = olderPosition(state)
  if (!position.hasOlder || position.cursor === null) return null
  return { ...state, eventsEarlier: { ...state.eventsEarlier, status: 'loading' } }
}

export function applyOlderEventsLoad(args: {
  readonly state: TaskScreenState
  readonly disposed: boolean
  readonly epoch: number
  readonly gen: number
  readonly expectedTask: TaskId
  readonly expectedCursor: string
  readonly load: TaskEventsOlderLoad
  readonly publish: Publish
}): void {
  const { state, load } = args
  if (args.disposed || args.gen !== args.epoch) return
  if (!state.changesPaneOpen || state.paneTab !== 'events') return
  if (args.expectedTask !== state.selectedTaskId) return
  if (state.eventsEarlier.status !== 'loading') return
  if (olderPosition(state).cursor !== args.expectedCursor) return
  if (load.kind !== 'ready') {
    args.publish({
      ...state,
      eventsEarlier: { ...state.eventsEarlier, status: 'error' },
    })
    return
  }
  if (load.page.taskId !== args.expectedTask) return
  args.publish({
    ...state,
    eventsEarlier: {
      status: 'loaded',
      records: [...load.page.records, ...state.eventsEarlier.records],
      hasOlder: load.page.hasOlder,
      olderCursor: load.page.olderCursor,
    },
  })
}

export function beginPaneOlderObservation(host: EventsPaneHost): void {
  const state = host.getState()
  const taskId = state.selectedTaskId
  const cursor = olderPosition(state).cursor
  if (!taskId || cursor === null) return
  const gen = host.eventsEpoch()
  host.setOlderObservation(null)
  host.setOlderObservation(
    host.loadTaskEvents.observeOlder({ taskId, before: cursor }, (load) =>
      applyOlderEventsLoad({
        state: host.getState(),
        disposed: host.isDisposed(),
        epoch: host.eventsEpoch(),
        gen,
        expectedTask: taskId,
        expectedCursor: cursor,
        load,
        publish: (next) => host.publish(next),
      }),
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
  const { state, load } = args
  if (args.disposed || args.gen !== args.epoch) return
  if (!state.changesPaneOpen || state.paneTab !== 'events') return
  if (args.expectedTask !== state.selectedTaskId) return
  if (load.kind !== 'ready') {
    args.publish({ ...state, eventsLoad: load })
    return
  }
  if (load.observation.taskId !== args.expectedTask) return
  // A newest page that moved on invalidates older pages read from the last one.
  const moved =
    state.eventsList !== null &&
    state.eventsList.olderCursor !== load.observation.olderCursor
  args.publish({
    ...state,
    eventsList: load.observation,
    eventsLoad: load,
    eventsEarlier: moved ? IDLE_EVENTS_EARLIER : state.eventsEarlier,
  })
}

export function beginPaneEventsObservation(host: EventsPaneHost): void {
  const state = host.getState()
  const taskId = state.selectedTaskId
  if (!taskId || !state.changesPaneOpen || state.paneTab !== 'events') return
  host.setEventsObservation(null)
  host.setOlderObservation(null)
  if (!eventsReadAllowed(state)) return
  const gen = host.bumpEventsEpoch()
  if (state.eventsEarlier.status !== 'idle') {
    host.publish({ ...state, eventsEarlier: IDLE_EVENTS_EARLIER })
  }
  host.setEventsObservation(
    host.loadTaskEvents.observe({ taskId }, (load) =>
      applyTaskEventsLoad({
        state: host.getState(),
        disposed: host.isDisposed(),
        epoch: host.eventsEpoch(),
        gen,
        expectedTask: taskId,
        load,
        publish: (next) => host.publish(next),
      }),
    ),
  )
}
