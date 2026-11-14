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
  /** Open the right pane (Events for transcript states; Changes otherwise). */
  readonly eventsPaneOpen?: boolean
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
