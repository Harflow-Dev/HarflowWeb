import type { LoadStatisticsUseCase } from '../application'
import type {
  ObservationHandle,
  StatisticsLoad,
  StatisticsRangeId,
} from '../model'
import { sanitizeStatisticsLoad } from './sanitizeStatistics'
import {
  initialStatisticsState,
  type StatisticsScreenState,
} from './statisticsState'

export type StatisticsListener = (state: StatisticsScreenState) => void

/**
 * Owns statistics range selection and observation lifetime.
 * Range changes cancel the prior observation; late old-range callbacks are ignored.
 * Selection survives navigation because AppSession keeps this child alive.
 */
export class StatisticsSession {
  private state = initialStatisticsState()
  private observationEpoch = 0
  private disposed = false
  private observation: ObservationHandle | null = null
  private readonly listeners = new Set<StatisticsListener>()
  private readonly loadStatistics: LoadStatisticsUseCase

  constructor(loadStatistics: LoadStatisticsUseCase) {
    this.loadStatistics = loadStatistics
  }

  subscribe(listener: StatisticsListener): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getState(): StatisticsScreenState {
    return this.state
  }

  start(): void {
    this.disposed = false
    this.beginObservation(this.state.selectedRange)
  }

  dispose(): void {
    this.disposed = true
    this.observationEpoch += 1
    this.observation?.cancel()
    this.observation = null
  }

  selectRange(range: StatisticsRangeId): void {
    if (this.disposed || range === this.state.selectedRange) return
    this.beginObservation(range)
  }

  private beginObservation(range: StatisticsRangeId): void {
    this.observationEpoch += 1
    const gen = this.observationEpoch
    this.observation?.cancel()
    this.observation = null
    // Drop prior numbers immediately so a new range label never keeps stale totals.
    this.publish({ selectedRange: range, load: { kind: 'loading' } })
    this.observation = this.loadStatistics.observe(range, (load) =>
      this.applyLoad(load, gen, range),
    )
  }

  private applyLoad(
    load: StatisticsLoad,
    gen: number,
    expectedRange: StatisticsRangeId,
  ): void {
    if (this.disposed || gen !== this.observationEpoch) return
    if (expectedRange !== this.state.selectedRange) return
    if (load.kind === 'ready' && load.observation.range !== expectedRange) {
      return
    }
    this.publish({
      selectedRange: this.state.selectedRange,
      load: sanitizeStatisticsLoad(load),
    })
  }

  private publish(next: StatisticsScreenState): void {
    if (this.disposed) return
    this.state = next
    for (const listener of this.listeners) listener(this.state)
  }
}
