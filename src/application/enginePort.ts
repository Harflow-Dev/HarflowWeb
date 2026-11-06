import type {
  ContextLoad,
  HarnessesLoad,
  NeedsYouLoad,
  ObservationHandle,
  ResourcesLoad,
  StartTaskOutcome,
  StartTaskRequest,
  StatisticsLoad,
  StatisticsRangeId,
  TaskChangesLoad,
  TaskChangesQuery,
  TaskId,
  TaskLoad,
  WorkflowId,
  WorkflowRunContextLoad,
  WorkflowsLoad,
} from '../model'

/**
 * Slice-sized EnginePort: new-task, workflows, resources, statistics,
 * task transcript, and completed-task changes observation.
 * Future production path: browser → authenticated Web server → harflow-ctl.
 * The browser never invokes ctl, MCP, or engine SQLite directly.
 */
export type EnginePort = {
  /**
   * Read composer context and sidebar presentation data.
   * Sidebar task rows outside this slice remain unavailable destinations.
   */
  observeContext(
    onUpdate: (load: ContextLoad) => void,
  ): ObservationHandle

  /**
   * Read workflow definition summaries for the Workflows list.
   * Mock-only presentation — not a public ctl catalog claim.
   */
  observeWorkflows(
    onUpdate: (load: WorkflowsLoad) => void,
  ): ObservationHandle

  /**
   * Read run-form context for one workflow definition.
   * Unmapped ids are unavailable — never a fallback definition.
   * Mock-only — not workflow execution.
   */
  observeWorkflowRun(
    workflowId: WorkflowId,
    onUpdate: (load: WorkflowRunContextLoad) => void,
  ): ObservationHandle

  /**
   * Read harness slot usage, holders, and waiters.
   * Mock-only presentation — not a public ctl resources claim.
   */
  observeResources(
    onUpdate: (load: ResourcesLoad) => void,
  ): ObservationHandle

  /**
   * Read statistics for an explicit range. Range changes must start a new
   * observation; late responses for other ranges must be ignored by the session.
   * Mock-only presentation — not a public ctl statistics claim.
   */
  observeStatistics(
    range: StatisticsRangeId,
    onUpdate: (load: StatisticsLoad) => void,
  ): ObservationHandle

  /**
   * Read a running-task transcript for an explicit task id.
   * Unmapped ids must yield unavailable — never a fallback transcript.
   * Mock-only presentation — not a public ctl transcript protocol.
   */
  observeTask(
    taskId: TaskId,
    onUpdate: (load: TaskLoad) => void,
  ): ObservationHandle

  /**
   * Read recorded repository changes for an explicit task + selected path.
   * Unmapped ids must yield unavailable — never another task’s diff.
   * Mock-only presentation — not a public ctl changes/diff protocol.
   */
  observeTaskChanges(
    query: TaskChangesQuery,
    onUpdate: (load: TaskChangesLoad) => void,
  ): ObservationHandle

  /**
   * Read harness installation, MCP registration, and qualification.
   * The three facts stay independent. Mock-only — not a host probe,
   * not MCP approval management, and not a public ctl claim.
   */
  observeHarnesses(
    onUpdate: (load: HarnessesLoad) => void,
  ): ObservationHandle

  /**
   * Read approvals and questions that need the owner.
   * Unknown coverage is not an empty inbox.
   * Mock-only — not approval authority or a public ctl claim.
   */
  observeNeedsYou(
    onUpdate: (load: NeedsYouLoad) => void,
  ): ObservationHandle

  /**
   * Request a task start. Outcomes distinguish accepted / refused / unknown.
   * Unknown forbids automatic retry.
   */
  startTask(request: StartTaskRequest): Promise<StartTaskOutcome>
}
