import type { LoadMessagingCapabilityUseCase } from '../application'
import type { MessagingCapabilityLoad, ObservationHandle } from '../model'

/**
 * Engine-level `messaging.v1` observation for the task session. Rejects
 * callbacks from a superseded or stopped observation.
 */
export class MessagingCapabilityWatch {
  private epoch = 0
  private handle: ObservationHandle | null = null

  private readonly source: LoadMessagingCapabilityUseCase
  private readonly apply: (load: MessagingCapabilityLoad) => void

  constructor(
    source: LoadMessagingCapabilityUseCase,
    apply: (load: MessagingCapabilityLoad) => void,
  ) {
    this.source = source
    this.apply = apply
  }

  start(): void {
    this.stop()
    const gen = this.epoch
    this.handle = this.source.observe((load) => {
      if (gen === this.epoch) this.apply(load)
    })
  }

  stop(): void {
    this.epoch += 1
    this.handle?.cancel()
    this.handle = null
  }
}
