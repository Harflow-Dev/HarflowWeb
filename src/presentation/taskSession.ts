import type {
  LoadTaskChangesUseCase,
  LoadTaskEventsUseCase,
  LoadTaskUseCase,
} from '../application'
import type {
  TaskChangesEntryRef,
  TaskId,
  TaskLoad,
  ObservationHandle,
} from '../model'
import {
  initialTaskState,
  type TaskChangesChrome,
  type TaskCommandChrome,
  type TaskDialogKind,
  type TaskDialogOpener,
  type TaskOverflowChrome,
  type TaskScreenState,
} from './taskState'
import {
  clearedCommandChrome,
  closedTaskDialogState,
  openedTaskDialogState,
  overflowMenuOpenState,
  seededOverflowChromeState,
  withSeededCommandChrome,
} from './taskSessionChrome'
import {
  closedChangesPaneState,
  loadingTaskScreenState,
  seededChangesChromeState,
  type RememberedPane,
} from './taskSessionPane'
import {
  afterTaskLoad,
  eventsObservationDesired,
  nextEarlierEventsState,
  nextExpandedReposState,
  nextPaneTabState,
  nextSelectedEntryState,
  nextSelectedTurnState,
  openedPaneState,
  revealEventsFactsState,
} from './taskSessionPaneOpen'
import { TaskPaneObservers } from './taskSessionObservers'
import type { EventsFactsRevealId } from './taskTopbarChips'

export type TaskListener = (state: TaskScreenState) => void

/** Selected task + Changes/Events pane observation; rejects stale callbacks. */
export class TaskSession {
  private state = initialTaskState()
  private observationEpoch = 0
  private closed = false
  private observation: ObservationHandle | null = null
  /** Pane open state and tab per task id, kept for the session. */
  private readonly paneMemory = new Map<TaskId, RememberedPane>()
  /** The selection came back with remembered pane choices (no default open). */
  private paneRestored = false
  private readonly listeners = new Set<TaskListener>()
  private readonly loadTask: LoadTaskUseCase
  private readonly panes: TaskPaneObservers

  constructor(
    loadTask: LoadTaskUseCase,
    loadTaskChanges: LoadTaskChangesUseCase,
    loadTaskEvents: LoadTaskEventsUseCase,
  ) {
    this.loadTask = loadTask
    this.panes = new TaskPaneObservers({
      isDisposed: () => this.closed,
      getState: () => this.state,
      publish: (next) => this.publish(next),
      loadTaskChanges,
      loadTaskEvents,
    })
  }

  subscribe(listener: TaskListener): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getState(): TaskScreenState {
    return this.state
  }

  isDisposed(): boolean {
    return this.closed
  }

  start(): void {
    this.closed = false
    if (this.state.selectedTaskId) {
      this.beginObservation(this.state.selectedTaskId)
    }
  }

  dispose(): void {
    this.closed = true
    this.observationEpoch += 1
    this.observation?.cancel()
    this.observation = null
    this.panes.dispose()
  }

  openTask(taskId: TaskId): void {
    if (this.closed) return
    if (
      taskId === this.state.selectedTaskId &&
      this.observation &&
      this.state.load.kind !== 'loading'
    ) {
      this.clearCommandChrome()
      return
    }
    this.beginObservation(taskId)
  }

  setChangesPaneOpen(open: boolean): void {
    if (this.closed || open === this.state.changesPaneOpen) return
    if (!open) {
      this.panes.stopChanges()
      this.panes.stopEvents()
      this.publish(closedChangesPaneState(this.state))
      this.rememberPane()
      return
    }
    const opened = openedPaneState(this.state)
    this.publish(opened.next)
    this.rememberPane()
    if (opened.observeChanges) this.panes.beginChanges()
    if (opened.observeEvents) this.panes.beginEvents()
  }

  /** Open Events and expand a facts group (top-bar chip). */
  revealEventsFacts(group: EventsFactsRevealId): void {
    if (this.closed) return
    const opened = revealEventsFactsState(this.state, group)
    this.publish(opened.next)
    this.rememberPane()
    // Events already open and observed keeps its loaded pages.
    const beginEvents =
      opened.beginEventsOnly ||
      opened.observeEvents ||
      !this.panes.hasEventsObservation()
    if (opened.observeChanges) this.panes.beginChanges()
    if (beginEvents) this.panes.beginEvents()
  }

  seedTaskCommandChrome(taskId: TaskId, chrome: TaskCommandChrome): void {
    this.commit(withSeededCommandChrome(this.state, taskId, chrome))
  }

  clearCommandChrome(): void {
    this.commit(clearedCommandChrome(this.state))
  }

  setOverflowMenuOpen(open: boolean): void {
    this.commit(overflowMenuOpenState(this.state, open))
  }

  openTaskDialog(
    dialog: TaskDialogKind,
    opener: TaskDialogOpener | null,
  ): void {
    this.commit(openedTaskDialogState(this.state, dialog, opener))
  }

  closeTaskDialog(): void {
    this.commit(closedTaskDialogState(this.state))
  }

  seedTaskOverflowChrome(taskId: TaskId, chrome: TaskOverflowChrome): void {
    this.commit(seededOverflowChromeState(this.state, taskId, chrome))
  }

  seedTaskChangesChrome(taskId: TaskId, chrome: TaskChangesChrome): void {
    if (this.commit(seededChangesChromeState(this.state, taskId, chrome))) {
      this.panes.beginChanges()
    }
  }

  setPaneTab(tab: 'changes' | 'events'): void {
    if (!this.commit(nextPaneTabState(this.state, tab))) return
    this.rememberPane()
    if (tab === 'events') this.panes.beginEvents()
    else this.panes.stopEvents()
    if (!this.panes.hasChangesObservation()) this.panes.beginChanges()
  }

  loadEarlierEvents(): void {
    if (this.commit(nextEarlierEventsState(this.state))) {
      this.panes.beginOlder()
    }
  }

  selectChangedEntry(entry: TaskChangesEntryRef): void {
    const has = this.panes.hasChangesObservation()
    if (this.commit(nextSelectedEntryState(this.state, entry, has))) {
      this.panes.beginChanges()
    }
  }

  selectChangesTurn(turnTaskId: TaskId): void {
    if (this.commit(nextSelectedTurnState(this.state, turnTaskId))) {
      this.panes.beginChanges()
    }
  }

  setRepositoryExpanded(repositoryRoot: string, expanded: boolean): void {
    this.commit(nextExpandedReposState(this.state, repositoryRoot, expanded))
  }

  /** Publish a computed next state; false when closed or nothing changed. */
  private commit(next: TaskScreenState | null): boolean {
    if (this.closed || next === null) return false
    this.publish(next)
    return true
  }

  private publish(next: TaskScreenState): void {
    if (this.closed) return
    this.state = next
    for (const listener of this.listeners) listener(this.state)
  }

  private beginObservation(taskId: TaskId): void {
    this.observationEpoch += 1
    const gen = this.observationEpoch
    this.observation?.cancel()
    this.observation = null
    this.panes.stopChanges()
    this.panes.stopEvents()
    const remembered = this.paneMemory.get(taskId) ?? null
    this.paneRestored = remembered !== null
    this.publish(loadingTaskScreenState(taskId, remembered))
    this.observation = this.loadTask.observe(taskId, (load) =>
      this.applyLoad(load, gen, taskId),
    )
    if (remembered?.open === true) this.setChangesPaneOpen(true)
  }

  /** Keep the open state and tab so returning to this task restores them. */
  private rememberPane(): void {
    const { selectedTaskId, changesPaneOpen, paneTab, paneOpenedOnce } =
      this.state
    if (selectedTaskId === null) return
    this.paneMemory.set(selectedTaskId, {
      open: changesPaneOpen,
      tab: paneTab,
      decided: paneOpenedOnce,
    })
  }

  private applyLoad(load: TaskLoad, gen: number, expected: TaskId): void {
    if (this.closed || gen !== this.observationEpoch) return
    if (expected !== this.state.selectedTaskId) return
    if (load.kind === 'ready' && load.observation.taskId !== expected) return
    const { next, openPane } = afterTaskLoad(this.state, load)
    this.publish(next)
    if (openPane && !this.paneRestored) this.setChangesPaneOpen(true)
    const want = eventsObservationDesired(this.state)
    const has = this.panes.hasEventsObservation()
    if (want && !has) this.panes.beginEvents()
    if (!want && has) this.panes.stopEvents()
  }
}
