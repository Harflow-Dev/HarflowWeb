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

/**
 * Tab chosen when the pane opens. A decided tab (explicit choice, or an
 * earlier open with the status known) wins; otherwise the first open lands
 * on Events while the run is live. During load the tab stays provisional and
 * is resolved by `afterTaskLoad` once the status is known.
 */
export function paneTabForOpen(state: TaskScreenState): 'changes' | 'events' {
  if (state.paneOpenedOnce) return state.paneTab
  if (state.load.kind !== 'ready') return state.paneTab
  return firstOpenPaneTab(state.load.observation)
}

/** Open the pane on its tab; the tab is final once the status is known. */
export function openedPaneState(state: TaskScreenState): ReturnType<
  typeof openedChangesPaneState
> {
  const decided = state.paneOpenedOnce || state.load.kind !== 'loading'
  return openedChangesPaneState(state, paneTabForOpen(state), decided)
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

/**
 * Apply a load callback. A pane opened during load resolves its provisional
 * tab against the status; the default pane opens for a settling task.
 */
export function afterTaskLoad(
  state: TaskScreenState,
  load: TaskLoad,
): { readonly next: TaskScreenState; readonly openPane: boolean } {
  const wasLoading = state.load.kind === 'loading'
  let next = reconcileOverflowChrome({ ...state, load })
  if (load.kind === 'ready' && next.changesPaneOpen && !next.paneOpenedOnce) {
    next = {
      ...next,
      paneTab: firstOpenPaneTab(load.observation),
      paneOpenedOnce: true,
    }
  }
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
  /** Events must be (re)started: the tab changed. */
  readonly beginEventsOnly: boolean
} {
  const revealed = {
    eventsFactsReveal: group,
    eventsFactsRevealSeq: state.eventsFactsRevealSeq + 1,
  }
  if (!state.changesPaneOpen) {
    const opened = openedChangesPaneState({ ...state, ...revealed }, 'events', true)
    return { ...opened, beginEventsOnly: false }
  }
  const nextTab = paneTabState(state, 'events')
  return {
    next: { ...(nextTab ?? state), ...revealed },
    observeChanges: false,
    observeEvents: false,
    beginEventsOnly: nextTab !== null,
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
