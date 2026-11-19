import type { TaskId } from '../model'
import type { TaskScreenState } from './taskState'
import {
  taskLedger,
  type TaskMessagingOutcome,
  type TaskSendNowRefusal,
} from './taskQueuedMessages'

/** Preview / session chrome for the messaging command outcomes. */
export type TaskMessagingSeed = {
  readonly outcome?: TaskMessagingOutcome | null
  readonly refusals?: readonly TaskSendNowRefusal[]
}

/**
 * Cancel a queued ledger message in the mock: remove it from the drawn
 * queue, set the cancelled outcome, and bump focusSeq for the outcome line.
 * Returns null when the cancel is refused (only queued records of the shown
 * task can be cancelled, once).
 */
export function cancelledQueuedMessageState(
  state: TaskScreenState,
  messageId: string,
): TaskScreenState | null {
  if (state.load.kind !== 'ready') return null
  const { messagingChrome } = state
  if (messagingChrome.removedIds.includes(messageId)) return null
  const target = taskLedger(state.load.observation).find(
    (message) => message.id === messageId,
  )
  if (target === undefined || target.status !== 'queued') return null
  return {
    ...state,
    messagingChrome: {
      removedIds: [...messagingChrome.removedIds, messageId],
      outcome: 'cancelled',
      refusals: messagingChrome.refusals.filter(
        (entry) => entry.messageId !== messageId,
      ),
      focusSeq: messagingChrome.focusSeq + 1,
    },
  }
}

/** Seed command outcomes for the open task once its observation is ready. */
export function seededMessagingChromeState(
  state: TaskScreenState,
  taskId: TaskId,
  seed: TaskMessagingSeed,
): TaskScreenState | null {
  if (state.selectedTaskId !== taskId) return null
  if (state.load.kind !== 'ready') return null
  const { messagingChrome } = state
  return {
    ...state,
    messagingChrome: {
      ...messagingChrome,
      outcome:
        seed.outcome !== undefined ? seed.outcome : messagingChrome.outcome,
      refusals: seed.refusals ?? messagingChrome.refusals,
    },
  }
}
