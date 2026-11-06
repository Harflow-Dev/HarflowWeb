import type { LoadWorkflowExecutionUseCase } from '../application'
import type {
  ObservationHandle,
  WorkflowNodeId,
  WorkflowRunId,
  WorkflowRunLoad,
} from '../model'
import {
  initialWorkflowExecutionState,
  type WorkflowExecutionScreenState,
} from './workflowExecutionState'

export type WorkflowExecutionListener = (state: WorkflowExecutionScreenState) => void

/**
 * Read-only run observation.
 * A callback applies only for the open run id and observation generation.
 */
export class WorkflowExecutionSession {
  private state = initialWorkflowExecutionState()
  private epoch = 0
  private disposed = false
  private observation: ObservationHandle | null = null
  private readonly listeners = new Set<WorkflowExecutionListener>()
  private readonly loadRun: LoadWorkflowExecutionUseCase

  constructor(loadRun: LoadWorkflowExecutionUseCase) {
    this.loadRun = loadRun
  }

  subscribe(listener: WorkflowExecutionListener): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getState(): WorkflowExecutionScreenState {
    return this.state
  }

  start(): void {
    this.disposed = false
    const id = this.state.runId
    if (id === null) return
    this.begin(id)
  }

  dispose(): void {
    this.disposed = true
    this.epoch += 1
    this.observation?.cancel()
    this.observation = null
  }

  open(id: WorkflowRunId): void {
    this.epoch += 1
    const gen = this.epoch
    this.observation?.cancel()
    this.publish({ runId: id, load: { kind: 'loading' }, selectedNodeId: null })
    this.watch(id, gen)
  }

  close(): void {
    this.epoch += 1
    this.observation?.cancel()
    this.observation = null
    this.publish({ runId: null, load: { kind: 'loading' }, selectedNodeId: null })
  }

  /** Remember a node choice. Does not write the observation's selected node. */
  selectNode(nodeId: WorkflowNodeId | null): void {
    const current = this.state
    if (current.runId === null || current.load.kind !== 'ready') return
    if (current.load.run.runId !== current.runId) return
    this.publish({ ...current, selectedNodeId: nodeId })
  }

  private begin(id: WorkflowRunId): void {
    this.epoch += 1
    const gen = this.epoch
    this.observation?.cancel()
    this.publish({ ...this.state, load: { kind: 'loading' } })
    this.watch(id, gen)
  }

  private watch(id: WorkflowRunId, gen: number): void {
    this.observation = this.loadRun.observe(id, (load) => this.apply(id, gen, load))
  }

  private apply(id: WorkflowRunId, gen: number, load: WorkflowRunLoad): void {
    if (this.disposed || gen !== this.epoch || this.state.runId !== id) return
    if (load.kind === 'ready' && load.run.runId !== id) return
    this.publish({
      runId: id,
      load,
      selectedNodeId: this.state.selectedNodeId,
    })
  }

  private publish(next: WorkflowExecutionScreenState): void {
    if (this.disposed) return
    this.state = next
    for (const listener of this.listeners) listener(this.state)
  }
}
