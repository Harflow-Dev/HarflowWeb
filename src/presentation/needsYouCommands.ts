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
import {
  checkpointFlightKey,
  type NeedsYouChrome,
} from './needsYouChrome'
import type { NeedsYouScreenState } from './needsYouState'
import {
  taskApprovalFlightKey,
  type TaskApprovalRegistry,
} from './taskApprovalRegistry'

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

function withFlightKeys(
  keys: readonly string[],
  key: string,
  present: boolean,
): readonly string[] {
  const rest = keys.filter((k) => k !== key)
  return present ? [...rest, key] : rest
}

function withTaskFlight(
  chrome: NeedsYouChrome,
  key: string,
  present: boolean,
): NeedsYouChrome {
  return {
    ...chrome,
    taskInFlight: withFlightKeys(chrome.taskInFlight, key, present),
  }
}

function withCheckpointFlight(
  chrome: NeedsYouChrome,
  key: string,
  present: boolean,
): NeedsYouChrome {
  return {
    ...chrome,
    checkpointInFlight: withFlightKeys(
      chrome.checkpointInFlight,
      key,
      present,
    ),
  }
}

/**
 * Needs you approval commands. Task answers reuse the shared registry and
 * task approval use cases; workflow checkpoints use attention-checkpoint
 * use cases with a local in-flight set.
 */
export class NeedsYouCommands {
  private readonly host: NeedsYouCommandHost
  private readonly registry: TaskApprovalRegistry
  private readonly respondApproval: RespondTaskApprovalUseCase
  private readonly refreshApproval: RefreshTaskApprovalUseCase
  private readonly answerCheckpointUseCase: AnswerWorkflowAttentionCheckpointUseCase
  private readonly refreshCheckpointUseCase: RefreshWorkflowAttentionCheckpointUseCase

  constructor(
    host: NeedsYouCommandHost,
    registry: TaskApprovalRegistry,
    respondApproval: RespondTaskApprovalUseCase,
    refreshApproval: RefreshTaskApprovalUseCase,
    answerCheckpoint: AnswerWorkflowAttentionCheckpointUseCase,
    refreshCheckpoint: RefreshWorkflowAttentionCheckpointUseCase,
  ) {
    this.host = host
    this.registry = registry
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
    const flightKey = taskApprovalFlightKey(taskId, item.requestId)
    this.host.publish({
      ...state,
      chrome: withTaskFlight(state.chrome, flightKey, true),
    })
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
        const current = this.host.getState()
        const cleared = {
          ...current,
          chrome: withTaskFlight(current.chrome, flightKey, false),
        }
        this.host.publish(
          applyTaskRespond(
            cleared,
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
    const key = checkpointFlightKey(runId, item.attentionCheckpointId)
    if (state.chrome.checkpointInFlight.includes(key)) return
    this.host.publish({
      ...state,
      chrome: withCheckpointFlight(state.chrome, key, true),
    })
    void this.answerCheckpointUseCase
      .execute({
        workflowRunId: runId,
        attentionCheckpointId: item.attentionCheckpointId,
        decision,
      })
      .then((outcome) => {
        if (this.host.isDisposed()) return
        const current = this.host.getState()
        const cleared = {
          ...current,
          chrome: withCheckpointFlight(current.chrome, key, false),
        }
        this.host.publish(
          applyCheckpointAnswer(cleared, item, runId, decision, outcome),
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
    if (state.chrome.checkpointInFlight.includes(key)) return
    const sentToken = item.attentionCheckpointId
    void this.refreshCheckpointUseCase.execute(runId).then((result) => {
      if (this.host.isDisposed()) return
      const current = this.host.getState()
      this.host.publish(
        applyCheckpointRefresh(current, item, runId, sentToken, result),
      )
    })
  }
}
