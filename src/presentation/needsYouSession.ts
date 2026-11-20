import type {
  AnswerWorkflowAttentionCheckpointUseCase,
  LoadNeedsYouUseCase,
  RefreshTaskApprovalUseCase,
  RefreshWorkflowAttentionCheckpointUseCase,
  RespondTaskApprovalUseCase,
} from '../application'
import type {
  ApprovalDecision,
  NeedsYouLoad,
  ObservationHandle,
} from '../model'
import { isNeedsYouTaskApproval } from '../model'
import {
  EMPTY_NEEDS_YOU_CHROME,
  type NeedsYouSeedCheckpointStale,
  type NeedsYouSeedRefusal,
} from './needsYouChrome'
import { refusalEntry } from './taskApprovalChrome'
import { applyNeedsYouLoad } from './needsYouCommandApply'
import { NeedsYouCommands } from './needsYouCommands'
import { initialNeedsYouState, type NeedsYouScreenState } from './needsYouState'

export type NeedsYouListener = (state: NeedsYouScreenState) => void

export type NeedsYouApprovalSeed = {
  readonly refusals?: readonly NeedsYouSeedRefusal[]
  readonly checkpointStale?: NeedsYouSeedCheckpointStale
}

/**
 * Needs you observation plus approval / checkpoint commands. Leaving the
 * route clears settle-in-place chrome via `leave()`.
 */
export class NeedsYouSession {
  private state = initialNeedsYouState()
  private observationEpoch = 0
  private disposed = false
  private observation: ObservationHandle | null = null
  private readonly listeners = new Set<NeedsYouListener>()
  private readonly loadNeedsYou: LoadNeedsYouUseCase
  private readonly commands: NeedsYouCommands

  constructor(
    loadNeedsYou: LoadNeedsYouUseCase,
    respondApproval: RespondTaskApprovalUseCase,
    refreshApproval: RefreshTaskApprovalUseCase,
    answerCheckpoint: AnswerWorkflowAttentionCheckpointUseCase,
    refreshCheckpoint: RefreshWorkflowAttentionCheckpointUseCase,
  ) {
    this.loadNeedsYou = loadNeedsYou
    this.commands = new NeedsYouCommands(
      {
        isDisposed: () => this.disposed,
        getState: () => this.state,
        publish: (next) => this.publish(next),
      },
      respondApproval,
      refreshApproval,
      answerCheckpoint,
      refreshCheckpoint,
    )
  }

  subscribe(listener: NeedsYouListener): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getState(): NeedsYouScreenState {
    return this.state
  }

  start(): void {
    this.disposed = false
    this.observationEpoch += 1
    const gen = this.observationEpoch
    this.observation?.cancel()
    this.publish({
      ...initialNeedsYouState(),
      load: { kind: 'loading' },
    })
    this.observation = this.loadNeedsYou.observe((load) =>
      this.applyLoad(load, gen),
    )
  }

  /** Clear settle-in-place chrome when the person leaves Needs you. */
  leave(): void {
    if (this.disposed) return
    this.publish({
      ...this.state,
      chrome: EMPTY_NEEDS_YOU_CHROME,
      displayItems:
        this.state.load.kind === 'ready'
          ? this.state.load.observation.items
          : [],
      submittingKey: null,
    })
  }

  dispose(): void {
    this.disposed = true
    this.observationEpoch += 1
    this.observation?.cancel()
    this.observation = null
  }

  seedApprovalChrome(seed: NeedsYouApprovalSeed): void {
    if (this.disposed) return
    let chrome = this.state.chrome
    const refusals = seed.refusals ?? []
    if (refusals.length > 0) {
      const entries = refusals.map((entry) => {
        const item = this.state.displayItems.find(
          (row) =>
            isNeedsYouTaskApproval(row) && row.requestId === entry.requestId,
        )
        const revision =
          item !== undefined && isNeedsYouTaskApproval(item)
            ? item.ownerRevision
            : 0
        return refusalEntry(
          entry.taskId,
          entry.requestId,
          revision,
          entry.refusal,
        )
      })
      chrome = {
        ...chrome,
        taskApprovals: {
          entries,
          submitting: false,
          focusResultSeq: 0,
        },
      }
    }
    if (seed.checkpointStale !== undefined) {
      const { runId, attentionCheckpointId } = seed.checkpointStale
      chrome = {
        ...chrome,
        checkpoints: [
          ...chrome.checkpoints.filter(
            (e) =>
              !(
                e.runId === runId &&
                e.attentionCheckpointId === attentionCheckpointId
              ),
          ),
          {
            runId,
            attentionCheckpointId,
            entry: { kind: 'checkpoint_stale' },
          },
        ],
      }
    }
    this.publish({ ...this.state, chrome })
  }

  respondTaskApproval(itemId: string, decision: ApprovalDecision): void {
    this.commands.respondTaskApproval(itemId, decision)
  }

  refreshTaskApproval(itemId: string): void {
    this.commands.refreshTaskApproval(itemId)
  }

  answerCheckpoint(itemId: string, decision: ApprovalDecision): void {
    this.commands.answerCheckpoint(itemId, decision)
  }

  refreshCheckpoint(itemId: string): void {
    this.commands.refreshCheckpoint(itemId)
  }

  private applyLoad(load: NeedsYouLoad, gen: number): void {
    if (this.disposed || gen !== this.observationEpoch) return
    this.publish(applyNeedsYouLoad(this.state, load))
  }

  private publish(next: NeedsYouScreenState): void {
    if (this.disposed) return
    this.state = next
    for (const listener of this.listeners) listener(this.state)
  }
}
