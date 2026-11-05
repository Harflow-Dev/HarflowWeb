import type {
  ContextLoad,
  ObservationHandle,
  ResourcesLoad,
  StartTaskOutcome,
  StartTaskRequest,
  StatisticsLoad,
  StatisticsRangeId,
  WorkflowsLoad,
} from '../model'

/**
 * Slice-sized EnginePort: new-task, workflows, resources, and statistics.
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
   * Request a task start. Outcomes distinguish accepted / refused / unknown.
   * Unknown forbids automatic retry.
   */
  startTask(request: StartTaskRequest): Promise<StartTaskOutcome>
}
