import type { TaskScreenState } from './taskState'

/**
 * Cancel a queued ledger message in the mock: remove it from the drawn
 * queue, set the cancelled outcome, and bump focusSeq for the outcome line.
 * Returns null when the cancel is refused.
 */
export function cancelledQueuedMessageState(
  state: TaskScreenState,
  messageId: string,
): TaskScreenState | null {
  if (state.load.kind !== 'ready') return null
  const ledger = state.load.observation.messages ?? []
  const target = ledger.find((message) => message.id === messageId)
  if (target === undefined || target.status !== 'queued') return null
  if (state.messagingCancel.removedIds.includes(messageId)) return null
  return {
    ...state,
    messagingCancel: {
      removedIds: [...state.messagingCancel.removedIds, messageId],
      cancelled: true,
      focusSeq: state.messagingCancel.focusSeq + 1,
    },
  }
}
