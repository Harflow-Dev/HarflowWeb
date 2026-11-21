/**
 * Session chrome for Needs you approvals and workflow checkpoints.
 * Task refusals reuse TaskApprovalChrome entries; checkpoint state is separate.
 */
import type { ApprovalDecision } from '../model'
import {
  EMPTY_TASK_APPROVAL,
  retainedApprovalChrome,
  type TaskApprovalChrome,
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
  /** Bumped when a card result should take focus. */
  readonly focusResultSeq: number
  readonly focusItemId: string | null
  /**
   * Task respond keys currently in flight (`taskId\0requestId`), mirrored
   * from the shared TaskApprovalRegistry for React re-renders.
   */
  readonly taskInFlight: readonly string[]
  /** Checkpoint answer keys currently in flight (`runId\0token`). */
  readonly checkpointInFlight: readonly string[]
}

export const EMPTY_NEEDS_YOU_CHROME: NeedsYouChrome = {
  taskApprovals: EMPTY_TASK_APPROVAL,
  checkpoints: [],
  focusResultSeq: 0,
  focusItemId: null,
  taskInFlight: [],
  checkpointInFlight: [],
}

export function checkpointFlightKey(runId: string, token: string): string {
  return `${runId}\u0000${token}`
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

/**
 * What survives leaving Needs you: non_actionable and answered task entries,
 * and checkpoint non_actionable / answered / refused (already_answered).
 * Drops settle-in-place focus, typed refusals, and checkpoint_stale.
 */
export function leaveNeedsYouChrome(chrome: NeedsYouChrome): NeedsYouChrome {
  return {
    taskApprovals: retainedApprovalChrome(chrome.taskApprovals),
    checkpoints: chrome.checkpoints.filter(
      (e) =>
        e.entry.kind === 'non_actionable' ||
        e.entry.kind === 'answered' ||
        e.entry.kind === 'refused',
    ),
    focusResultSeq: 0,
    focusItemId: null,
    taskInFlight: chrome.taskInFlight,
    checkpointInFlight: chrome.checkpointInFlight,
  }
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
