import type { LoadTaskChangesUseCase } from '../application'
import type { ObservationHandle, TaskChangesEntryRef, TaskId } from '../model'
import {
  applyTaskChangesLoad,
  beginTaskChangesObservation,
  changesEntriesEqual,
} from './taskSessionChanges'
import {
  IDLE_EVENTS_EARLIER,
  type TaskChangesChrome,
  type TaskScreenState,
} from './taskState'

export type ChangesPaneHost = {
  isDisposed(): boolean
  getState(): TaskScreenState
  readonly loadTaskChanges: LoadTaskChangesUseCase
  changesEpoch(): number
  bumpChangesEpoch(): number
  setChangesObservation(handle: ObservationHandle | null): void
  publish(next: TaskScreenState): void
}

export function seededChangesChromeState(
  state: TaskScreenState,
  taskId: TaskId,
  chrome: TaskChangesChrome,
): TaskScreenState | null {
  if (state.selectedTaskId !== taskId) return null
  if (!state.changesPaneOpen) return null
  return {
    ...state,
    changesQueryEntry:
      chrome.selectedEntry !== undefined
        ? chrome.selectedEntry
        : state.changesQueryEntry,
    selectedChangeEntry:
      chrome.selectedEntry !== undefined
        ? chrome.selectedEntry
        : state.selectedChangeEntry,
    changesTurnTaskId:
      chrome.turnTaskId !== undefined
        ? chrome.turnTaskId
        : state.changesTurnTaskId,
    expandedRepos:
      chrome.expandedRepos !== undefined
        ? chrome.expandedRepos
        : state.expandedRepos,
    changesTurns: chrome.turns ?? state.changesTurns,
    changesTextPanels: chrome.textPanels ?? state.changesTextPanels,
    changesLoad: { kind: 'loading' },
  }
}

export function selectedEntryState(
  state: TaskScreenState,
  entry: TaskChangesEntryRef,
  hasObservation: boolean,
): TaskScreenState | null {
  if (!state.changesPaneOpen) return null
  if (
    state.changesLoad.kind === 'ready' &&
    changesEntriesEqual(state.changesLoad.observation.text?.entry ?? null, entry) &&
    hasObservation &&
    (changesEntriesEqual(state.changesQueryEntry, entry) ||
      state.changesQueryEntry === null)
  ) {
    return null
  }
  if (
    changesEntriesEqual(entry, state.changesQueryEntry) &&
    hasObservation &&
    state.changesLoad.kind !== 'loading'
  ) {
    return null
  }
  return {
    ...state,
    changesQueryEntry: entry,
    selectedChangeEntry: entry,
    changesLoad: { kind: 'loading' },
  }
}

export function selectedTurnState(
  state: TaskScreenState,
  turnTaskId: TaskId,
): TaskScreenState | null {
  if (!state.changesPaneOpen) return null
  if (turnTaskId === state.changesTurnTaskId) return null
  const opened = state.selectedTaskId
  const nextTurn = turnTaskId === opened ? null : turnTaskId
  return {
    ...state,
    changesTurnTaskId: nextTurn,
    changesQueryEntry: null,
    selectedChangeEntry: null,
    changesList: null,
    changesLoad: { kind: 'loading' },
    // Each turn is its own capture: expansion restarts from that turn's defaults.
    expandedRepos: [],
  }
}

export function closedChangesPaneState(state: TaskScreenState): TaskScreenState {
  return {
    ...state,
    changesPaneOpen: false,
    changesQueryEntry: null,
    selectedChangeEntry: null,
    changesList: null,
    changesLoad: { kind: 'loading' },
    changesTurnTaskId: null,
    expandedRepos: [],
    changesTurns: null,
    changesTextPanels: null,
    eventsList: null,
    eventsLoad: { kind: 'loading' },
    eventsEarlier: IDLE_EVENTS_EARLIER,
  }
}

export function openedChangesPaneState(state: TaskScreenState): {
  readonly next: TaskScreenState
  readonly observeChanges: boolean
  readonly observeEvents: boolean
} {
  const transcriptEvents =
    state.load.kind === 'ready' && state.load.observation.detailsPane === 'events'
  const eventsTab = state.paneTab === 'events'
  // Changes stays observed on every pane tab so the Changes count remains accurate
  // while Events is selected (design paneHtml uses CHANGES[…].count independently).
  return {
    observeChanges: !transcriptEvents,
    observeEvents: !transcriptEvents && eventsTab,
    next: {
      ...state,
      changesPaneOpen: true,
      changesQueryEntry: null,
      selectedChangeEntry: null,
      changesList: null,
      changesLoad: { kind: 'loading' },
      changesTurnTaskId: null,
      expandedRepos: [],
      changesTurns: null,
      changesTextPanels: null,
      eventsList: null,
      eventsLoad: { kind: 'loading' },
      eventsEarlier: IDLE_EVENTS_EARLIER,
    },
  }
}

export function loadingTaskScreenState(taskId: TaskId): TaskScreenState {
  return {
    selectedTaskId: taskId,
    load: { kind: 'loading' },
    commandChrome: null,
    overflowMenuOpen: false,
    overflowAnchorOmitted: false,
    dialog: null,
    dialogOpener: null,
    changesPaneOpen: false,
    changesQueryEntry: null,
    selectedChangeEntry: null,
    changesList: null,
    changesLoad: { kind: 'loading' },
    changesTurnTaskId: null,
    expandedRepos: [],
    changesTurns: null,
    changesTextPanels: null,
    paneTab: 'changes',
    eventsList: null,
    eventsLoad: { kind: 'loading' },
    eventsEarlier: IDLE_EVENTS_EARLIER,
  }
}

export function toggledExpandedRepos(
  expandedRepos: readonly string[],
  repositoryRoot: string,
  expanded: boolean,
): readonly string[] | null {
  const has = expandedRepos.includes(repositoryRoot)
  if (expanded === has) return null
  return expanded
    ? [...expandedRepos, repositoryRoot]
    : expandedRepos.filter((root) => root !== repositoryRoot)
}

export function beginPaneChangesObservation(host: ChangesPaneHost): void {
  const state = host.getState()
  if (!state.selectedTaskId || !state.changesPaneOpen) return
  host.setChangesObservation(null)
  beginTaskChangesObservation({
    state,
    loadTaskChanges: host.loadTaskChanges,
    bumpEpoch: () => host.bumpChangesEpoch(),
    setHandle: (handle) => host.setChangesObservation(handle),
    apply: (load, gen, expectedTask, expectedEntry, expectedTurn) =>
      applyTaskChangesLoad({
        state: host.getState(),
        disposed: host.isDisposed(),
        epoch: host.changesEpoch(),
        gen,
        expectedTask,
        expectedEntry,
        expectedTurn,
        load,
        publish: (next) => host.publish(next),
      }),
  })
}
