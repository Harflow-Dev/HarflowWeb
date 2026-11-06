import type { RepositoryId, WorkflowId } from './ids'

/**
 * Read-only workflow definition summary for the Workflows list.
 * Definitions are not runs — no run status belongs here.
 */
export type WorkflowSummary = {
  readonly id: WorkflowId
  readonly title: string
  readonly description: string
  /** Node count from the approved list specimen. */
  readonly nodeCount: number
}

export type WorkflowsLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable'; readonly message: string }
  | { readonly kind: 'ready'; readonly workflows: readonly WorkflowSummary[] }

/** Saved orchestrator is selectable. Other ids stay unsupported. */
export type WorkflowOverrideId = 'saved' | 'custom'

export type WorkflowOverrideChoice = {
  readonly id: WorkflowOverrideId
  readonly label: string
  readonly available: boolean
  readonly unavailableReason: string | null
}

/**
 * One fixture permission line.
 * limitLabel is uncertainty or a fixture label, not an enforcement guarantee.
 */
export type WorkflowPermissionFact = {
  readonly id: string
  readonly participant: string
  readonly accessLabel: string
  readonly limitLabel: string
}

export type WorkflowPermissionSet = {
  readonly repositoryId: RepositoryId
  readonly overrideId: WorkflowOverrideId
  readonly facts: readonly WorkflowPermissionFact[]
}

/** Read-only context for one definition. Never borrowed from another id. */
export type WorkflowRunContext = {
  readonly workflowId: WorkflowId
  readonly title: string
  readonly suggestedTask: string
  readonly suggestedGoal: string
  readonly repositories: readonly { id: RepositoryId; label: string }[]
  readonly defaultRepositoryId: RepositoryId
  readonly overrides: readonly WorkflowOverrideChoice[]
  readonly defaultOverrideId: WorkflowOverrideId
  readonly permissions: readonly WorkflowPermissionSet[]
}

export type WorkflowRunContextLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable'; readonly message: string }
  | { readonly kind: 'ready'; readonly context: WorkflowRunContext }

/** Session-local form values. Task and goal are stored exactly as entered. */
export type WorkflowRunDraft = {
  readonly task: string
  readonly goal: string
  readonly goalOpen: boolean
  readonly repositoryId: RepositoryId | null
  readonly overrideId: WorkflowOverrideId | null
  readonly seeded: boolean
  readonly touched: boolean
}

export function emptyWorkflowRunDraft(): WorkflowRunDraft {
  return {
    task: '',
    goal: '',
    goalOpen: true,
    repositoryId: null,
    overrideId: null,
    seeded: false,
    touched: false,
  }
}

/** Presence check. Callers must not write the trimmed string back. */
export function workflowTaskMissing(task: string): boolean {
  return task.trim().length === 0
}

export function seedWorkflowRunDraft(
  draft: WorkflowRunDraft,
  context: WorkflowRunContext,
): WorkflowRunDraft {
  if (draft.seeded || draft.touched) return { ...draft, seeded: true }
  return {
    ...draft,
    task: context.suggestedTask,
    goal: context.suggestedGoal,
    repositoryId: context.defaultRepositoryId,
    overrideId: context.defaultOverrideId,
    seeded: true,
  }
}

export function workflowPermissionFacts(
  context: WorkflowRunContext,
  repositoryId: RepositoryId | null,
  overrideId: WorkflowOverrideId | null,
): readonly WorkflowPermissionFact[] | null {
  if (repositoryId === null || overrideId === null) return null
  const repositoryKnown = context.repositories.some((item) => item.id === repositoryId)
  const override = context.overrides.find((item) => item.id === overrideId)
  if (!repositoryKnown || override?.available !== true) return null
  const set = context.permissions.find(
    (item) => item.repositoryId === repositoryId && item.overrideId === overrideId,
  )
  return set?.facts ?? null
}

export function workflowPermissionLine(fact: WorkflowPermissionFact): string {
  return `${fact.participant} · ${fact.accessLabel} · ${fact.limitLabel}`
}
