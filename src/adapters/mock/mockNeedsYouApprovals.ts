/**
 * Bridge Needs you inbox task-approval rows into the respond/refresh mock.
 * Slot-release and scenario variants may have no task-feed approval field.
 */
import {
  isNeedsYouTaskApproval,
  type NeedsYouItem,
  type NeedsYouLoad,
  type NeedsYouObservation,
  type NeedsYouTaskApproval,
  type TaskApprovalRequest,
} from '../../model'
import { NEEDS_YOU_STALE_CURRENT } from './needsYouApprovalFixtures'
import type { ApprovalMutationStore } from './mockTaskApproval'
import type { MockListenerSets } from './mockEngineCore'
import type { ScenarioDefinition } from './scenarios'

function resolveNeedsYouLoad(scenario: ScenarioDefinition): NeedsYouLoad {
  return scenario.needsYou === 'defer'
    ? { kind: 'loading' }
    : scenario.needsYou
}

/**
 * Seed inbox ledger rows into the approval store. The stale scenario leaves
 * the override empty and records the engine-ahead revision instead, so
 * Refresh can advance the card.
 */
export function seedNeedsYouApprovalOverrides(
  scenario: ScenarioDefinition,
  store: ApprovalMutationStore,
): void {
  const load = resolveNeedsYouLoad(scenario)
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

function withTaskRequest(
  item: NeedsYouItem,
  taskId: string,
  request: TaskApprovalRequest,
): NeedsYouItem {
  if (!isNeedsYouTaskApproval(item)) return item
  if (item.context.taskId !== taskId) return item
  const next: NeedsYouTaskApproval = {
    ...item,
    requestId: request.requestId,
    ownerRevision: request.ownerRevision,
    request,
  }
  return next
}

export function applyNeedsYouApprovalOverride(
  load: NeedsYouLoad,
  taskId: string,
  request: TaskApprovalRequest,
): NeedsYouLoad {
  if (load.kind !== 'ready') return load
  const items = load.observation.items.map((item) =>
    withTaskRequest(item, taskId, request),
  )
  const observation: NeedsYouObservation = { ...load.observation, items }
  return { kind: 'ready', observation }
}

export function publishNeedsYouApproval(
  getScenario: () => ScenarioDefinition,
  listeners: MockListenerSets,
  taskId: string,
  request: TaskApprovalRequest,
): void {
  const next = applyNeedsYouApprovalOverride(
    resolveNeedsYouLoad(getScenario()),
    taskId,
    request,
  )
  for (const listener of listeners.needsYou) listener(next)
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
