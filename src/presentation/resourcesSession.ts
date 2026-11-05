import type { LoadResourcesUseCase } from '../application'
import type { ObservationHandle, ResourcesLoad } from '../model'
import {
  initialResourcesState,
  type ResourcesScreenState,
} from './resourcesState'

export type ResourcesListener = (state: ResourcesScreenState) => void

export class ResourcesSession {
  private state = initialResourcesState()
  private observationEpoch = 0
  private disposed = false
  private observation: ObservationHandle | null = null
  private readonly listeners = new Set<ResourcesListener>()
  private readonly loadResources: LoadResourcesUseCase

  constructor(loadResources: LoadResourcesUseCase) {
    this.loadResources = loadResources
  }

  subscribe(listener: ResourcesListener): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getState(): ResourcesScreenState {
    return this.state
  }

  start(): void {
    this.disposed = false
    this.observationEpoch += 1
    const gen = this.observationEpoch
    this.observation?.cancel()
    this.publish({ load: { kind: 'loading' } })
    this.observation = this.loadResources.observe((load) =>
      this.applyLoad(load, gen),
    )
  }

  dispose(): void {
    this.disposed = true
    this.observationEpoch += 1
    this.observation?.cancel()
    this.observation = null
  }

  private applyLoad(load: ResourcesLoad, gen: number): void {
    if (this.disposed || gen !== this.observationEpoch) return
    this.publish({ load })
  }

  private publish(next: ResourcesScreenState): void {
    if (this.disposed) return
    this.state = next
    for (const listener of this.listeners) listener(this.state)
  }
}
