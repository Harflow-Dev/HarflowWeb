/**
 * Respond / refresh for Needs you task approvals and workflow checkpoints.
 * In-flight keys are per request so leaving and returning cannot double-submit.
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
import type { NeedsYouScreenState } from './needsYouState'

export type NeedsYouCommandHost = {
  isDisposed(): boolean
  getState(): NeedsYouScreenState
  publish(next: NeedsYouScreenState): void
}

function taskFlightKey(taskId: string, requestId: string): string {
  return `task:${taskId}\u0000${requestId}`
}

function checkpointFlightKey(runId: string, token: string): string {
  return `cp:${runId}\u0000${token}`
}

function findDisplayItem(
  state: NeedsYouScreenState,
  itemId: string,
): import('../model').NeedsYouItem | null {
  return state.displayItems.find((item) => item.id === itemId) ?? null
}

/**
 * Needs you approval commands. Task answers reuse the task approval use
 * cases; workflow checkpoints use the attention-checkpoint use cases.
 */
export class NeedsYouCommands {
  private readonly inFlight = new Set<string>()
  private respondEvents = 0
  private readonly host: NeedsYouCommandHost
  private readonly respondApproval: RespondTaskApprovalUseCase
  private readonly refreshApproval: RefreshTaskApprovalUseCase
  private readonly answerCheckpointUseCase: AnswerWorkflowAttentionCheckpointUseCase
  private readonly refreshCheckpointUseCase: RefreshWorkflowAttentionCheckpointUseCase

  constructor(
    host: NeedsYouCommandHost,
    respondApproval: RespondTaskApprovalUseCase,
    refreshApproval: RefreshTaskApprovalUseCase,
    answerCheckpoint: AnswerWorkflowAttentionCheckpointUseCase,
    refreshCheckpoint: RefreshWorkflowAttentionCheckpointUseCase,
  ) {
    this.host = host
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
    const key = taskFlightKey(taskId, item.requestId)
    if (this.inFlight.has(key)) return
    this.inFlight.add(key)
    this.respondEvents += 1
    this.host.publish({ ...state, submittingKey: key })
    void this.respondApproval
      .execute({
        taskId,
        requestId: item.requestId,
        decision,
        ownerRevision: item.ownerRevision,
        actionDigest: item.request.actionDigest,
      })
      .then((outcome) => {
        this.inFlight.delete(key)
        this.respondEvents += 1
        if (this.host.isDisposed()) return
        const current = this.host.getState()
        this.host.publish(
          applyTaskRespond(current, item, taskId, decision, outcome, key),
        )
      })
  }

  refreshTaskApproval(itemId: string): void {
    const state = this.host.getState()
    const item = findDisplayItem(state, itemId)
    if (item === null || !isNeedsYouTaskApproval(item)) return
    const taskId = item.context.taskId
    if (taskId === null) return
    const key = taskFlightKey(taskId, item.requestId)
    if (this.inFlight.has(key)) return
    const started = this.respondEvents
    void this.refreshApproval.execute(taskId, item.requestId).then((result) => {
      if (this.host.isDisposed() || started !== this.respondEvents) return
      const current = this.host.getState()
      this.host.publish(applyTaskRefresh(current, item, taskId, result))
    })
  }

  answerCheckpoint(itemId: string, decision: ApprovalDecision): void {
    const state = this.host.getState()
    const item = findDisplayItem(state, itemId)
    if (item === null || !isNeedsYouWorkflowApproval(item)) return
    const runId = item.context.runId
    if (runId === null) return
    const key = checkpointFlightKey(runId, item.attentionCheckpointId)
    if (this.inFlight.has(key)) return
    this.inFlight.add(key)
    this.respondEvents += 1
    this.host.publish({ ...state, submittingKey: key })
    void this.answerCheckpointUseCase
      .execute({
        workflowRunId: runId,
        attentionCheckpointId: item.attentionCheckpointId,
        decision,
      })
      .then((outcome) => {
        this.inFlight.delete(key)
        this.respondEvents += 1
        if (this.host.isDisposed()) return
        const current = this.host.getState()
        this.host.publish(
          applyCheckpointAnswer(current, item, runId, decision, outcome, key),
        )
      })
  }

  refreshCheckpoint(itemId: string): void {
    const state = this.host.getState()
    const item = findDisplayItem(state, itemId)
    if (item === null || !isNeedsYouWorkflowApproval(item)) return
    const runId = item.context.runId
    if (runId === null) return
    const key = checkpointFlightKey(runId, item.attentionCheckpointId)
    if (this.inFlight.has(key)) return
    const started = this.respondEvents
    const sentToken = item.attentionCheckpointId
    void this.refreshCheckpointUseCase.execute(runId).then((result) => {
      if (this.host.isDisposed() || started !== this.respondEvents) return
      const current = this.host.getState()
      this.host.publish(
        applyCheckpointRefresh(current, item, runId, sentToken, result),
      )
    })
  }
}