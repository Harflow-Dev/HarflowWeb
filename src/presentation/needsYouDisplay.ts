/**
 * Merge observation items with settle-in-place retained cards.
 */
import type { NeedsYouItem, NeedsYouLoad } from '../model'
import {
  isNeedsYouTaskApproval,
  isNeedsYouWorkflowApproval,
  needsYouWaitingCount,
} from '../model'
import type { NeedsYouChrome } from './needsYouChrome'
import { checkpointEntryFor } from './needsYouChrome'
import { approvalEntryFor } from './taskApprovalChrome'

function itemIsSettled(item: NeedsYouItem, chrome: NeedsYouChrome): boolean {
  if (isNeedsYouTaskApproval(item)) {
    const taskId = item.context.taskId ?? ''
    return approvalEntryFor(chrome.taskApprovals, taskId, item.request) !== null
  }
  if (isNeedsYouWorkflowApproval(item)) {
    const runId = item.context.runId
    if (runId === null) return false
    return (
      checkpointEntryFor(chrome, runId, item.attentionCheckpointId) !== null
    )
  }
  return false
}

/**
 * Keep settled cards in place when they leave the observation while the
 * person stays on Needs you. New observation items append.
 */
export function mergeNeedsYouDisplay(
  previous: readonly NeedsYouItem[],
  next: readonly NeedsYouItem[],
  chrome: NeedsYouChrome,
): readonly NeedsYouItem[] {
  const nextById = new Map(next.map((item) => [item.id, item]))
  const seen = new Set<string>()
  const result: NeedsYouItem[] = []
  for (const prev of previous) {
    const updated = nextById.get(prev.id)
    if (updated !== undefined) {
      result.push(updated)
      seen.add(prev.id)
      continue
    }
    if (itemIsSettled(prev, chrome)) {
      result.push(prev)
      seen.add(prev.id)
    }
  }
  for (const item of next) {
    if (!seen.has(item.id)) result.push(item)
  }
  return result
}

/** Header / sidebar waiting count from the observation only (honest). */
export function needsYouObservationWaitingCount(load: NeedsYouLoad): number {
  if (load.kind !== 'ready' || load.observation.coverage !== 'complete') {
    return 0
  }
  return needsYouWaitingCount(load.observation.items)
}
