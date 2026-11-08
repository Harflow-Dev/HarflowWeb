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
}
