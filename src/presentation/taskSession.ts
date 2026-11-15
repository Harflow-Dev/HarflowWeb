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
  type TaskEventsChrome,
  type TaskOverflowChrome,
  type TaskScreenState,
} from './taskState'
import {
  reconcileOverflowChrome,
  withoutCommandChrome,
  withoutTaskDialog,
  withOverflowMenuOpen,
  withSeededOverflowChrome,
  withTaskDialog,
} from './taskOverflowChrome'
import {
  closedChangesPaneState,
  loadingTaskScreenState,
  openedChangesPaneState,
  seededChangesChromeState,
  selectedEntryState,
  selectedTurnState,
  toggledExpandedRepos,
} from './taskSessionPane'
import {
  appliedEarlierEventsState,
  paneTabState,
  seededEventsChromeState,
} from './taskSessionEvents'
import { TaskPaneObservers } from './taskSessionObservers'

export type TaskListener = (state: TaskScreenState) => void

/**
 * Owns selected task identity, transcript observation, and optional
 * Changes-pane observation. Switching task/entry/turn/generation rejects stale
 * callbacks even when cancellation is ignored by the adapter.
 *
 * `changesQueryEntry` is the observation query identity (null = default).
 * `selectedChangeEntry` is display-only and may resolve after a null query
 * without invalidating later updates from that same observation.
 */
export class TaskSession {
  private state = initialTaskState()
  private observationEpoch = 0
  private closed = false
  private observation: ObservationHandle | null = null
  private readonly listeners = new Set<TaskListener>()
  private readonly loadTask: LoadTaskUseCase
  readonly loadTaskChanges: LoadTaskChangesUseCase
  readonly loadTaskEvents: LoadTaskEventsUseCase
  private readonly panes: TaskPaneObservers

  constructor(
    loadTask: LoadTaskUseCase,
    loadTaskChanges: LoadTaskChangesUseCase,
    loadTaskEvents: LoadTaskEventsUseCase,
  ) {
    this.loadTask = loadTask
    this.loadTaskChanges = loadTaskChanges
    this.loadTaskEvents = loadTaskEvents
    this.panes = new TaskPaneObservers(this)
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
    const opened = openedChangesPaneState(this.state)
    this.publish(opened.next)
    if (opened.observeChanges) this.panes.beginChanges()
    if (opened.observeEvents) this.panes.beginEvents()
  }

  seedTaskCommandChrome(taskId: TaskId, chrome: TaskCommandChrome): void {
    if (this.closed) return
    if (this.state.selectedTaskId !== taskId) return
    if (this.state.load.kind !== 'ready') return
    this.publish(
      reconcileOverflowChrome({ ...this.state, commandChrome: chrome }),
    )
  }

  clearCommandChrome(): void {
    if (this.closed) return
    const next = withoutCommandChrome(this.state)
    if (next) this.publish(next)
  }

  setOverflowMenuOpen(open: boolean): void {
    if (this.closed) return
    const next = withOverflowMenuOpen(this.state, open)
    if (next) this.publish(next)
  }

  openTaskDialog(
    dialog: TaskDialogKind,
    opener: TaskDialogOpener | null,
  ): void {
    if (this.closed) return
    this.publish(
      reconcileOverflowChrome(withTaskDialog(this.state, dialog, opener)),
    )
  }

  closeTaskDialog(): void {
    if (this.closed) return
    const next = withoutTaskDialog(this.state)
    if (next) this.publish(next)
  }

  seedTaskOverflowChrome(taskId: TaskId, chrome: TaskOverflowChrome): void {
    if (this.closed) return
    const next = withSeededOverflowChrome(this.state, taskId, chrome)
    if (next) this.publish(reconcileOverflowChrome(next))
  }

  seedTaskChangesChrome(taskId: TaskId, chrome: TaskChangesChrome): void {
    if (this.closed) return
    const next = seededChangesChromeState(this.state, taskId, chrome)
    if (!next) return
    this.publish(next)
    this.panes.beginChanges()
  }

  seedTaskEventsChrome(taskId: TaskId, chrome: TaskEventsChrome): void {
    if (this.closed) return
    const next = seededEventsChromeState(this.state, taskId, chrome)
    if (!next) return
    this.publish(next)
    if (next.paneTab === 'events') {
      this.panes.beginEvents()
      if (!this.panes.hasChangesObservation()) this.panes.beginChanges()
    }
  }

  setPaneTab(tab: 'changes' | 'events'): void {
    if (this.closed) return
    const next = paneTabState(this.state, tab)
    if (!next) return
    this.publish(next)
    if (tab === 'events') {
      this.panes.beginEvents()
      if (!this.panes.hasChangesObservation()) this.panes.beginChanges()
      return
    }
    this.panes.stopEvents()
    this.panes.beginChanges()
  }

  loadEarlierEvents(): void {
    if (this.closed) return
    const next = appliedEarlierEventsState(this.state)
    if (next) this.publish(next)
  }

  selectChangedEntry(entry: TaskChangesEntryRef): void {
    if (this.closed) return
    const next = selectedEntryState(
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
    const next = selectedTurnState(this.state, turnTaskId)
    if (!next) return
    this.publish(next)
    this.panes.beginChanges()
  }

  setRepositoryExpanded(repositoryRoot: string, expanded: boolean): void {
    if (this.closed) return
    const expandedRepos = toggledExpandedRepos(
      this.state.expandedRepos,
      repositoryRoot,
      expanded,
    )
    if (!expandedRepos) return
    this.publish({ ...this.state, expandedRepos })
  }

  publish(next: TaskScreenState): void {
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
    this.publish(reconcileOverflowChrome({ ...this.state, load }))
  }
}
