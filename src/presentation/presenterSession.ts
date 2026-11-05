import type { LoadContextUseCase, StartTaskUseCase } from '../application'
import {
  isSubmittablePrompt,
  type AccessLevel,
  type Appearance,
  type ContextLoad,
  type HarnessId,
  type ModelId,
  type ObservationHandle,
  type RepositoryId,
  type StartTaskOutcome,
  type TaskId,
} from '../model'
import {
  reconcileSelections,
  selectionsAreSubmittable,
} from './reconcileSelections'
import {
  initialScreenState,
  type NewTaskScreenState,
  type OpenMenu,
} from './screenState'

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
    this.publish(this.withCanSubmit({ sidebarCollapsed: collapsed, openMenu: null }))
  }

  setPrompt(prompt: string): void {
    this.publish(this.withCanSubmit({ prompt }))
  }

  setOpenMenu(menu: OpenMenu): void {
    // Design specimen shows harness list + models for the current selection.
    const harnessMenuPhase =
      menu === 'harness' && this.state.selectedHarnessId !== null
        ? 'model'
        : menu === 'harness'
          ? 'harness'
          : this.state.harnessMenuPhase
    this.publish(this.withCanSubmit({ openMenu: menu, harnessMenuPhase }))
  }

  selectRepository(id: RepositoryId): void {
    this.publish(this.withCanSubmit({ selectedRepositoryId: id, openMenu: null }))
  }

  selectHarness(id: HarnessId): void {
    if (this.state.context.kind !== 'ready') return
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
        harnessMenuPhase: 'model',
      }),
    )
  }

  selectModel(id: ModelId): void {
    this.publish(
      this.withCanSubmit({
        selectedModelId: id,
        openMenu: null,
        harnessMenuPhase: 'harness',
      }),
    )
  }

  selectAccess(access: AccessLevel): void {
    if (this.state.context.kind !== 'ready') return
    const harness = this.state.context.composer.harnesses.find(
      (h) => h.id === this.state.selectedHarnessId,
    )
    if (harness && !harness.accessLevels.includes(access)) return
    const opt = this.state.context.composer.accessOptions.find((a) => a.id === access)
    if (!opt?.available) return
    this.publish(this.withCanSubmit({ selectedAccess: access, openMenu: null }))
  }

  submit(): void {
    if (this.disposed || !this.state.canSubmit || this.state.submission.kind === 'pending') {
      return
    }
    const repositoryId = this.state.selectedRepositoryId
    const harnessId = this.state.selectedHarnessId
    const modelId = this.state.selectedModelId
    if (repositoryId === null || harnessId === null || modelId === null) return
    const request = {
      prompt: this.state.prompt,
      repositoryId,
      harnessId,
      modelId,
      access: this.state.selectedAccess,
    }
    this.submissionEpoch += 1
    const submissionGen = this.submissionEpoch
    this.publish(this.withCanSubmit({ submission: { kind: 'pending' }, openMenu: null }))
    void this.deps.startTask.execute(request).then((outcome) => {
      this.applySubmission(outcome, submissionGen)
    })
  }

  private applySubmission(outcome: StartTaskOutcome, gen: number): void {
    if (this.disposed || gen !== this.submissionEpoch) return
    if (outcome.kind === 'accepted') {
      const taskId: TaskId = outcome.taskId
      this.publish(
        this.withCanSubmit({
          submission: { kind: 'accepted', taskId },
          prompt: '',
        }),
      )
      return
    }
    if (outcome.kind === 'refused') {
      this.publish(
        this.withCanSubmit({
          submission: {
            kind: 'refused',
            code: outcome.code,
            reason: outcome.reason,
          },
        }),
      )
      return
    }
    this.publish(
      this.withCanSubmit({
        submission: { kind: 'unknown', message: outcome.message },
      }),
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

  private withCanSubmit(partial: Partial<NewTaskScreenState>): NewTaskScreenState {
    const merged = { ...this.state, ...partial }
    const pending = merged.submission.kind === 'pending'
    const context = merged.context
    const validSelections =
      context.kind === 'ready' &&
      selectionsAreSubmittable(context.composer, {
        selectedRepositoryId: merged.selectedRepositoryId,
        selectedHarnessId: merged.selectedHarnessId,
        selectedModelId: merged.selectedModelId,
        selectedAccess: merged.selectedAccess,
      })
    return {
      ...merged,
      canSubmit:
        !pending &&
        isSubmittablePrompt(merged.prompt) &&
        context.kind === 'ready' &&
        validSelections,
    }
  }

  private publish(next: NewTaskScreenState): void {
    if (this.disposed) return
    this.state = next
    for (const listener of this.listeners) listener(this.state)
  }
}
