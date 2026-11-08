import type { LoadContextUseCase, StartTaskUseCase } from '../application'
import type {
  AccessLevel,
  Appearance,
  ContextLoad,
  HarnessId,
  ModelId,
  ObservationHandle,
  RepositoryId,
} from '../model'
import { reconcileSelections } from './reconcileSelections'
import { withNewTaskCanSubmit } from './newTaskCanSubmit'
import {
  initialScreenState,
  type NewTaskScreenState,
  type OpenMenu,
} from './screenState'
import { submitNewTask } from './presenterSubmission'
import type { ApprovalsMode, EffortLevel } from './taskOptions'

export type PresenterListener = (state: NewTaskScreenState) => void

type Deps = {
  readonly loadContext: LoadContextUseCase
  readonly startTask: StartTaskUseCase
}

export class PresenterSession {
  private state = initialScreenState()
  /** Lifetime of the active context observation; independent of submissions. */
  private observationEpoch = 0
  /** Identity of the in-flight start; independent of context observation. */
  private submissionEpoch = 0
  private disposed = false
  private observation: ObservationHandle | null = null
  private readonly listeners = new Set<PresenterListener>()
  private readonly deps: Deps

  constructor(deps: Deps) {
    this.deps = deps
  }

  subscribe(listener: PresenterListener): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getState(): NewTaskScreenState {
    return this.state
  }

  start(): void {
    // Re-arm after React StrictMode cleanup dispose(); late results still
    // require matching epochs.
    this.disposed = false
    this.observationEpoch += 1
    this.submissionEpoch += 1
    const observationGen = this.observationEpoch
    this.observation?.cancel()
    this.publish(this.withCanSubmit({ context: { kind: 'loading' } }))
    this.observation = this.deps.loadContext.observe((load) =>
      this.applyContext(load, observationGen),
    )
  }

  dispose(): void {
    this.disposed = true
    this.observationEpoch += 1
    this.submissionEpoch += 1
    this.observation?.cancel()
    this.observation = null
    // Keep React subscribers; StrictMode remounts reuse the same presenter.
  }

  setAppearance(appearance: Appearance): void {
    this.publish(this.withCanSubmit({ appearance }))
  }

  cycleAppearance(): void {
    const order: Appearance[] = ['system', 'light', 'dark']
    const i = order.indexOf(this.state.appearance)
    this.publish(
      this.withCanSubmit({
        appearance: order[(i + 1) % order.length] ?? 'system',
      }),
    )
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this.publish(
      this.withCanSubmit({
        sidebarCollapsed: collapsed,
        openMenu: null,
        optionsOpen: false,
      }),
    )
  }

  setPrompt(prompt: string): void {
    if (this.optionsLocked()) return
    const clearOutcome =
      this.state.submission.kind === 'accepted' ||
      this.state.submission.kind === 'refused'
    this.publish(
      this.withCanSubmit({
        prompt,
        ...(clearOutcome ? { submission: { kind: 'idle' as const } } : {}),
      }),
    )
  }

  setOpenMenu(menu: OpenMenu): void {
    if (this.optionsLocked() && menu !== null) return
    this.publish(
      this.withCanSubmit({
        openMenu: menu,
        optionsOpen: menu === null ? this.state.optionsOpen : false,
      }),
    )
  }

  setOptionsOpen(open: boolean): void {
    if (this.optionsLocked() && open) return
    this.publish(
      this.withCanSubmit({
        optionsOpen: open,
        openMenu: open ? null : this.state.openMenu,
      }),
    )
  }

  setEffort(effort: EffortLevel): void {
    if (!this.optionsLocked()) this.publish(this.withCanSubmit({ effort }))
  }

  setTurns(turns: string): void {
    if (!this.optionsLocked()) this.publish(this.withCanSubmit({ turns }))
  }

  setApprovals(approvals: ApprovalsMode): void {
    if (!this.optionsLocked()) this.publish(this.withCanSubmit({ approvals }))
  }

  selectRepository(id: RepositoryId): void {
    if (this.optionsLocked()) return
    this.publish(this.withCanSubmit({ selectedRepositoryId: id, openMenu: null }))
  }

  selectHarness(id: HarnessId): void {
    if (this.optionsLocked() || this.state.context.kind !== 'ready') return
    const harness = this.state.context.composer.harnesses.find((h) => h.id === id)
    if (!harness || !harness.available) return
    const modelId = harness.defaultModelId ?? harness.models[0]?.id ?? null
    const accessOk = harness.accessLevels.includes(this.state.selectedAccess)
    this.publish(
      this.withCanSubmit({
        selectedHarnessId: id,
        selectedModelId: modelId,
        selectedAccess: accessOk
          ? this.state.selectedAccess
          : (harness.accessLevels[0] ?? 'read_only'),
      }),
    )
  }

  selectModel(id: ModelId): void {
    if (this.optionsLocked()) return
    this.publish(
      this.withCanSubmit({
        selectedModelId: id,
        openMenu: null,
      }),
    )
  }

  selectAccess(access: AccessLevel): void {
    if (this.optionsLocked() || this.state.context.kind !== 'ready') return
    const harness = this.state.context.composer.harnesses.find(
      (h) => h.id === this.state.selectedHarnessId,
    )
    if (harness && !harness.accessLevels.includes(access)) return
    const opt = this.state.context.composer.accessOptions.find((a) => a.id === access)
    if (!opt?.available) return
    this.publish(this.withCanSubmit({ selectedAccess: access, openMenu: null }))
  }

  submit(): void {
    submitNewTask(
      {
        isDisposed: () => this.disposed,
        getState: () => this.state,
        getSubmissionEpoch: () => this.submissionEpoch,
        setSubmissionEpoch: (value) => {
          this.submissionEpoch = value
        },
        publishPartial: (partial) => this.publish(this.withCanSubmit(partial)),
      },
      this.deps.startTask,
    )
  }

  private applyContext(load: ContextLoad, gen: number): void {
    if (this.disposed || gen !== this.observationEpoch) return
    if (load.kind !== 'ready') {
      this.publish(this.withCanSubmit({ context: load }))
      return
    }
    const selections = reconcileSelections(load.composer, {
      selectedRepositoryId: this.state.selectedRepositoryId,
      selectedHarnessId: this.state.selectedHarnessId,
      selectedModelId: this.state.selectedModelId,
      selectedAccess: this.state.selectedAccess,
    })
    this.publish(
      this.withCanSubmit({
        context: load,
        ...selections,
      }),
    )
  }

  private optionsLocked(): boolean {
    return (
      this.state.submission.kind === 'pending' ||
      this.state.submission.kind === 'unknown'
    )
  }

  private withCanSubmit(partial: Partial<NewTaskScreenState>): NewTaskScreenState {
    return withNewTaskCanSubmit(this.state, partial)
  }

  private publish(next: NewTaskScreenState): void {
    if (this.disposed) return
    this.state = next
    for (const listener of this.listeners) listener(this.state)
  }
}
