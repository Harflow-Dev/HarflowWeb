import type {
  LoadTaskChangesUseCase,
  LoadTaskUseCase,
} from '../application'
import type { ObservationHandle, TaskId, TaskLoad } from '../model'
import {
  initialTaskState,
  type TaskCommandChrome,
  type TaskDialogKind,
  type TaskDialogOpener,
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
  applyTaskChangesLoad,
  beginTaskChangesObservation,
} from './taskSessionChanges'

export type TaskListener = (state: TaskScreenState) => void

/**
 * Owns selected task identity, transcript observation, and optional
 * Changes-pane observation. Switching task/file/generation rejects stale
 * callbacks even when cancellation is ignored by the adapter.
 *
 * `changesQueryPath` is the observation query identity (null = default).
 * `selectedChangePath` is display-only and may resolve after a null query
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
      // Reopening the same task keeps its observation but not seeded chrome.
      this.clearCommandChrome()
      return
    }
    this.beginObservation(taskId)
  }

  setChangesPaneOpen(open: boolean): void {
    if (this.disposed || open === this.state.changesPaneOpen) return
    if (!open) {
      this.stopChangesObservation()
      this.publish({
        ...this.state,
        changesPaneOpen: false,
        changesQueryPath: null,
        selectedChangePath: null,
        changesFiles: null,
        changesLoad: { kind: 'loading' },
      })
      return
    }
    const usesEvents =
      this.state.load.kind === 'ready' &&
      this.state.load.observation.detailsPane === 'events'
    this.publish({
      ...this.state,
      changesPaneOpen: true,
      changesQueryPath: null,
      selectedChangePath: null,
      changesFiles: null,
      changesLoad: { kind: 'loading' },
    })
    // Events pane does not observe Changes.
    if (!usesEvents) this.beginChangesObservation()
  }

  /**
   * Preview seeding: show command lifecycle chrome on one ready task. Ignored
   * when another task is selected or the observation is not ready yet.
   */
  seedTaskCommandChrome(taskId: TaskId, chrome: TaskCommandChrome): void {
    if (this.disposed) return
    if (this.state.selectedTaskId !== taskId) return
    if (this.state.load.kind !== 'ready') return
    this.publish(
      reconcileOverflowChrome({ ...this.state, commandChrome: chrome }),
    )
  }

  /** Drop command lifecycle and overflow chrome; the selected task stays. */
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

  /** Preview seeding: overflow menu and/or confirmation dialog when ready. */
  seedTaskOverflowChrome(taskId: TaskId, chrome: TaskOverflowChrome): void {
    if (this.disposed) return
    const next = withSeededOverflowChrome(this.state, taskId, chrome)
    if (next) this.publish(reconcileOverflowChrome(next))
  }

  selectChangedFile(path: string): void {
    if (this.disposed || !this.state.changesPaneOpen) return
    if (
      this.state.changesLoad.kind === 'ready' &&
      this.state.changesLoad.observation.selectedPath === path &&
      this.changesObservation &&
      (this.state.changesQueryPath === path ||
        this.state.changesQueryPath === null)
    ) {
      return
    }
    if (
      path === this.state.changesQueryPath &&
      this.changesObservation &&
      this.state.changesLoad.kind !== 'loading'
    ) {
      return
    }
    // Keep file rows mounted; clear prior diff under the new identity.
    this.publish({
      ...this.state,
      changesQueryPath: path,
      selectedChangePath: path,
      changesLoad: { kind: 'loading' },
    })
    this.beginChangesObservation()
  }

  private beginObservation(taskId: TaskId): void {
    this.observationEpoch += 1
    const gen = this.observationEpoch
    this.observation?.cancel()
    this.observation = null
    // Close Changes on every task switch so unsupported states never trap an
    // open pane without a close control, and clear stale change content now.
    this.stopChangesObservation()
    this.publish({
      selectedTaskId: taskId,
      load: { kind: 'loading' },
      commandChrome: null,
      overflowMenuOpen: false,
      dialog: null,
      dialogOpener: null,
      changesPaneOpen: false,
      changesQueryPath: null,
      selectedChangePath: null,
      changesFiles: null,
      changesLoad: { kind: 'loading' },
    })
    this.observation = this.loadTask.observe(taskId, (load) =>
      this.applyLoad(load, gen, taskId),
    )
  }

  private beginChangesObservation(): void {
    if (!this.state.selectedTaskId || !this.state.changesPaneOpen) return
    this.changesObservation?.cancel()
    this.changesObservation = null
    beginTaskChangesObservation({
      state: this.state,
      loadTaskChanges: this.loadTaskChanges,
      bumpEpoch: () => {
        this.changesEpoch += 1
        return this.changesEpoch
      },
      setHandle: (handle) => {
        this.changesObservation = handle
      },
      apply: (load, gen, expectedTask, expectedQueryPath) =>
        applyTaskChangesLoad({
          state: this.state,
          disposed: this.disposed,
          epoch: this.changesEpoch,
          gen,
          expectedTask,
          expectedQueryPath,
          load,
          publish: (next) => this.publish(next),
        }),
    })
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
    // Menu/dialog chrome only survives while the new load still supports it.
    this.publish(reconcileOverflowChrome({ ...this.state, load }))
  }

  private publish(next: TaskScreenState): void {
    if (this.disposed) return
    this.state = next
    for (const listener of this.listeners) listener(this.state)
  }
}
