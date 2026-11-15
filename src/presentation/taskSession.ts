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
  openedChangesPaneState,
  seededChangesChromeState,
} from './taskSessionPane'
import {
  afterTaskLoad,
  eventsObservationDesired,
  nextEarlierEventsState,
  nextExpandedReposState,
  nextPaneTabState,
  nextSelectedEntryState,
  nextSelectedTurnState,
  paneTabForOpen,
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
      if (this.state.changesPaneOpen) {
        this.panes.beginChanges()
        this.panes.beginEvents()
      }
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
      return
    }
    const opened = openedChangesPaneState(this.state, paneTabForOpen(this.state))
    this.publish(opened.next)
    if (opened.observeChanges) this.panes.beginChanges()
    if (opened.observeEvents) this.panes.beginEvents()
  }

  /** Open Events and expand a facts group (top-bar chip). */
  revealEventsFacts(group: EventsFactsRevealId): void {
    if (this.closed) return
    const opened = revealEventsFactsState(this.state, group)
    this.publish(opened.next)
    if (opened.beginEventsOnly) {
      this.panes.beginEvents()
      return
    }
    if (opened.observeChanges) this.panes.beginChanges()
    if (opened.observeEvents) this.panes.beginEvents()
  }

  seedTaskCommandChrome(taskId: TaskId, chrome: TaskCommandChrome): void {
    if (this.closed) return
    const next = withSeededCommandChrome(this.state, taskId, chrome)
    if (next) this.publish(next)
  }

  clearCommandChrome(): void {
    if (this.closed) return
    const next = clearedCommandChrome(this.state)
    if (next) this.publish(next)
  }

  setOverflowMenuOpen(open: boolean): void {
    if (this.closed) return
    const next = overflowMenuOpenState(this.state, open)
    if (next) this.publish(next)
  }

  openTaskDialog(
    dialog: TaskDialogKind,
    opener: TaskDialogOpener | null,
  ): void {
    if (this.closed) return
    this.publish(openedTaskDialogState(this.state, dialog, opener))
  }

  closeTaskDialog(): void {
    if (this.closed) return
    const next = closedTaskDialogState(this.state)
    if (next) this.publish(next)
  }

  seedTaskOverflowChrome(taskId: TaskId, chrome: TaskOverflowChrome): void {
    if (this.closed) return
    const next = seededOverflowChromeState(this.state, taskId, chrome)
    if (next) this.publish(next)
  }

  seedTaskChangesChrome(taskId: TaskId, chrome: TaskChangesChrome): void {
    if (this.closed) return
    const next = seededChangesChromeState(this.state, taskId, chrome)
    if (!next) return
    this.publish(next)
    this.panes.beginChanges()
  }

  setPaneTab(tab: 'changes' | 'events'): void {
    if (this.closed) return
    const next = nextPaneTabState(this.state, tab)
    if (!next) return
    this.publish(next)
    if (tab === 'events') this.panes.beginEvents()
    else this.panes.stopEvents()
    if (!this.panes.hasChangesObservation()) this.panes.beginChanges()
  }

  loadEarlierEvents(): void {
    if (this.closed) return
    const next = nextEarlierEventsState(this.state)
    if (!next) return
    this.publish(next)
    this.panes.beginOlder()
  }

  selectChangedEntry(entry: TaskChangesEntryRef): void {
    if (this.closed) return
    const next = nextSelectedEntryState(
      this.state,
      entry,
      this.panes.hasChangesObservation(),
    )
    if (!next) return
    this.publish(next)
    this.panes.beginChanges()
  }

  selectChangesTurn(turnTaskId: TaskId): void {
    if (this.closed) return
    const next = nextSelectedTurnState(this.state, turnTaskId)
    if (!next) return
    this.publish(next)
    this.panes.beginChanges()
  }

  setRepositoryExpanded(repositoryRoot: string, expanded: boolean): void {
    if (this.closed) return
    const next = nextExpandedReposState(
      this.state,
      repositoryRoot,
      expanded,
    )
    if (next) this.publish(next)
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
    this.publish(loadingTaskScreenState(taskId))
    this.observation = this.loadTask.observe(taskId, (load) =>
      this.applyLoad(load, gen, taskId),
    )
  }

  private applyLoad(load: TaskLoad, gen: number, expected: TaskId): void {
    if (this.closed || gen !== this.observationEpoch) return
    if (expected !== this.state.selectedTaskId) return
    if (load.kind === 'ready' && load.observation.taskId !== expected) return
    const { next, openPane } = afterTaskLoad(this.state, load)
    this.publish(next)
    if (openPane) this.setChangesPaneOpen(true)
    const want = eventsObservationDesired(this.state)
    const has = this.panes.hasEventsObservation()
    if (want && !has) this.panes.beginEvents()
    if (!want && has) this.panes.stopEvents()
  }
}
