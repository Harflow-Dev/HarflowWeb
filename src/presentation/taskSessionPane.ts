import type { LoadTaskChangesUseCase } from '../application'
import type { ObservationHandle, TaskChangesEntryRef, TaskId } from '../model'
import {
  applyTaskChangesLoad,
  beginTaskChangesObservation,
  changesEntriesEqual,
} from './taskSessionChanges'
import type { TaskChangesChrome, TaskScreenState } from './taskState'

export type ChangesPaneHost = {
  disposed(): boolean
  state(): TaskScreenState
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
    paneTab: chrome.paneTab ?? state.paneTab,
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
    changesEntriesEqual(state.changesLoad.observation.selectedEntry, entry) &&
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
  }
}

export function closedChangesPaneState(state: TaskScreenState): TaskScreenState {
  return {
    ...state,
    changesPaneOpen: false,
    paneTab: 'changes',
    changesQueryEntry: null,
    selectedChangeEntry: null,
    changesList: null,
    changesLoad: { kind: 'loading' },
    changesTurnTaskId: null,
    expandedRepos: [],
  }
}

export function openedChangesPaneState(state: TaskScreenState): {
  readonly next: TaskScreenState
  readonly observeChanges: boolean
} {
  const usesEvents =
    state.load.kind === 'ready' && state.load.observation.detailsPane === 'events'
  return {
    observeChanges: !usesEvents,
    next: {
      ...state,
      changesPaneOpen: true,
      paneTab: usesEvents ? 'events' : 'changes',
      changesQueryEntry: null,
      selectedChangeEntry: null,
      changesList: null,
      changesLoad: { kind: 'loading' },
      changesTurnTaskId: null,
      expandedRepos: [],
    },
  }
}

export function entryForPath(
  list: TaskScreenState['changesList'],
  path: string,
): TaskChangesEntryRef | null {
  if (!list) return null
  for (const repo of list.repositories) {
    for (const scopeId of ['committed_range', 'working_tree'] as const) {
      const scope = repo.scopes[scopeId]
      if (!scope) continue
      if (scope.rows.some((row) => row.path === path)) {
        return { repositoryRoot: repo.repositoryRoot, scope: scopeId, path }
      }
    }
  }
  return null
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
    paneTab: 'changes',
    changesQueryEntry: null,
    selectedChangeEntry: null,
    changesList: null,
    changesLoad: { kind: 'loading' },
    changesTurnTaskId: null,
    expandedRepos: [],
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
  const state = host.state()
  if (!state.selectedTaskId || !state.changesPaneOpen) return
  host.setChangesObservation(null)
  beginTaskChangesObservation({
    state,
    loadTaskChanges: host.loadTaskChanges,
    bumpEpoch: () => host.bumpChangesEpoch(),
    setHandle: (handle) => host.setChangesObservation(handle),
    apply: (load, gen, expectedTask, expectedEntry, expectedTurn) =>
      applyTaskChangesLoad({
        state: host.state(),
        disposed: host.disposed(),
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
