import type { LoadParallelGroupUseCase } from '../application'
import {
  PARALLEL_GROUP_UNAVAILABLE,
  type ObservationHandle,
  type ParallelGroupId,
  type ParallelGroupLoad,
} from '../model'
import { parallelGroupTopBar } from './parallelGroupChrome'
import {
  initialParallelGroupState,
  type ParallelGroupQueuedOutcome,
  type ParallelGroupScreenState,
} from './parallelGroupState'

export type ParallelGroupListener = (state: ParallelGroupScreenState) => void

export type ParallelGroupChrome = {
  readonly showPrompt?: boolean
  readonly openMenuLaneId?: string | null
  readonly cancelAllConfirm?: boolean
  readonly queuedCancelOutcome?: ParallelGroupQueuedOutcome | null
}

/**
 * Parallel group observation plus local chrome (prompt, menu, confirm).
 * A callback applies only for the open group id and observation generation.
 */
export class ParallelGroupSession {
  private state = initialParallelGroupState()
  private epoch = 0
  private disposed = false
  private observation: ObservationHandle | null = null
  private readonly listeners = new Set<ParallelGroupListener>()
  private readonly loadGroup: LoadParallelGroupUseCase

  constructor(loadGroup: LoadParallelGroupUseCase) {
    this.loadGroup = loadGroup
  }

  subscribe(listener: ParallelGroupListener): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getState(): ParallelGroupScreenState {
    return this.state
  }

  start(): void {
    this.disposed = false
    const id = this.state.groupId
    if (id === null) return
    this.begin(id)
  }

  dispose(): void {
    this.disposed = true
    this.epoch += 1
    this.observation?.cancel()
    this.observation = null
  }

  open(id: ParallelGroupId): void {
    this.epoch += 1
    const gen = this.epoch
    this.observation?.cancel()
    this.publish({
      groupId: id,
      load: { kind: 'loading', memberCount: null },
      showPrompt: false,
      openMenuLaneId: null,
      cancelAllConfirm: false,
      queuedCancelOutcome: null,
    })
    this.watch(id, gen)
  }

  close(): void {
    this.epoch += 1
    this.observation?.cancel()
    this.observation = null
    this.publish({
      groupId: null,
      load: { kind: 'loading', memberCount: null },
      showPrompt: false,
      openMenuLaneId: null,
      cancelAllConfirm: false,
      queuedCancelOutcome: null,
    })
  }

  setShowPrompt(show: boolean): void {
    if (this.state.showPrompt === show) return
    this.publish({
      ...this.state,
      showPrompt: show,
      openMenuLaneId: null,
    })
  }

  setOpenMenuLaneId(laneId: string | null): void {
    if (this.state.openMenuLaneId === laneId) return
    this.publish({
      ...this.state,
      openMenuLaneId: laneId,
      cancelAllConfirm: laneId !== null ? false : this.state.cancelAllConfirm,
    })
  }

  setCancelAllConfirm(open: boolean): void {
    if (this.state.cancelAllConfirm === open) return
    this.publish({
      ...this.state,
      cancelAllConfirm: open,
      openMenuLaneId: open ? null : this.state.openMenuLaneId,
    })
  }

  applyChrome(chrome: ParallelGroupChrome): void {
    this.publish({
      ...this.state,
      showPrompt: chrome.showPrompt ?? this.state.showPrompt,
      openMenuLaneId:
        chrome.openMenuLaneId !== undefined
          ? chrome.openMenuLaneId
          : this.state.openMenuLaneId,
      cancelAllConfirm:
        chrome.cancelAllConfirm ?? this.state.cancelAllConfirm,
      queuedCancelOutcome:
        chrome.queuedCancelOutcome !== undefined
          ? chrome.queuedCancelOutcome
          : this.state.queuedCancelOutcome,
    })
  }

  private begin(id: ParallelGroupId): void {
    this.epoch += 1
    const gen = this.epoch
    this.observation?.cancel()
    this.publish({
      ...this.state,
      load: { kind: 'loading', memberCount: null },
    })
    this.watch(id, gen)
  }

  private watch(id: ParallelGroupId, gen: number): void {
    this.observation = this.loadGroup.observe(id, (load) =>
      this.apply(id, gen, load),
    )
  }

  private apply(
    id: ParallelGroupId,
    gen: number,
    load: ParallelGroupLoad,
  ): void {
    if (this.disposed || gen !== this.epoch || this.state.groupId !== id) return
    if (load.kind === 'ready' && load.group.groupId !== id) {
      this.publish({
        ...this.state,
        groupId: id,
        load: {
          kind: 'unavailable',
          message: PARALLEL_GROUP_UNAVAILABLE,
        },
      })
      return
    }
    // The dialog only makes sense while a lane runs; do not let it reopen later.
    const cancellable =
      load.kind === 'ready' && parallelGroupTopBar(load.group).showCancelAll
    this.publish({
      ...this.state,
      groupId: id,
      load,
      cancelAllConfirm: load.kind === 'loading' || cancellable
        ? this.state.cancelAllConfirm
        : false,
    })
  }

  private publish(next: ParallelGroupScreenState): void {
    this.state = next
    for (const listener of this.listeners) listener(this.state)
  }
}
