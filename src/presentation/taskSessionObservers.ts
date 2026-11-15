import type {
  LoadTaskChangesUseCase,
  LoadTaskEventsUseCase,
} from '../application'
import type { ObservationHandle } from '../model'
import type { TaskScreenState } from './taskState'
import {
  beginPaneChangesObservation,
  type ChangesPaneHost,
} from './taskSessionPane'
import {
  beginPaneEventsObservation,
  type EventsPaneHost,
} from './taskSessionEvents'

export type PaneOwner = {
  isDisposed(): boolean
  getState(): TaskScreenState
  publish(next: TaskScreenState): void
  readonly loadTaskChanges: LoadTaskChangesUseCase
  readonly loadTaskEvents: LoadTaskEventsUseCase
}

/** Changes and Events pane observation handles, epochs, and host bindings. */
export class TaskPaneObservers implements ChangesPaneHost, EventsPaneHost {
  private changesGen = 0
  private eventsGen = 0
  private changesObservation: ObservationHandle | null = null
  private eventsObservation: ObservationHandle | null = null

  private readonly owner: PaneOwner

  constructor(owner: PaneOwner) {
    this.owner = owner
  }

  get loadTaskChanges(): LoadTaskChangesUseCase {
    return this.owner.loadTaskChanges
  }

  get loadTaskEvents(): LoadTaskEventsUseCase {
    return this.owner.loadTaskEvents
  }

  isDisposed(): boolean {
    return this.owner.isDisposed()
  }

  getState(): TaskScreenState {
    return this.owner.getState()
  }

  publish(next: TaskScreenState): void {
    this.owner.publish(next)
  }

  changesEpoch(): number {
    return this.changesGen
  }

  eventsEpoch(): number {
    return this.eventsGen
  }

  bumpChangesEpoch(): number {
    this.changesGen += 1
    return this.changesGen
  }

  bumpEventsEpoch(): number {
    this.eventsGen += 1
    return this.eventsGen
  }

  setChangesObservation(handle: ObservationHandle | null): void {
    this.changesObservation = handle
  }

  setEventsObservation(handle: ObservationHandle | null): void {
    this.eventsObservation = handle
  }

  hasChangesObservation(): boolean {
    return this.changesObservation !== null
  }

  beginChanges(): void {
    this.changesObservation?.cancel()
    beginPaneChangesObservation(this)
  }

  beginEvents(): void {
    this.eventsObservation?.cancel()
    beginPaneEventsObservation(this)
  }

  stopChanges(): void {
    this.changesGen += 1
    this.changesObservation?.cancel()
    this.changesObservation = null
  }

  stopEvents(): void {
    this.eventsGen += 1
    this.eventsObservation?.cancel()
    this.eventsObservation = null
  }

  dispose(): void {
    this.changesGen += 1
    this.eventsGen += 1
    this.changesObservation?.cancel()
    this.changesObservation = null
    this.eventsObservation?.cancel()
    this.eventsObservation = null
  }
}
