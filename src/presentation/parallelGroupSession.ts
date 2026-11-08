import type { LoadParallelGroupUseCase } from '../application'
import {
  PARALLEL_GROUP_UNAVAILABLE,
  type ObservationHandle,
  type ParallelGroupId,
  type ParallelGroupLoad,
} from '../model'
import {
  initialParallelGroupState,
  type ParallelGroupScreenState,
} from './parallelGroupState'

export type ParallelGroupListener = (state: ParallelGroupScreenState) => void

/**
 * Read-only Parallel group observation.
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
      load: { kind: 'loading' },
    })
    this.watch(id, gen)
  }

  close(): void {
    this.epoch += 1
    this.observation?.cancel()
    this.observation = null
    this.publish({
      groupId: null,
      load: { kind: 'loading' },
    })
  }

  private begin(id: ParallelGroupId): void {
    this.epoch += 1
    const gen = this.epoch
    this.observation?.cancel()
    this.publish({ ...this.state, load: { kind: 'loading' } })
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
        groupId: id,
        load: {
          kind: 'unavailable',
          message: PARALLEL_GROUP_UNAVAILABLE,
        },
      })
      return
    }
    this.publish({
      groupId: id,
      load,
    })
  }

  private publish(next: ParallelGroupScreenState): void {
    this.state = next
    for (const listener of this.listeners) listener(this.state)
  }
}
