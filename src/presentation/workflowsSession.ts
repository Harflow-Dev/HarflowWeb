import type { LoadWorkflowRunUseCase, LoadWorkflowsUseCase } from '../application'
import type {
  ObservationHandle,
  RepositoryId,
  WorkflowId,
  WorkflowOverrideId,
  WorkflowRunContextLoad,
  WorkflowRunDraft,
  WorkflowsLoad,
} from '../model'
import {
  emptyWorkflowRunDraft,
  seedWorkflowRunDraft,
} from '../model'
import {
  initialWorkflowsState,
  type WorkflowsScreenState,
} from './workflowsState'

export type WorkflowsListener = (state: WorkflowsScreenState) => void

/**
 * Workflow list plus per-definition run drafts.
 * Run context callbacks are bound to the definition id and observation generation.
 */
export class WorkflowsSession {
  private state = initialWorkflowsState()
  private observationEpoch = 0
  private runEpoch = 0
  private disposed = false
  private observation: ObservationHandle | null = null
  private runObservation: ObservationHandle | null = null
  private readonly listeners = new Set<WorkflowsListener>()
  private readonly loadWorkflows: LoadWorkflowsUseCase
  private readonly loadWorkflowRun: LoadWorkflowRunUseCase

  constructor(
    loadWorkflows: LoadWorkflowsUseCase,
    loadWorkflowRun: LoadWorkflowRunUseCase,
  ) {
    this.loadWorkflows = loadWorkflows
    this.loadWorkflowRun = loadWorkflowRun
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
    const listGen = this.observationEpoch
    this.observation?.cancel()
    const runId = this.state.runWorkflowId
    const runGen = runId === null ? null : this.nextRunGeneration()
    this.publish({
      ...this.state,
      load: { kind: 'loading' },
      ...(runId === null ? {} : { runContext: { kind: 'loading' as const } }),
    })
    this.observation = this.loadWorkflows.observe((load) =>
      this.applyLoad(load, listGen),
    )
    if (runId !== null && runGen !== null) this.observeRun(runId, runGen)
  }

  dispose(): void {
    this.disposed = true
    this.observationEpoch += 1
    this.runEpoch += 1
    this.observation?.cancel()
    this.runObservation?.cancel()
    this.observation = null
    this.runObservation = null
  }

  openRun(id: WorkflowId): void {
    const gen = this.nextRunGeneration()
    const drafts = {
      ...this.state.drafts,
      [id]: this.state.drafts[id] ?? emptyWorkflowRunDraft(),
    }
    this.publish({
      ...this.state,
      runWorkflowId: id,
      drafts,
      runContext: { kind: 'loading' },
    })
    this.observeRun(id, gen)
  }

  closeRun(): void {
    this.nextRunGeneration()
    this.runObservation = null
    this.publish({
      ...this.state,
      runWorkflowId: null,
      runContext: { kind: 'loading' },
    })
  }

  setTask(task: string): void {
    this.updateDraft((draft) => ({ ...draft, task, touched: true }))
  }

  setGoal(goal: string): void {
    this.updateDraft((draft) => ({ ...draft, goal, touched: true }))
  }

  setGoalOpen(goalOpen: boolean): void {
    this.updateDraft((draft) => ({ ...draft, goalOpen }))
  }

  selectRepository(id: RepositoryId): void {
    const ready = this.readyContext()
    if (!ready || !ready.repositories.some((item) => item.id === id)) return
    this.updateDraft((draft) => ({ ...draft, repositoryId: id, touched: true }))
  }

  selectOverride(id: WorkflowOverrideId): void {
    const ready = this.readyContext()
    const choice = ready?.overrides.find((item) => item.id === id)
    if (!choice?.available) return
    this.updateDraft((draft) => ({ ...draft, overrideId: id, touched: true }))
  }

  private readyContext() {
    return this.state.runContext.kind === 'ready'
      ? this.state.runContext.context
      : null
  }

  private updateDraft(change: (draft: WorkflowRunDraft) => WorkflowRunDraft): void {
    const id = this.state.runWorkflowId
    if (!id) return
    const current = this.state.drafts[id] ?? emptyWorkflowRunDraft()
    this.publish({
      ...this.state,
      drafts: { ...this.state.drafts, [id]: change(current) },
    })
  }

  private applyLoad(load: WorkflowsLoad, gen: number): void {
    if (this.disposed || gen !== this.observationEpoch) return
    this.publish({ ...this.state, load })
  }

  private nextRunGeneration(): number {
    this.runEpoch += 1
    this.runObservation?.cancel()
    return this.runEpoch
  }

  private observeRun(id: WorkflowId, gen: number): void {
    this.runObservation = this.loadWorkflowRun.observe(id, (load) =>
      this.applyRun(id, gen, load),
    )
  }

  private applyRun(
    id: WorkflowId,
    gen: number,
    load: WorkflowRunContextLoad,
  ): void {
    if (this.disposed || gen !== this.runEpoch || this.state.runWorkflowId !== id) {
      return
    }
    if (load.kind === 'ready' && load.context.workflowId !== id) return
    const current = this.state.drafts[id] ?? emptyWorkflowRunDraft()
    const draft =
      load.kind === 'ready' ? seedWorkflowRunDraft(current, load.context) : current
    this.publish({
      ...this.state,
      drafts: { ...this.state.drafts, [id]: draft },
      runContext: load,
    })
  }

  private publish(next: WorkflowsScreenState): void {
    if (this.disposed) return
    this.state = next
    for (const listener of this.listeners) listener(this.state)
  }
}
