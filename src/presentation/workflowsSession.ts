import type { LoadWorkflowsUseCase } from '../application'
import type { ObservationHandle, WorkflowsLoad } from '../model'
import {
  initialWorkflowsState,
  type WorkflowsScreenState,
} from './workflowsState'

export type WorkflowsListener = (state: WorkflowsScreenState) => void

export class WorkflowsSession {
  private state = initialWorkflowsState()
  private observationEpoch = 0
  private disposed = false
  private observation: ObservationHandle | null = null
  private readonly listeners = new Set<WorkflowsListener>()
  private readonly loadWorkflows: LoadWorkflowsUseCase

  constructor(loadWorkflows: LoadWorkflowsUseCase) {
    this.loadWorkflows = loadWorkflows
  }

  subscribe(listener: WorkflowsListener): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getState(): WorkflowsScreenState {
    return this.state
  }

  start(): void {
    this.disposed = false
    this.observationEpoch += 1
    const gen = this.observationEpoch
    this.observation?.cancel()
    this.publish({ load: { kind: 'loading' } })
    this.observation = this.loadWorkflows.observe((load) =>
      this.applyLoad(load, gen),
    )
  }

  dispose(): void {
    this.disposed = true
    this.observationEpoch += 1
    this.observation?.cancel()
    this.observation = null
  }

  private applyLoad(load: WorkflowsLoad, gen: number): void {
    if (this.disposed || gen !== this.observationEpoch) return
    this.publish({ load })
  }

  private publish(next: WorkflowsScreenState): void {
    if (this.disposed) return
    this.state = next
    for (const listener of this.listeners) listener(this.state)
  }
}
