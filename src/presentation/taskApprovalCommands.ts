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
import type { TaskApprovalRegistry } from './taskApprovalRegistry'
import type { TaskScreenState } from './taskState'

export type TaskApprovalCommandHost = {
  isDisposed(): boolean
  getState(): TaskScreenState
  publish(next: TaskScreenState): void
}

/**
 * Respond / refresh approval for the open task. In-flight respond calls are
 * keyed on the shared TaskApprovalRegistry so Needs you and the task screen
 * cannot double-submit the same request.
 */
export class TaskApprovalCommands {
  private readonly host: TaskApprovalCommandHost
  private readonly registry: TaskApprovalRegistry
  private readonly respond: RespondTaskApprovalUseCase
  private readonly refresh: RefreshTaskApprovalUseCase

  constructor(
    host: TaskApprovalCommandHost,
    registry: TaskApprovalRegistry,
    respond: RespondTaskApprovalUseCase,
    refresh: RefreshTaskApprovalUseCase,
  ) {
    this.host = host
    this.registry = registry
    this.respond = respond
    this.refresh = refresh
  }

  /**
   * Mirror shared registry entries and the in-flight flag for the open
   * request into task chrome so Needs you outcomes are visible here.
   */
  withSubmitting(state: TaskScreenState): TaskScreenState {
    const request = currentApprovalRequest(state)
    const taskId = state.selectedTaskId
    const submitting =
      request !== null &&
      taskId !== null &&
      this.registry.isInFlight(taskId, request.requestId)
    const synced: TaskScreenState = {
      ...state,
      approvalChrome: {
        ...this.registry.asChrome(submitting),
        focusResultSeq: state.approvalChrome.focusResultSeq,
      },
    }
    return approvalSubmittingState(synced, submitting)
  }

  respondDecision(decision: ApprovalDecision): void {
    const state = this.host.getState()
    const sent = currentApprovalRequest(state)
    const taskId = state.selectedTaskId
    if (sent === null || taskId === null) return
    if (!this.registry.beginRespond(taskId, sent.requestId)) return
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
        this.registry.endRespond(taskId, sent.requestId)
        if (this.host.isDisposed()) return
        const next = approvalRespondedState(
          this.host.getState(),
          this.registry,
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
    if (this.registry.isInFlight(taskId, request.requestId)) return
    const started = this.registry.respondGeneration()
    void this.refresh.execute(taskId, request.requestId).then((result) => {
      if (
        this.host.isDisposed() ||
        started !== this.registry.respondGeneration()
      ) {
        return
      }
      const current = this.host.getState()
      if (current.selectedTaskId !== (taskId as TaskId)) return
      this.host.publish(
        approvalRefreshedState(
          current,
          this.registry,
          taskId,
          request.requestId,
          result,
        ),
      )
    })
  }
}
