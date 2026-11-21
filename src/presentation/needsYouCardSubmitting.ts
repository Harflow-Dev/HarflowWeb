/**
 * Per-card submitting flags for Needs you. Task cards read mirrored
 * registry flight keys; checkpoint cards read chrome.checkpointInFlight.
 */
import type { NeedsYouItem } from '../model'
import {
  isNeedsYouTaskApproval,
  isNeedsYouWorkflowApproval,
} from '../model'
import {
  checkpointFlightKey,
  type NeedsYouChrome,
} from './needsYouChrome'
import { taskApprovalFlightKey } from './taskApprovalRegistry'

export function needsYouCardSubmitting(
  item: NeedsYouItem,
  chrome: NeedsYouChrome,
): boolean {
  if (isNeedsYouTaskApproval(item)) {
    const taskId = item.context.taskId
    if (taskId === null) return false
    return chrome.taskInFlight.includes(
      taskApprovalFlightKey(taskId, item.requestId),
    )
  }
  if (isNeedsYouWorkflowApproval(item)) {
    const runId = item.context.runId
    if (runId === null) return false
    return chrome.checkpointInFlight.includes(
      checkpointFlightKey(runId, item.attentionCheckpointId),
    )
  }
  return false
}
