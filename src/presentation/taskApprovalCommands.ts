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

/** Respond / refresh approval for the open task. */
export class TaskApprovalCommands {
  private epoch = 0
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

  respondDecision(decision: ApprovalDecision): void {
    const state = this.host.getState()
    const request = currentApprovalRequest(state)
    const taskId = state.selectedTaskId
    if (request === null || taskId === null) return
    if (state.approvalChrome.submitting) return
    this.epoch += 1
    const epoch = this.epoch
    this.host.publish(approvalSubmittingState(state, true))
    void this.respond
      .execute({
        taskId,
        requestId: request.requestId,
        decision,
        ownerRevision: request.ownerRevision,
        actionDigest: request.actionDigest,
      })
      .then((outcome) => {
        if (this.host.isDisposed() || epoch !== this.epoch) return
        if (this.host.getState().selectedTaskId !== taskId) return
        this.host.publish(
          approvalRespondedState(
            this.host.getState(),
            request.requestId,
            outcome,
          ),
        )
      })
  }

  refreshRequest(): void {
    const state = this.host.getState()
    const request = currentApprovalRequest(state)
    const taskId = state.selectedTaskId
    if (request === null || taskId === null) return
    this.epoch += 1
    const epoch = this.epoch
    void this.refresh.execute(taskId, request.requestId).then((row) => {
      if (this.host.isDisposed() || epoch !== this.epoch) return
      if (this.host.getState().selectedTaskId !== (taskId as TaskId)) return
      this.host.publish(
        approvalRefreshedState(this.host.getState(), request.requestId, row),
      )
    })
  }
}
