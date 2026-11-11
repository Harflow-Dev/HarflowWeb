import type { LoadHarnessesUseCase } from '../application'
import type { HarnessesLoad, ObservationHandle } from '../model'
import {
  initialHarnessesState,
  type HarnessesScreenState,
} from './harnessesState'

export type HarnessesListener = (state: HarnessesScreenState) => void

/**
 * Read-only harness observation. Replacement and disposal bump the epoch
 * so a captured callback cannot restore a previous ready observation.
 */
export class HarnessesSession {
  private state = initialHarnessesState()
  private observationEpoch = 0
  private disposed = false
  private observation: ObservationHandle | null = null
  private readonly listeners = new Set<HarnessesListener>()
  private readonly loadHarnesses: LoadHarnessesUseCase

  constructor(loadHarnesses: LoadHarnessesUseCase) {
    this.loadHarnesses = loadHarnesses
  }

  subscribe(listener: HarnessesListener): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getState(): HarnessesScreenState {
    return this.state
  }

  start(): void {
    this.disposed = false
    this.observationEpoch += 1
    const gen = this.observationEpoch
    this.observation?.cancel()
    this.publish({ ...this.state, load: { kind: 'loading' } })
    this.observation = this.loadHarnesses.observe((load) =>
      this.applyLoad(load, gen),
    )
  }

  dispose(): void {
    this.disposed = true
    this.observationEpoch += 1
    this.observation?.cancel()
    this.observation = null
  }

  /** Expand one harness's MCP approvals, or collapse with null. */
  setExpandedId(id: string | null): void {
    if (this.disposed || id === this.state.expandedId) return
    this.publish({ ...this.state, expandedId: id })
  }

  private applyLoad(load: HarnessesLoad, gen: number): void {
    if (this.disposed || gen !== this.observationEpoch) return
    this.publish({ load, expandedId: this.reconcileExpanded(load) })
  }

  /** A ready observation that does not list the expanded harness collapses it. */
  private reconcileExpanded(load: HarnessesLoad): string | null {
    const id = this.state.expandedId
    if (id === null || load.kind !== 'ready') return id
    const listed = load.observation.harnesses.some((row) => row.id === id)
    return listed ? id : null
  }

  private publish(next: HarnessesScreenState): void {
    if (this.disposed) return
    this.state = next
    for (const listener of this.listeners) listener(this.state)
  }
}
