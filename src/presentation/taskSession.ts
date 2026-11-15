import type {
  LoadTaskChangesUseCase,
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
  type TaskPaneTab,
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
  beginPaneChangesObservation,
  closedChangesPaneState,
  entryForPath,
  loadingTaskScreenState,
  openedChangesPaneState,
  seededChangesChromeState,
  selectedEntryState,
  selectedTurnState,
  toggledExpandedRepos,
  type ChangesPaneHost,
} from './taskSessionPane'

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
  private changesEpoch = 0
  private disposed = false
  private observation: ObservationHandle | null = null
  private changesObservation: ObservationHandle | null = null
  private readonly listeners = new Set<TaskListener>()
  private readonly loadTask: LoadTaskUseCase
  private readonly loadTaskChanges: LoadTaskChangesUseCase

  constructor(
    loadTask: LoadTaskUseCase,
    loadTaskChanges: LoadTaskChangesUseCase,
  ) {
    this.loadTask = loadTask
    this.loadTaskChanges = loadTaskChanges
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

  start(): void {
    this.disposed = false
    if (this.state.selectedTaskId) {
      this.beginObservation(this.state.selectedTaskId)
      if (this.state.changesPaneOpen) {
        this.beginChangesObservation()
      }
    }
  }

  dispose(): void {
    this.disposed = true
    this.observationEpoch += 1
    this.changesEpoch += 1
    this.observation?.cancel()
    this.observation = null
    this.changesObservation?.cancel()
    this.changesObservation = null
  }

  openTask(taskId: TaskId): void {
    if (this.disposed) return
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
    if (this.disposed || open === this.state.changesPaneOpen) return
    if (!open) {
      this.stopChangesObservation()
      this.publish(closedChangesPaneState(this.state))
      return
    }
    const opened = openedChangesPaneState(this.state)
    this.publish(opened.next)
    if (opened.observeChanges) this.beginChangesObservation()
  }

  setPaneTab(tab: TaskPaneTab): void {
    if (this.disposed || !this.state.changesPaneOpen) return
    if (tab === this.state.paneTab) return
    this.publish({ ...this.state, paneTab: tab })
    if (
      tab === 'changes' &&
      this.state.load.kind === 'ready' &&
      this.state.load.observation.detailsPane === 'changes' &&
      !this.changesObservation
    ) {
      this.beginChangesObservation()
    }
  }

  seedTaskCommandChrome(taskId: TaskId, chrome: TaskCommandChrome): void {
    if (this.disposed) return
    if (this.state.selectedTaskId !== taskId) return
    if (this.state.load.kind !== 'ready') return
    this.publish(
      reconcileOverflowChrome({ ...this.state, commandChrome: chrome }),
    )
  }

  clearCommandChrome(): void {
    if (this.disposed) return
    const next = withoutCommandChrome(this.state)
    if (next) this.publish(next)
  }

  setOverflowMenuOpen(open: boolean): void {
    if (this.disposed) return
    const next = withOverflowMenuOpen(this.state, open)
    if (next) this.publish(next)
  }

  openTaskDialog(
    dialog: TaskDialogKind,
    opener: TaskDialogOpener | null,
  ): void {
    if (this.disposed) return
    this.publish(
      reconcileOverflowChrome(withTaskDialog(this.state, dialog, opener)),
    )
  }

  closeTaskDialog(): void {
    if (this.disposed) return
    const next = withoutTaskDialog(this.state)
    if (next) this.publish(next)
  }

  seedTaskOverflowChrome(taskId: TaskId, chrome: TaskOverflowChrome): void {
    if (this.disposed) return
    const next = withSeededOverflowChrome(this.state, taskId, chrome)
    if (next) this.publish(reconcileOverflowChrome(next))
  }

  seedTaskChangesChrome(taskId: TaskId, chrome: TaskChangesChrome): void {
    if (this.disposed) return
    const next = seededChangesChromeState(this.state, taskId, chrome)
    if (!next) return
    this.publish(next)
    this.beginChangesObservation()
  }

  selectChangedEntry(entry: TaskChangesEntryRef): void {
    if (this.disposed) return
    const next = selectedEntryState(
      this.state,
      entry,
      this.changesObservation !== null,
    )
    if (!next) return
    this.publish(next)
    this.beginChangesObservation()
  }

  /** @deprecated Prefer selectChangedEntry. */
  selectChangedFile(path: string): void {
    const entry = entryForPath(this.state.changesList, path)
    if (entry) this.selectChangedEntry(entry)
  }

  selectChangesTurn(turnTaskId: TaskId): void {
    if (this.disposed) return
    const next = selectedTurnState(this.state, turnTaskId)
    if (!next) return
    this.publish(next)
    this.beginChangesObservation()
  }

  setRepositoryExpanded(repositoryRoot: string, expanded: boolean): void {
    if (this.disposed) return
    const expandedRepos = toggledExpandedRepos(
      this.state.expandedRepos,
      repositoryRoot,
      expanded,
    )
    if (!expandedRepos) return
    this.publish({ ...this.state, expandedRepos })
  }

  private beginObservation(taskId: TaskId): void {
    this.observationEpoch += 1
    const gen = this.observationEpoch
    this.observation?.cancel()
    this.observation = null
    this.stopChangesObservation()
    this.publish(loadingTaskScreenState(taskId))
    this.observation = this.loadTask.observe(taskId, (load) =>
      this.applyLoad(load, gen, taskId),
    )
  }

  private beginChangesObservation(): void {
    if (!this.state.selectedTaskId || !this.state.changesPaneOpen) return
    this.changesObservation?.cancel()
    beginPaneChangesObservation(this.paneHost())
  }

  private paneHost(): ChangesPaneHost {
    return {
      disposed: () => this.disposed,
      state: () => this.state,
      loadTaskChanges: this.loadTaskChanges,
      changesEpoch: () => this.changesEpoch,
      bumpChangesEpoch: () => {
        this.changesEpoch += 1
        return this.changesEpoch
      },
      setChangesObservation: (handle) => {
        this.changesObservation = handle
      },
      publish: (next) => this.publish(next),
    }
  }

  private stopChangesObservation(): void {
    this.changesEpoch += 1
    this.changesObservation?.cancel()
    this.changesObservation = null
  }

  private applyLoad(load: TaskLoad, gen: number, expected: TaskId): void {
    if (this.disposed || gen !== this.observationEpoch) return
    if (expected !== this.state.selectedTaskId) return
    if (load.kind === 'ready' && load.observation.taskId !== expected) return
    this.publish(reconcileOverflowChrome({ ...this.state, load }))
  }

  private publish(next: TaskScreenState): void {
    if (this.disposed) return
    this.state = next
    for (const listener of this.listeners) listener(this.state)
  }
}
