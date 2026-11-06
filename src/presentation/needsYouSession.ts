import type { LoadNeedsYouUseCase } from '../application'
import type { NeedsYouLoad, ObservationHandle } from '../model'
import { initialNeedsYouState, type NeedsYouScreenState } from './needsYouState'

export type NeedsYouListener = (state: NeedsYouScreenState) => void

/**
 * Read-only Needs you observation. Replacement and disposal bump the epoch
 * so a captured callback cannot restore a previous ready or empty claim.
 */
export class NeedsYouSession {
  private state = initialNeedsYouState()
  private observationEpoch = 0
  private disposed = false
  private observation: ObservationHandle | null = null
  private readonly listeners = new Set<NeedsYouListener>()
  private readonly loadNeedsYou: LoadNeedsYouUseCase

  constructor(loadNeedsYou: LoadNeedsYouUseCase) {
    this.loadNeedsYou = loadNeedsYou
  }

  subscribe(listener: NeedsYouListener): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getState(): NeedsYouScreenState {
    return this.state
  }

  start(): void {
    this.disposed = false
    this.observationEpoch += 1
    const gen = this.observationEpoch
    this.observation?.cancel()
    this.publish({ load: { kind: 'loading' } })
    this.observation = this.loadNeedsYou.observe((load) =>
      this.applyLoad(load, gen),
    )
  }

  dispose(): void {
    this.disposed = true
    this.observationEpoch += 1
    this.observation?.cancel()
    this.observation = null
  }

  private applyLoad(load: NeedsYouLoad, gen: number): void {
    if (this.disposed || gen !== this.observationEpoch) return
    this.publish({ load })
  }

  private publish(next: NeedsYouScreenState): void {
    if (this.disposed) return
    this.state = next
    for (const listener of this.listeners) listener(this.state)
  }
}
