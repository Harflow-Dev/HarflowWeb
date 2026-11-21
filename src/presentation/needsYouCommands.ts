/**
 * Respond / refresh for Needs you task approvals and workflow checkpoints.
 * Task in-flight keys live on the shared TaskApprovalRegistry.
 */
import type {
  AnswerWorkflowAttentionCheckpointUseCase,
  RefreshTaskApprovalUseCase,
  RefreshWorkflowAttentionCheckpointUseCase,
  RespondTaskApprovalUseCase,
} from '../application'
import type { ApprovalDecision } from '../model'
import {
  isNeedsYouTaskApproval,
  isNeedsYouWorkflowApproval,
} from '../model'
import {
  applyCheckpointAnswer,
  applyCheckpointRefresh,
  applyTaskRefresh,
  applyTaskRespond,
} from './needsYouCommandApply'
import type { CheckpointAnswerRegistry } from './needsYouCheckpointRegistry'
import type { NeedsYouScreenState } from './needsYouState'
import type { TaskApprovalRegistry } from './taskApprovalRegistry'

export type NeedsYouCommandHost = {
  isDisposed(): boolean
  getState(): NeedsYouScreenState
  publish(next: NeedsYouScreenState): void
}

function findDisplayItem(
  state: NeedsYouScreenState,
  itemId: string,
): import('../model').NeedsYouItem | null {
  return state.displayItems.find((item) => item.id === itemId) ?? null
}

/**
 * Needs you approval commands. Task answers reuse the shared registry and
 * task approval use cases; workflow checkpoints use attention-checkpoint
 * use cases with the checkpoint answer registry.
 */
export class NeedsYouCommands {
  private readonly host: NeedsYouCommandHost
  private readonly registry: TaskApprovalRegistry
  private readonly checkpoints: CheckpointAnswerRegistry
  private readonly respondApproval: RespondTaskApprovalUseCase
  private readonly refreshApproval: RefreshTaskApprovalUseCase
  private readonly answerCheckpointUseCase: AnswerWorkflowAttentionCheckpointUseCase
  private readonly refreshCheckpointUseCase: RefreshWorkflowAttentionCheckpointUseCase

  constructor(
    host: NeedsYouCommandHost,
    registry: TaskApprovalRegistry,
    checkpoints: CheckpointAnswerRegistry,
    respondApproval: RespondTaskApprovalUseCase,
    refreshApproval: RefreshTaskApprovalUseCase,
    answerCheckpoint: AnswerWorkflowAttentionCheckpointUseCase,
    refreshCheckpoint: RefreshWorkflowAttentionCheckpointUseCase,
  ) {
    this.host = host
    this.registry = registry
    this.checkpoints = checkpoints
    this.respondApproval = respondApproval
    this.refreshApproval = refreshApproval
    this.answerCheckpointUseCase = answerCheckpoint
    this.refreshCheckpointUseCase = refreshCheckpoint
  }

  respondTaskApproval(itemId: string, decision: ApprovalDecision): void {
    const state = this.host.getState()
    const item = findDisplayItem(state, itemId)
    if (item === null || !isNeedsYouTaskApproval(item)) return
    const taskId = item.context.taskId
    if (taskId === null) return
    if (!this.registry.beginRespond(taskId, item.requestId)) return
    // Republish so the snapshot re-derives the card's submitting flag.
    this.host.publish({ ...state })
    void this.respondApproval
      .execute({
        taskId,
        requestId: item.requestId,
        decision,
        ownerRevision: item.ownerRevision,
        actionDigest: item.request.actionDigest,
      })
      .then((outcome) => {
        this.registry.endRespond(taskId, item.requestId)
        if (this.host.isDisposed()) return
        this.host.publish(
          applyTaskRespond(
            this.host.getState(),
            this.registry,
            item,
            taskId,
            decision,
            outcome,
          ),
        )
      })
  }

  refreshTaskApproval(itemId: string): void {
    const state = this.host.getState()
    const item = findDisplayItem(state, itemId)
    if (item === null || !isNeedsYouTaskApproval(item)) return
    const taskId = item.context.taskId
    if (taskId === null) return
    if (this.registry.isInFlight(taskId, item.requestId)) return
    const started = this.registry.respondGeneration()
    void this.refreshApproval.execute(taskId, item.requestId).then((result) => {
      if (
        this.host.isDisposed() ||
        started !== this.registry.respondGeneration()
      ) {
        return
      }
      const current = this.host.getState()
      this.host.publish(
        applyTaskRefresh(current, this.registry, item, taskId, result),
      )
    })
  }

  answerCheckpoint(itemId: string, decision: ApprovalDecision): void {
    const state = this.host.getState()
    const item = findDisplayItem(state, itemId)
    if (item === null || !isNeedsYouWorkflowApproval(item)) return
    const runId = item.context.runId
    if (runId === null) return
    const token = item.attentionCheckpointId
    if (!this.checkpoints.beginAnswer(runId, token)) return
    this.host.publish({ ...state })
    void this.answerCheckpointUseCase
      .execute({
        workflowRunId: runId,
        attentionCheckpointId: token,
        decision,
      })
      .then((outcome) => {
        this.checkpoints.endAnswer(runId, token)
        if (this.host.isDisposed()) return
        this.host.publish(
          applyCheckpointAnswer(
            this.host.getState(),
            item,
            runId,
            decision,
            outcome,
          ),
        )
      })
  }

  refreshCheckpoint(itemId: string): void {
    const state = this.host.getState()
    const item = findDisplayItem(state, itemId)
    if (item === null || !isNeedsYouWorkflowApproval(item)) return
    const runId = item.context.runId
    if (runId === null) return
    const sentToken = item.attentionCheckpointId
    if (this.checkpoints.isInFlight(runId, sentToken)) return
    const started = this.checkpoints.generation()
    void this.refreshCheckpointUseCase.execute(runId).then((result) => {
      // An answer that started or finished since this read began wins.
      if (
        this.host.isDisposed() ||
        started !== this.checkpoints.generation()
      ) {
        return
      }
      this.host.publish(
        applyCheckpointRefresh(
          this.host.getState(),
          item,
          runId,
          sentToken,
          result,
        ),
      )
    })
  }
}
