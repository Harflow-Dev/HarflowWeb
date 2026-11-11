import type { LoadSettingsGeneralUseCase } from '../application'
import type { SettingsGeneralLoad, ObservationHandle } from '../model'
import {
  initialSettingsGeneralState,
  type SettingsGeneralScreenState,
} from './settingsGeneralState'

export type SettingsGeneralListener = (state: SettingsGeneralScreenState) => void

/**
 * Read-only Settings General observation. Replacement and disposal bump the epoch
 * so a captured callback cannot restore a previous ready observation.
 */
export class SettingsGeneralSession {
  private state = initialSettingsGeneralState()
  private observationEpoch = 0
  private disposed = false
  private observation: ObservationHandle | null = null
  private readonly listeners = new Set<SettingsGeneralListener>()
  private readonly loadSettingsGeneral: LoadSettingsGeneralUseCase

  constructor(loadSettingsGeneral: LoadSettingsGeneralUseCase) {
    this.loadSettingsGeneral = loadSettingsGeneral
  }

  subscribe(listener: SettingsGeneralListener): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getState(): SettingsGeneralScreenState {
    return this.state
  }

  start(): void {
    this.disposed = false
    this.observationEpoch += 1
    const gen = this.observationEpoch
    this.observation?.cancel()
    this.publish({ load: { kind: 'loading' } })
    this.observation = this.loadSettingsGeneral.observe((load) =>
      this.applyLoad(load, gen),
    )
  }

  dispose(): void {
    this.disposed = true
    this.observationEpoch += 1
    this.observation?.cancel()
    this.observation = null
  }

  private applyLoad(load: SettingsGeneralLoad, gen: number): void {
    if (this.disposed || gen !== this.observationEpoch) return
    this.publish({ load })
  }

  private publish(next: SettingsGeneralScreenState): void {
    if (this.disposed) return
    this.state = next
    for (const listener of this.listeners) listener(this.state)
  }
}
