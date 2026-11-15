import type { TaskChangesEntryRef, TaskId, TaskLoad } from '../model'
import { defaultPaneOpen, firstOpenPaneTab } from './taskPaneDefaults'
import { reconcileOverflowChrome } from './taskOverflowChrome'
import {
  eventsReadAllowed,
  paneTabState,
  startedEarlierState,
} from './taskSessionEvents'
import type { EventsFactsRevealId } from './taskTopbarChips'
import type { TaskScreenState } from './taskState'
import {
  openedChangesPaneState,
  selectedEntryState,
  selectedTurnState,
  toggledExpandedRepos,
} from './taskSessionPane'

/** Tab chosen the first time the pane opens for this task. */
export function paneTabForOpen(state: TaskScreenState): 'changes' | 'events' {
  if (state.paneOpenedOnce) return state.paneTab
  // An explicit Events choice (seed / setPaneTab) wins over the default.
  if (state.paneTab === 'events') return 'events'
  if (state.load.kind !== 'ready') return state.paneTab
  return firstOpenPaneTab(state.load.observation)
}

/** Default open after the first ready status for this selection. */
export function shouldOpenDefaultPane(
  wasLoading: boolean,
  state: TaskScreenState,
  load: TaskLoad,
): boolean {
  return (
    wasLoading &&
    load.kind === 'ready' &&
    !state.changesPaneOpen &&
    defaultPaneOpen(load.observation)
  )
}

/** Apply a load callback and decide whether the default pane should open. */
export function afterTaskLoad(
  state: TaskScreenState,
  load: TaskLoad,
): { readonly next: TaskScreenState; readonly openPane: boolean } {
  const wasLoading = state.load.kind === 'loading'
  const next = reconcileOverflowChrome({ ...state, load })
  return { next, openPane: shouldOpenDefaultPane(wasLoading, next, load) }
}

/** Whether Events observation should run for the current pane tab. */
export function eventsObservationDesired(state: TaskScreenState): boolean {
  return (
    state.changesPaneOpen &&
    state.paneTab === 'events' &&
    eventsReadAllowed(state)
  )
}

/** Chip path: open Events and expand a facts group. */
export function revealEventsFactsState(
  state: TaskScreenState,
  group: EventsFactsRevealId,
): {
  readonly next: TaskScreenState
  readonly observeChanges: boolean
  readonly observeEvents: boolean
  readonly beginEventsOnly: boolean
} {
  if (!state.changesPaneOpen) {
    const opened = openedChangesPaneState(
      { ...state, eventsFactsReveal: group },
      'events',
    )
    return { ...opened, beginEventsOnly: false }
  }
  const nextTab = paneTabState(state, 'events')
  return {
    next: { ...(nextTab ?? state), eventsFactsReveal: group },
    observeChanges: false,
    observeEvents: false,
    beginEventsOnly: true,
  }
}

export function nextPaneTabState(
  state: TaskScreenState,
  tab: 'changes' | 'events',
): TaskScreenState | null {
  return paneTabState(state, tab)
}

export function nextEarlierEventsState(
  state: TaskScreenState,
): TaskScreenState | null {
  return startedEarlierState(state)
}

export function nextSelectedEntryState(
  state: TaskScreenState,
  entry: TaskChangesEntryRef,
  hasObservation: boolean,
): TaskScreenState | null {
  return selectedEntryState(state, entry, hasObservation)
}

export function nextSelectedTurnState(
  state: TaskScreenState,
  turnTaskId: TaskId,
): TaskScreenState | null {
  return selectedTurnState(state, turnTaskId)
}

export function nextExpandedReposState(
  state: TaskScreenState,
  repositoryRoot: string,
  expanded: boolean,
): TaskScreenState | null {
  const expandedRepos = toggledExpandedRepos(
    state.expandedRepos,
    repositoryRoot,
    expanded,
  )
  return expandedRepos ? { ...state, expandedRepos } : null
}
