import type {
  TaskChangesEntryRef,
  TaskChangesTextObservation,
  TaskId,
} from '../../model'

/** Command lifecycle chrome a preview scenario seeds on its open task. */
export type TaskCommandChromeSeed =
  | 'stop-requested'
  | 'continue-starting'
  | 'continue-started'
  | 'continue-unknown'

/** Structural mirror of presentation `TaskChangesTurnMember` (turn lineage chrome). */
export type TaskChangesTurnSeed = {
  readonly taskId: TaskId
  readonly turnIndex: number
  readonly turnCount: number
  readonly current: boolean
}

/** Structural mirror of presentation `TaskChangesTextPanel` (specimen chrome). */
export type TaskChangesTextPanelSeed =
  | { readonly kind: 'loading'; readonly entry: TaskChangesEntryRef }
  | { readonly kind: 'chunk'; readonly text: TaskChangesTextObservation }
  | { readonly kind: 'refusal'; readonly entry: TaskChangesEntryRef }

/** Changes-pane chrome a preview scenario seeds after the pane opens. */
export type TaskChangesChromeSeed = {
  readonly selectedEntry?: TaskChangesEntryRef | null
  readonly turnTaskId?: TaskId | null
  readonly expandedRepos?: readonly string[]
  /** Turn lineage drawn by the turn picker (not a task-changes.v1 field). */
  readonly turns?: readonly TaskChangesTurnSeed[]
  /** Stacked text-mode specimen drawn instead of the list. */
  readonly textPanels?: readonly TaskChangesTextPanelSeed[]
}

/**
 * Presentation seed applied by the preview composition after context is ready.
 * Observation still owns qualification and start outcomes; this only sets
 * session chrome that the specimen shows already open or customized.
 * Field unions mirror presentation task-option and OpenMenu values without
 * importing the presentation layer.
 */
export type NewTaskScenarioSeed = {
  readonly prompt?: string
  readonly optionsOpen?: boolean
  readonly openMenu?: 'repository' | 'harness' | 'access' | null
  readonly turns?: string
  readonly effort?:
    | 'default'
    | 'low'
    | 'medium'
    | 'high'
    | 'xhigh'
    | 'unsupported'
  readonly approvals?: 'harness' | 'caller' | 'none'
  readonly sidebarCollapsed?: boolean
  /** Preview frame size matching Design centered-minimum (1000×620). */
  readonly frame?: 'default' | 'minimum'
  /** Submit once after ready so starting/refused specimens are observation-driven. */
  readonly autoSubmit?: boolean
  /** Open a mapped task after context is ready (transcript scenarios). */
  readonly openTaskId?: string
  /** Stop or Continue command lifecycle chrome after the task observation is ready. */
  readonly taskCommandChrome?: TaskCommandChromeSeed
  /**
   * Transient messaging command outcome for the open task (session chrome:
   * the status ledger offers no event-level outcome, so the mock seeds it).
   */
  readonly taskMessagingOutcome?: 'cancelled' | 'delivered'
  /** Send-now refusals from send acknowledgements, keyed by message id. */
  readonly taskSendNowRefusals?: readonly {
    readonly messageId: string
    readonly code: string
    readonly message: string
  }[]
  /** Open the task overflow More-actions menu after the observation is ready. */
  readonly taskOverflowMenuOpen?: boolean
  /** Screen identity: the approved transcript routes draw no More anchor. */
  readonly taskOverflowAnchorOmitted?: boolean
  /** Open a task confirmation dialog after the observation is ready. */
  readonly taskDialog?: 'stop' | 'takeover'
  /** Open the right pane (Events for transcript states; Changes otherwise). */
  readonly eventsPaneOpen?: boolean
  /**
   * Open the pane while the task observation is still deferred (loading-pane).
   * Requires `eventsPaneOpen`.
   */
  readonly openPaneWhileLoading?: boolean
  /** Active pane tab after the pane opens (M05 Changes ↔ Events). */
  readonly paneTab?: 'changes' | 'events'
  /** Expand an Events facts group (top-bar chip reveal). */
  readonly eventsFactsReveal?: 'enforcement' | 'notices' | 'continuity'
  /** Seed Changes-pane selection / expansion after the pane is open. */
  readonly changesChrome?: TaskChangesChromeSeed
  /**
   * After the Events read is ready, ask for the older page once (what a
   * person's Load earlier does). The mock engine answers per task.
   */
  readonly eventsLoadEarlier?: boolean
  /** Navigate to a main route after context is ready. */
  readonly openRoute?:
    | 'new-task'
    | 'workflows'
    | 'resources'
    | 'statistics'
    | 'settings'
    | 'needs-you'
    | 'pending-launches'
  readonly openWorkflowEditorId?: string
  /** Select a node after the editor observation is ready (e.g. orchestrator). */
  readonly openWorkflowEditorNodeId?: string
  readonly openWorkflowExecutionId?: string
  readonly openParallelGroupId?: string
  /** Parallel group chrome after the group observation is ready. */
  readonly parallelGroupShowPrompt?: boolean
  readonly parallelGroupOpenMenuLaneId?: string | null
  readonly parallelGroupCancelAllConfirm?: boolean
  /** Queued-message Cancel outcome kind, scoped to one lane (command result; preview only). */
  readonly parallelGroupQueuedCancelOutcome?: {
    readonly laneId: string
    readonly kind: 'cancelled'
  }
  /** Open Pending launches (inventory or a launch detail). */
  readonly openPendingLaunches?: boolean
  readonly openPendingLaunchId?: string
  readonly pendingLaunchStopConfirm?: boolean
  /** Prior Stop request outcome shown on the detail (result of the Stop command). */
  readonly pendingLaunchStopOutcome?: 'requested' | 'uncertain' | 'refused'
  readonly workflowRunView?: 'graph' | 'parallel'
  readonly settingsSection?: 'general' | 'harnesses'
  /** Harness id whose MCP approvals start expanded (Settings Harnesses). */
  readonly settingsExpandedHarnessId?: string
}
