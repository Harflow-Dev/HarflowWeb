import type {
  LoadPendingLaunchCapabilityUseCase,
  LoadPendingLaunchInventoryUseCase,
  LoadPendingLaunchStatusUseCase,
} from '../application'
import type {
  ObservationHandle,
  PendingLaunchCapabilityLoad,
  PendingLaunchId,
  PendingLaunchInventoryLoad,
  PendingLaunchStatusLoad,
} from '../model'
import {
  initialPendingLaunchesState,
  type PendingLaunchesScreenState,
} from './pendingLaunchesState'

export type PendingLaunchesListener = (
  state: PendingLaunchesScreenState,
) => void

/**
 * Pending-launch capability, inventory, and per-ID status.
 * Leaving the route or selecting another ID cancels the prior status watch.
 * Reopening clears Stop-confirm chrome.
 */
export class PendingLaunchesSession {
  private state = initialPendingLaunchesState()
  private disposed = false
  private capabilityEpoch = 0
  private inventoryEpoch = 0
  private statusEpoch = 0
  private capabilityObs: ObservationHandle | null = null
  private inventoryObs: ObservationHandle | null = null
  private statusObs: ObservationHandle | null = null
  private inventoryActive = false
  private readonly listeners = new Set<PendingLaunchesListener>()
  private readonly loadCapability: LoadPendingLaunchCapabilityUseCase
  private readonly loadInventory: LoadPendingLaunchInventoryUseCase
  private readonly loadStatus: LoadPendingLaunchStatusUseCase

  constructor(
    loadCapability: LoadPendingLaunchCapabilityUseCase,
    loadInventory: LoadPendingLaunchInventoryUseCase,
    loadStatus: LoadPendingLaunchStatusUseCase,
  ) {
    this.loadCapability = loadCapability
    this.loadInventory = loadInventory
    this.loadStatus = loadStatus
  }

  subscribe(listener: PendingLaunchesListener): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getState(): PendingLaunchesScreenState {
    return this.state
  }

  start(): void {
    this.disposed = false
    this.watchCapability()
  }

  dispose(): void {
    this.disposed = true
    this.capabilityEpoch += 1
    this.inventoryEpoch += 1
    this.statusEpoch += 1
    this.capabilityObs?.cancel()
    this.inventoryObs?.cancel()
    this.statusObs?.cancel()
    this.capabilityObs = null
    this.inventoryObs = null
    this.statusObs = null
    this.inventoryActive = false
  }

  /** Enter the inventory (route open). Resets detail chrome. */
  openInventory(): void {
    this.statusEpoch += 1
    this.statusObs?.cancel()
    this.statusObs = null
    this.publish({
      ...this.state,
      selectedLaunchId: null,
      status: { kind: 'loading' },
      stopConfirm: false,
    })
    this.ensureInventory()
  }

  /** Leave the pending-launches route: cancel inventory and status. */
  close(): void {
    this.inventoryEpoch += 1
    this.statusEpoch += 1
    this.inventoryObs?.cancel()
    this.statusObs?.cancel()
    this.inventoryObs = null
    this.statusObs = null
    this.inventoryActive = false
    this.publish({
      ...this.state,
      selectedLaunchId: null,
      inventory: { kind: 'loading' },
      status: { kind: 'loading' },
      stopConfirm: false,
    })
  }

  openLaunch(id: PendingLaunchId): void {
    this.statusEpoch += 1
    const gen = this.statusEpoch
    this.statusObs?.cancel()
    this.publish({
      ...this.state,
      selectedLaunchId: id,
      status: { kind: 'loading' },
      stopConfirm: false,
    })
    this.ensureInventory()
    this.statusObs = this.loadStatus.observe(id, (load) =>
      this.applyStatus(id, gen, load),
    )
  }

  setStopConfirm(open: boolean): void {
    if (this.state.stopConfirm === open) return
    this.publish({ ...this.state, stopConfirm: open })
  }

  private watchCapability(): void {
    this.capabilityEpoch += 1
    const gen = this.capabilityEpoch
    this.capabilityObs?.cancel()
    this.capabilityObs = this.loadCapability.observe((load) =>
      this.applyCapability(gen, load),
    )
  }

  private ensureInventory(): void {
    if (this.inventoryActive) return
    this.inventoryActive = true
    this.inventoryEpoch += 1
    const gen = this.inventoryEpoch
    this.inventoryObs?.cancel()
    this.publish({ ...this.state, inventory: { kind: 'loading' } })
    this.inventoryObs = this.loadInventory.observe((load) =>
      this.applyInventory(gen, load),
    )
  }

  private applyCapability(
    gen: number,
    load: PendingLaunchCapabilityLoad,
  ): void {
    if (this.disposed || gen !== this.capabilityEpoch) return
    this.publish({ ...this.state, capability: load })
  }

  private applyInventory(
    gen: number,
    load: PendingLaunchInventoryLoad,
  ): void {
    if (this.disposed || gen !== this.inventoryEpoch) return
    this.publish({ ...this.state, inventory: load })
  }

  private applyStatus(
    id: PendingLaunchId,
    gen: number,
    load: PendingLaunchStatusLoad,
  ): void {
    if (
      this.disposed ||
      gen !== this.statusEpoch ||
      this.state.selectedLaunchId !== id
    ) {
      return
    }
    this.publish({ ...this.state, status: load })
  }

  private publish(next: PendingLaunchesScreenState): void {
    this.state = next
    for (const listener of this.listeners) listener(this.state)
  }
}
