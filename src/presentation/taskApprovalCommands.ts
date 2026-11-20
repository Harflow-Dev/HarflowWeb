import type {
  RefreshTaskApprovalUseCase,
  RespondTaskApprovalUseCase,
} from '../application'
import type { ApprovalDecision, TaskId } from '../model'
import {
  approvalRefreshedState,
  approvalRespondedState,
  approvalSubmittingState,
  currentApprovalRequest,
} from './taskSessionApproval'
import type { TaskScreenState } from './taskState'

export type TaskApprovalCommandHost = {
  isDisposed(): boolean
  getState(): TaskScreenState
  publish(next: TaskScreenState): void
}

function flightKey(taskId: string, requestId: string): string {
  return `${taskId}\u0000${requestId}`
}

/**
 * Respond / refresh approval for the open task. In-flight respond calls are
 * keyed by task id + request id here, not in the resettable chrome, so
 * leaving and returning to a task mid-call cannot submit twice.
 */
export class TaskApprovalCommands {
  private readonly inFlight = new Set<string>()
  /** Bumped when a respond starts or settles; a refresh read across it is stale. */
  private respondEvents = 0
  private readonly host: TaskApprovalCommandHost
  private readonly respond: RespondTaskApprovalUseCase
  private readonly refresh: RefreshTaskApprovalUseCase

  constructor(
    host: TaskApprovalCommandHost,
    respond: RespondTaskApprovalUseCase,
    refresh: RefreshTaskApprovalUseCase,
  ) {
    this.host = host
    this.respond = respond
    this.refresh = refresh
  }

  /** Set the chrome mirror of the in-flight state for the open request. */
  withSubmitting(state: TaskScreenState): TaskScreenState {
    const request = currentApprovalRequest(state)
    const taskId = state.selectedTaskId
    const submitting =
      request !== null &&
      taskId !== null &&
      this.inFlight.has(flightKey(taskId, request.requestId))
    return approvalSubmittingState(state, submitting)
  }

  respondDecision(decision: ApprovalDecision): void {
    const state = this.host.getState()
    const sent = currentApprovalRequest(state)
    const taskId = state.selectedTaskId
    if (sent === null || taskId === null) return
    const key = flightKey(taskId, sent.requestId)
    if (this.inFlight.has(key)) return
    this.inFlight.add(key)
    this.respondEvents += 1
    this.host.publish(this.withSubmitting(state))
    void this.respond
      .execute({
        taskId,
        requestId: sent.requestId,
        decision,
        ownerRevision: sent.ownerRevision,
        actionDigest: sent.actionDigest,
      })
      .then((outcome) => {
        this.inFlight.delete(key)
        this.respondEvents += 1
        if (this.host.isDisposed()) return
        const next = approvalRespondedState(
          this.host.getState(),
          taskId,
          sent,
          decision,
          outcome,
        )
        this.host.publish(this.withSubmitting(next))
      })
  }

  refreshRequest(): void {
    const state = this.host.getState()
    const request = currentApprovalRequest(state)
    const taskId = state.selectedTaskId
    if (request === null || taskId === null) return
    // A refresh never races an in-flight respond: the respond result wins.
    if (this.inFlight.has(flightKey(taskId, request.requestId))) return
    const started = this.respondEvents
    void this.refresh.execute(taskId, request.requestId).then((result) => {
      if (this.host.isDisposed() || started !== this.respondEvents) return
      const current = this.host.getState()
      if (current.selectedTaskId !== (taskId as TaskId)) return
      this.host.publish(
        approvalRefreshedState(current, taskId, request.requestId, result),
      )
    })
  }
}
