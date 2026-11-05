import type {
  ContextLoad,
  ObservationHandle,
  StartTaskOutcome,
  StartTaskRequest,
} from '../model'

/**
 * Smallest domain EnginePort for this slice.
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
   * Request a task start. Outcomes distinguish accepted / refused / unknown.
   * Unknown forbids automatic retry.
   */
  startTask(request: StartTaskRequest): Promise<StartTaskOutcome>
}
