import type {
  LoadTaskChangesUseCase,
  LoadTaskUseCase,
} from '../application'
import type {
  ObservationHandle,
  TaskChangesLoad,
  TaskId,
  TaskLoad,
} from '../model'
import { initialTaskState, type TaskScreenState } from './taskState'

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
      this.state.load.observation.transcript !== null
    this.publish({
      ...this.state,
      changesPaneOpen: true,
      changesQueryPath: null,
      selectedChangePath: null,
      changesFiles: null,
      changesLoad: { kind: 'loading' },
    })
    // Transcript states open Events, not Changes — skip the changes observation.
    if (!usesEvents) this.beginChangesObservation()
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
    const taskId = this.state.selectedTaskId
    if (!taskId || !this.state.changesPaneOpen) return
    this.changesEpoch += 1
    const gen = this.changesEpoch
    const queryPath = this.state.changesQueryPath
    this.changesObservation?.cancel()
    this.changesObservation = null
    this.changesObservation = this.loadTaskChanges.observe(
      { taskId, selectedPath: queryPath },
      (load) => this.applyChangesLoad(load, gen, taskId, queryPath),
    )
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
    this.publish({ ...this.state, load })
  }

  private applyChangesLoad(
    load: TaskChangesLoad,
    gen: number,
    expectedTask: TaskId,
    expectedQueryPath: string | null,
  ): void {
    if (this.disposed || gen !== this.changesEpoch) return
    if (!this.state.changesPaneOpen) return
    if (expectedTask !== this.state.selectedTaskId) return
    // Fence by query identity — not the resolved display selection.
    if (expectedQueryPath !== this.state.changesQueryPath) return
    if (load.kind === 'ready') {
      if (load.observation.taskId !== expectedTask) return
      if (
        expectedQueryPath !== null &&
        load.observation.selectedPath !== expectedQueryPath
      ) {
        return
      }
      this.publish({
        ...this.state,
        // Keep changesQueryPath as the original query (null stays null).
        selectedChangePath: load.observation.selectedPath,
        changesFiles: load.observation.files,
        changesLoad: load,
      })
      return
    }
    this.publish({ ...this.state, changesLoad: load })
  }

  private publish(next: TaskScreenState): void {
    if (this.disposed) return
    this.state = next
    for (const listener of this.listeners) listener(this.state)
  }
}
