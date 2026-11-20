/**
 * Session chrome for Needs you approvals and workflow checkpoints.
 * Task refusals reuse TaskApprovalChrome entries; checkpoint state is separate.
 */
import type { ApprovalDecision, NeedsYouItem } from '../model'
import {
  EMPTY_TASK_APPROVAL,
  type TaskApprovalChrome,
  type TaskApprovalEntry,
} from './taskApprovalChrome'
import type { NeedsYouCheckpointEntry } from './needsYouCheckpointCardView'

export type NeedsYouCheckpointChromeEntry = {
  readonly runId: string
  readonly attentionCheckpointId: string
  readonly entry: NeedsYouCheckpointEntry
}

export type NeedsYouChrome = {
  readonly taskApprovals: TaskApprovalChrome
  readonly checkpoints: readonly NeedsYouCheckpointChromeEntry[]
  /**
   * Items that settled while on screen and left the observation stay here
   * until the person leaves Needs you.
   */
  readonly retainedItems: readonly NeedsYouItem[]
  /** Bumped when a card result should take focus. */
  readonly focusResultSeq: number
  readonly focusItemId: string | null
}

export const EMPTY_NEEDS_YOU_CHROME: NeedsYouChrome = {
  taskApprovals: EMPTY_TASK_APPROVAL,
  checkpoints: [],
  retainedItems: [],
  focusResultSeq: 0,
  focusItemId: null,
}

export function checkpointEntryFor(
  chrome: NeedsYouChrome,
  runId: string,
  attentionCheckpointId: string,
): NeedsYouCheckpointEntry | null {
  const found = chrome.checkpoints.find(
    (e) =>
      e.runId === runId && e.attentionCheckpointId === attentionCheckpointId,
  )
  return found?.entry ?? null
}

export function withCheckpointEntry(
  chrome: NeedsYouChrome,
  runId: string,
  attentionCheckpointId: string,
  entry: NeedsYouCheckpointEntry,
  focusItemId: string,
): NeedsYouChrome {
  const rest = chrome.checkpoints.filter(
    (e) =>
      !(
        e.runId === runId &&
        e.attentionCheckpointId === attentionCheckpointId
      ),
  )
  return {
    ...chrome,
    checkpoints: [...rest, { runId, attentionCheckpointId, entry }],
    focusResultSeq: chrome.focusResultSeq + 1,
    focusItemId,
  }
}

export function withoutCheckpointStale(
  chrome: NeedsYouChrome,
  runId: string,
  attentionCheckpointId: string,
): NeedsYouChrome {
  return {
    ...chrome,
    checkpoints: chrome.checkpoints.filter(
      (e) =>
        !(
          e.entry.kind === 'checkpoint_stale' &&
          e.runId === runId &&
          e.attentionCheckpointId === attentionCheckpointId
        ),
    ),
  }
}

export function withTaskApprovalChrome(
  chrome: NeedsYouChrome,
  taskApprovals: TaskApprovalChrome,
  focusItemId: string | null,
): NeedsYouChrome {
  const focused =
    focusItemId !== null &&
    taskApprovals.focusResultSeq > chrome.taskApprovals.focusResultSeq
  return {
    ...chrome,
    taskApprovals,
    focusResultSeq: focused
      ? chrome.focusResultSeq + 1
      : chrome.focusResultSeq,
    focusItemId: focused ? focusItemId : chrome.focusItemId,
  }
}

export function withRetainedItem(
  chrome: NeedsYouChrome,
  item: NeedsYouItem,
): NeedsYouChrome {
  if (chrome.retainedItems.some((r) => r.id === item.id)) return chrome
  return { ...chrome, retainedItems: [...chrome.retainedItems, item] }
}

export function isSettledNeedsYouEntry(
  entry: TaskApprovalEntry | NeedsYouCheckpointEntry | null,
): boolean {
  return entry !== null
}

export type NeedsYouSeedRefusal = {
  readonly requestId: string
  readonly taskId: string
  readonly refusal: {
    readonly reason: string
    readonly interaction?: {
      readonly answeredBy: 'caller' | 'monitor'
      readonly answer: ApprovalDecision
      readonly answeredAt: number
    }
  }
}

export type NeedsYouSeedCheckpointStale = {
  readonly runId: string
  readonly attentionCheckpointId: string
}
