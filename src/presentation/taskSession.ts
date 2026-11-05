import type { LoadTaskUseCase } from '../application'
import type { ObservationHandle, TaskId, TaskLoad } from '../model'
import { initialTaskState, type TaskScreenState } from './taskState'

export type TaskListener = (state: TaskScreenState) => void

/**
 * Owns the selected running-task identity and its observation lifetime.
 * Switching tasks cancels the prior observation; late callbacks are ignored.
 */
export class TaskSession {
  private state = initialTaskState()
  private observationEpoch = 0
  private disposed = false
  private observation: ObservationHandle | null = null
  private readonly listeners = new Set<TaskListener>()
  private readonly loadTask: LoadTaskUseCase

  constructor(loadTask: LoadTaskUseCase) {
    this.loadTask = loadTask
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
    }
  }

  dispose(): void {
    this.disposed = true
    this.observationEpoch += 1
    this.observation?.cancel()
    this.observation = null
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

  private beginObservation(taskId: TaskId): void {
    this.observationEpoch += 1
    const gen = this.observationEpoch
    this.observation?.cancel()
    this.observation = null
    this.publish({ selectedTaskId: taskId, load: { kind: 'loading' } })
    this.observation = this.loadTask.observe(taskId, (load) =>
      this.applyLoad(load, gen, taskId),
    )
  }

  private applyLoad(load: TaskLoad, gen: number, expected: TaskId): void {
    if (this.disposed || gen !== this.observationEpoch) return
    if (expected !== this.state.selectedTaskId) return
    if (load.kind === 'ready' && load.observation.taskId !== expected) return
    this.publish({ selectedTaskId: this.state.selectedTaskId, load })
  }

  private publish(next: TaskScreenState): void {
    if (this.disposed) return
    this.state = next
    for (const listener of this.listeners) listener(this.state)
  }
}
