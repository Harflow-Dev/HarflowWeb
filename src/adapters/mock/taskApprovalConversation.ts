/**
 * Approval-base conversation: slot-release transcript without the trailing
 * working row (Design task/approval ends on the edit tool, then the card).
 */
import type { TaskConversation } from '../../model'
import { runningConversation } from './taskConversationFixtures'

export function approvalConversation(): TaskConversation {
  const base = runningConversation()
  return {
    request: base.request,
    items: base.items.filter((item) => item.kind !== 'working'),
  }
}
