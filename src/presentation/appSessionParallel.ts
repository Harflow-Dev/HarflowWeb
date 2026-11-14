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

/** Narrow internal context AppSession hands to its navigation helpers. */
export type AppNavContext = {
  readonly children: AppChildSessions
  readonly setRoute: (route: AppRoute) => void
  readonly emit: () => void
}

export function openParallelGroup(ctx: AppNavContext, id: ParallelGroupId): void {
  closeWorkflowExecution(ctx.children.workflowExecution)
  closePendingLaunches(ctx.children.pendingLaunches)
  ctx.setRoute('parallel-group')
  ctx.children.parallelGroup.open(id)
  ctx.emit()
}

export function openPendingLaunches(ctx: AppNavContext): void {
  closeWorkflowExecution(ctx.children.workflowExecution)
  closeParallelGroup(ctx.children.parallelGroup)
  ctx.setRoute('pending-launches')
  ctx.children.pendingLaunches.openInventory()
  ctx.emit()
}

export function openPendingLaunch(ctx: AppNavContext, id: PendingLaunchId): void {
  closeWorkflowExecution(ctx.children.workflowExecution)
  closeParallelGroup(ctx.children.parallelGroup)
  ctx.setRoute('pending-launches')
  ctx.children.pendingLaunches.openLaunch(id)
  ctx.emit()
}

export function setPendingLaunchStopConfirm(ctx: AppNavContext, open: boolean): void {
  ctx.children.pendingLaunches.setStopConfirm(open)
}

export function seedPendingLaunchStopOutcome(
  ctx: AppNavContext,
  outcome: PendingLaunchStopOutcome,
): void {
  ctx.children.pendingLaunches.setStopOutcome(outcome)
}

export function setParallelGroupShowPrompt(ctx: AppNavContext, show: boolean): void {
  ctx.children.parallelGroup.setShowPrompt(show)
}

export function setParallelGroupOpenMenuLaneId(
  ctx: AppNavContext,
  laneId: string | null,
): void {
  ctx.children.parallelGroup.setOpenMenuLaneId(laneId)
}

export function setParallelGroupCancelAllConfirm(
  ctx: AppNavContext,
  open: boolean,
): void {
  ctx.children.parallelGroup.setCancelAllConfirm(open)
}

export type ParallelGroupChrome = {
  readonly showPrompt?: boolean
  readonly openMenuLaneId?: string | null
  readonly cancelAllConfirm?: boolean
  readonly queuedCancelOutcome?: ParallelGroupQueuedOutcome | null
}

export function applyParallelGroupChrome(
  ctx: AppNavContext,
  chrome: ParallelGroupChrome,
): void {
  ctx.children.parallelGroup.applyChrome(chrome)
}

export function openTask(ctx: AppNavContext, taskId: TaskId): void {
  closeWorkflowExecution(ctx.children.workflowExecution)
  closeParallelGroup(ctx.children.parallelGroup)
  closePendingLaunches(ctx.children.pendingLaunches)
  ctx.setRoute('task')
  ctx.children.task.openTask(taskId)
  ctx.emit()
}
