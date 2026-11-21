/**
 * Bridge Needs you inbox task-approval rows into the respond/refresh mock.
 * Slot-release and scenario variants may have no task-feed approval field.
 */
import {
  isNeedsYouTaskApproval,
  type TaskApprovalRequest,
} from '../../model'
import { NEEDS_YOU_STALE_CURRENT } from './needsYouApprovalFixtures'
import type { ApprovalMutationStore } from './mockTaskApproval'
import type { CheckpointMutationStore } from './mockWorkflowCheckpoint'
import type { MockListenerSets } from './mockEngineCore'
import type { ScenarioDefinition } from './scenarios'
import {
  applyNeedsYouApprovalOverride,
  publishComposedNeedsYou,
  resolveNeedsYouBaseLoad,
} from './mockNeedsYouCompose'

export { applyNeedsYouApprovalOverride }

/**
 * Seed inbox ledger rows into the approval store. The stale scenario leaves
 * the override empty and records the engine-ahead revision instead, so
 * Refresh can advance the card.
 */
export function seedNeedsYouApprovalOverrides(
  scenario: ScenarioDefinition,
  store: ApprovalMutationStore,
): void {
  const load = resolveNeedsYouBaseLoad(scenario)
  if (load.kind !== 'ready') return
  const stale = scenario.id === 'needs-you-approval-stale'
  for (const item of load.observation.items) {
    if (!isNeedsYouTaskApproval(item)) continue
    const taskId = item.context.taskId
    if (taskId === null) continue
    if (stale) {
      store.engineAhead.set(taskId, NEEDS_YOU_STALE_CURRENT)
      continue
    }
    if (!store.overrides.has(taskId)) {
      store.overrides.set(taskId, item.request)
    }
  }
}

export function publishNeedsYouApproval(
  getScenario: () => ScenarioDefinition,
  listeners: MockListenerSets,
  approvals: ApprovalMutationStore,
  checkpoints: CheckpointMutationStore,
): void {
  publishComposedNeedsYou(getScenario, listeners, approvals, checkpoints)
}

/** Inbox-aware engine row when the task feed has no approval field. */
export function needsYouEngineRow(
  taskId: string,
  store: ApprovalMutationStore,
): TaskApprovalRequest | null {
  return (
    store.overrides.get(taskId) ?? store.engineAhead.get(taskId) ?? null
  )
}
