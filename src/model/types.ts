import type { HarnessId, ModelId, ObservationId, RepositoryId, TaskId } from './ids'

/** Appearance preference — system follows the host. */
export type Appearance = 'system' | 'light' | 'dark'

/**
 * Requested access label for the composer.
 * Describes intent only; the mock does not enforce permissions.
 */
export type AccessLevel = 'read_only' | 'edit_repo' | 'publish' | 'full'

export type AccessOption = {
  readonly id: AccessLevel
  readonly label: string
  readonly hint: string
  readonly available: boolean
}

export type RepositoryOption = {
  readonly id: RepositoryId
  /** Display name for a future server-hosted repository. */
  readonly label: string
}

export type ModelOption = {
  readonly id: ModelId
  readonly label: string
}

export type HarnessOption = {
  readonly id: HarnessId
  readonly label: string
  readonly available: boolean
  readonly unavailableReason: string | null
  readonly models: readonly ModelOption[]
  readonly defaultModelId: ModelId | null
  /** Access levels this harness fixture admits. */
  readonly accessLevels: readonly AccessLevel[]
}

export type SidebarGlyph =
  | 'running'
  | 'attention'
  | 'done'
  | 'failed'
  | 'cancelled'
  | 'parallel'
  | 'workflow'

export type SidebarEntry = {
  readonly id: string
  readonly title: string
  readonly meta: string
  readonly glyph: SidebarGlyph
  /**
   * Explicit fixture mapping to a running-task transcript.
   * Null means the row is not a task destination — never invent a fallback task.
   */
  readonly mappedTaskId: import('./ids').TaskId | null
  /**
   * Explicit fixture mapping to a Parallel group screen.
   * Null means the row is not a Parallel group destination.
   * When set, takes precedence over mappedTaskId for navigation.
   */
  readonly mappedParallelGroupId: import('./ids').ParallelGroupId | null
}

export type SidebarData = {
  readonly running: readonly SidebarEntry[]
  readonly recent: readonly SidebarEntry[]
  readonly needsYouCount: number
  /**
   * When true, Running/Recent may be incomplete.
   * Mock-only presentation flag — not a ctl catalog projection.
   */
  readonly coverageIncomplete: boolean
  readonly coverageNote: string | null
}

/**
 * Observation-reported composer readiness for Start.
 * checking = harness options still being discovered; unqualified = none ready.
 */
export type ComposerQualification = 'checking' | 'ready' | 'unqualified'

export type ComposerContext = {
  readonly repositories: readonly RepositoryOption[]
  readonly harnesses: readonly HarnessOption[]
  readonly accessOptions: readonly AccessOption[]
  readonly selectedRepositoryId: RepositoryId | null
  readonly selectedHarnessId: HarnessId | null
  readonly selectedModelId: ModelId | null
  readonly selectedAccess: AccessLevel
  readonly qualification: ComposerQualification
}

export type ContextLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable'; readonly message: string }
  | {
      readonly kind: 'ready'
      readonly composer: ComposerContext
      readonly sidebar: SidebarData
    }

/**
 * Start-task outcomes mapped from HarflowMCP 0.0.10 ctl launch-run fixtures:
 * accepted → result.task_id; refused → error; unknown → unknown envelope.
 */
export type StartTaskOutcome =
  | { readonly kind: 'accepted'; readonly taskId: TaskId }
  | { readonly kind: 'refused'; readonly code: string; readonly reason: string }
  | { readonly kind: 'unknown'; readonly message: string }

export type StartTaskRequest = {
  readonly prompt: string
  readonly repositoryId: RepositoryId
  readonly harnessId: HarnessId
  readonly modelId: ModelId
  readonly access: AccessLevel
}

export type ObservationHandle = {
  readonly id: ObservationId
  cancel(): void
}
