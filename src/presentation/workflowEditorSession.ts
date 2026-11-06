import type { LoadWorkflowEditorUseCase } from '../application'
import type {
  ObservationHandle,
  WorkflowEditorLoad,
  WorkflowId,
  WorkflowNodeId,
} from '../model'
import { workflowEditorHasNode } from '../model'
import {
  initialWorkflowEditorState,
  type WorkflowEditorScreenState,
} from './workflowEditorState'

export type WorkflowEditorListener = (state: WorkflowEditorScreenState) => void

/**
 * Read-only editor preview.
 * Callbacks apply only for the open definition id and observation generation.
 */
export class WorkflowEditorSession {
  private state = initialWorkflowEditorState()
  private epoch = 0
  private disposed = false
  private observation: ObservationHandle | null = null
  private readonly listeners = new Set<WorkflowEditorListener>()
  private readonly loadEditor: LoadWorkflowEditorUseCase

  constructor(loadEditor: LoadWorkflowEditorUseCase) {
    this.loadEditor = loadEditor
  }

  subscribe(listener: WorkflowEditorListener): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getState(): WorkflowEditorScreenState {
    return this.state
  }

  start(): void {
    this.disposed = false
    const id = this.state.workflowId
    if (id === null) return
    this.begin(id)
  }

  dispose(): void {
    this.disposed = true
    this.epoch += 1
    this.observation?.cancel()
    this.observation = null
  }

  open(id: WorkflowId): void {
    this.epoch += 1
    const gen = this.epoch
    this.observation?.cancel()
    this.publish({ ...this.state, workflowId: id, load: { kind: 'loading' } })
    this.watch(id, gen)
  }

  close(): void {
    this.epoch += 1
    this.observation?.cancel()
    this.observation = null
    this.publish({ ...this.state, workflowId: null, load: { kind: 'loading' } })
  }

  select(nodeId: WorkflowNodeId): void {
    const id = this.state.workflowId
    const load = this.state.load
    if (!id || load.kind !== 'ready' || load.definition.workflowId !== id) return
    if (!workflowEditorHasNode(load.definition, nodeId)) return
    this.publish({
      ...this.state,
      selections: { ...this.state.selections, [id]: nodeId },
    })
  }

  private begin(id: WorkflowId): void {
    this.epoch += 1
    const gen = this.epoch
    this.observation?.cancel()
    this.publish({ ...this.state, load: { kind: 'loading' } })
    this.watch(id, gen)
  }

  private watch(id: WorkflowId, gen: number): void {
    this.observation = this.loadEditor.observe(id, (load) => this.apply(id, gen, load))
  }

  private apply(id: WorkflowId, gen: number, load: WorkflowEditorLoad): void {
    if (this.disposed || gen !== this.epoch || this.state.workflowId !== id) return
    if (load.kind === 'ready' && load.definition.workflowId !== id) return
    const selections = this.seedSelection(id, load)
    this.publish({ ...this.state, selections, load })
  }

  private seedSelection(
    id: WorkflowId,
    load: WorkflowEditorLoad,
  ): WorkflowEditorScreenState['selections'] {
    if (load.kind !== 'ready' || this.state.selections[id] !== undefined) {
      return this.state.selections
    }
    const preferred = load.definition.defaultSelectedId
    const selected =
      preferred && workflowEditorHasNode(load.definition, preferred) ? preferred : null
    return { ...this.state.selections, [id]: selected }
  }

  private publish(next: WorkflowEditorScreenState): void {
    if (this.disposed) return
    this.state = next
    for (const listener of this.listeners) listener(this.state)
  }
}
