import type {
  LoadMessagingCapabilityUseCase,
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
  PaneMemory,
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
import { cancelledQueuedMessageState } from './taskSessionMessaging'
import { MessagingCapabilityWatch } from './taskMessagingCapabilityWatch'
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
  private readonly paneMemory = new PaneMemory()
  /** The selection came back with remembered pane choices (no default open). */
  private paneRestored = false
  private readonly listeners = new Set<TaskListener>()
  private readonly loadTask: LoadTaskUseCase
  private readonly capability: MessagingCapabilityWatch
  private readonly panes: TaskPaneObservers

  constructor(
    loadTask: LoadTaskUseCase,
    loadTaskChanges: LoadTaskChangesUseCase,
    loadTaskEvents: LoadTaskEventsUseCase,
    loadMessagingCapability: LoadMessagingCapabilityUseCase,
  ) {
    this.loadTask = loadTask
    this.capability = new MessagingCapabilityWatch(
      loadMessagingCapability,
      (load) => this.publish({ ...this.state, messagingCapability: load }),
    )
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
    this.capability.start()
    if (this.state.selectedTaskId) {
      this.beginObservation(this.state.selectedTaskId)
    }
  }

  dispose(): void {
    this.closed = true
    this.observationEpoch += 1
    this.observation?.cancel()
    this.observation = null
    this.capability.stop()
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
      this.paneMemory.remember(this.state)
      return
    }
    const opened = openedPaneState(this.state)
    this.publish(opened.next)
    this.paneMemory.remember(this.state)
    if (opened.observeChanges) this.panes.beginChanges()
    if (opened.observeEvents) this.panes.beginEvents()
  }

  /** Open Events and expand a facts group (top-bar chip). */
  revealEventsFacts(group: EventsFactsRevealId): void {
    if (this.closed) return
    const opened = revealEventsFactsState(this.state, group)
    this.publish(opened.next)
    this.paneMemory.remember(this.state)
    // Events already open and observed keeps its loaded pages.
    const beginEvents =
      opened.beginEventsOnly ||
      opened.observeEvents ||
      !this.panes.hasEventsObservation()
    if (opened.observeChanges) this.panes.beginChanges()
    if (beginEvents) this.panes.beginEvents()
  }

  seedTaskCommandChrome(id: TaskId, chrome: TaskCommandChrome): void {
    this.commit(withSeededCommandChrome(this.state, id, chrome))
  }

  clearCommandChrome(): void { this.commit(clearedCommandChrome(this.state)) }

  setOverflowMenuOpen(open: boolean): void {
    this.commit(overflowMenuOpenState(this.state, open))
  }

  openTaskDialog(
    dialog: TaskDialogKind,
    opener: TaskDialogOpener | null,
  ): void {
    this.commit(openedTaskDialogState(this.state, dialog, opener))
  }

  closeTaskDialog(): void { this.commit(closedTaskDialogState(this.state)) }

  seedTaskOverflowChrome(id: TaskId, chrome: TaskOverflowChrome): void {
    this.commit(seededOverflowChromeState(this.state, id, chrome))
  }

  seedTaskChangesChrome(taskId: TaskId, chrome: TaskChangesChrome): void {
    if (this.commit(seededChangesChromeState(this.state, taskId, chrome))) {
      this.panes.beginChanges()
    }
  }

  setPaneTab(tab: 'changes' | 'events'): void {
    if (!this.commit(nextPaneTabState(this.state, tab))) return
    this.paneMemory.remember(this.state)
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

  setRepositoryExpanded(root: string, expanded: boolean): void {
    this.commit(nextExpandedReposState(this.state, root, expanded))
  }

  cancelQueuedMessage(messageId: string): boolean {
    if (this.closed) return false
    return this.commit(cancelledQueuedMessageState(this.state, messageId))
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
    const remembered = this.paneMemory.get(taskId)
    this.paneRestored = remembered !== null
    this.publish(
      loadingTaskScreenState(
        taskId,
        remembered,
        this.state.messagingCapability,
      ),
    )
    this.observation = this.loadTask.observe(taskId, (load) =>
      this.applyLoad(load, gen, taskId),
    )
    if (remembered?.open === true) this.setChangesPaneOpen(true)
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
