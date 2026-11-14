import type { ParallelGroupId, PendingLaunchId, TaskId } from '../model'
import {
  closeParallelGroup,
  closePendingLaunches,
  closeWorkflowExecution,
} from './appNavigation'
import type { AppChildSessions } from './appChildSessions'
import type { AppRoute } from './appState'
import type { ParallelGroupQueuedOutcome } from './parallelGroupState'
import type { PendingLaunchStopOutcome } from './pendingLaunchesState'

type Ctx = {
  readonly children: AppChildSessions
  setRoute(route: AppRoute): void
  emit(): void
}

export function openParallelGroup(ctx: Ctx, id: ParallelGroupId): void {
  closeWorkflowExecution(ctx.children.workflowExecution)
  closePendingLaunches(ctx.children.pendingLaunches)
  ctx.setRoute('parallel-group')
  ctx.children.parallelGroup.open(id)
  ctx.emit()
}

export function openPendingLaunches(ctx: Ctx): void {
  closeWorkflowExecution(ctx.children.workflowExecution)
  closeParallelGroup(ctx.children.parallelGroup)
  ctx.setRoute('pending-launches')
  ctx.children.pendingLaunches.openInventory()
  ctx.emit()
}

export function openPendingLaunch(ctx: Ctx, id: PendingLaunchId): void {
  closeWorkflowExecution(ctx.children.workflowExecution)
  closeParallelGroup(ctx.children.parallelGroup)
  ctx.setRoute('pending-launches')
  ctx.children.pendingLaunches.openLaunch(id)
  ctx.emit()
}

export function setPendingLaunchStopConfirm(ctx: Ctx, open: boolean): void {
  ctx.children.pendingLaunches.setStopConfirm(open)
}

export function seedPendingLaunchStopOutcome(
  ctx: Ctx,
  outcome: PendingLaunchStopOutcome,
): void {
  ctx.children.pendingLaunches.setStopOutcome(outcome)
}

export function setParallelGroupShowPrompt(ctx: Ctx, show: boolean): void {
  ctx.children.parallelGroup.setShowPrompt(show)
}

export function setParallelGroupOpenMenuLaneId(
  ctx: Ctx,
  laneId: string | null,
): void {
  ctx.children.parallelGroup.setOpenMenuLaneId(laneId)
}

export function setParallelGroupCancelAllConfirm(
  ctx: Ctx,
  open: boolean,
): void {
  ctx.children.parallelGroup.setCancelAllConfirm(open)
}

export function applyParallelGroupChrome(
  ctx: Ctx,
  chrome: {
    readonly showPrompt?: boolean
    readonly openMenuLaneId?: string | null
    readonly cancelAllConfirm?: boolean
    readonly queuedCancelOutcome?: ParallelGroupQueuedOutcome | null
  },
): void {
  ctx.children.parallelGroup.applyChrome(chrome)
}

export function openTask(ctx: Ctx, taskId: TaskId): void {
  closeWorkflowExecution(ctx.children.workflowExecution)
  closeParallelGroup(ctx.children.parallelGroup)
  closePendingLaunches(ctx.children.pendingLaunches)
  ctx.setRoute('task')
  ctx.children.task.openTask(taskId)
  ctx.emit()
}
