/**
 * Shared task-approval registry for Needs you and the task screen.
 * Owns in-flight keys plus non_actionable / answered / refusal entries so
 * both surfaces see the same request state.
 */
import type {
  ApprovalDecision,
  ApprovalRefreshResult,
  ApprovalRespondOutcome,
  TaskApprovalRequest,
  TaskId,
} from '../model'
import {
  retainedApprovalChrome,
  type TaskApprovalChrome,
  type TaskApprovalEntry,
} from './taskApprovalChrome'
import {
  taskApprovalRefreshedChrome,
  taskApprovalRespondedChrome,
} from './taskApprovalRespondCore'

export function taskApprovalFlightKey(
  taskId: string,
  requestId: string,
): string {
  return `${taskId}\u0000${requestId}`
}

/**
 * One shared store injected into TaskApprovalCommands and NeedsYouCommands.
 */
export class TaskApprovalRegistry {
  private entries: readonly TaskApprovalEntry[] = []
  private readonly inFlight = new Set<string>()
  private respondEvents = 0

  asChrome(submitting = false): TaskApprovalChrome {
    return {
      entries: this.entries,
      submitting,
      focusResultSeq: 0,
    }
  }

  /** Drop typed refusals; keep non_actionable and answered. */
  retainNonRefusal(): TaskApprovalChrome {
    const next = retainedApprovalChrome(this.asChrome())
    this.entries = next.entries
    return next
  }

  /**
   * Record a respond acknowledgement. The returned chrome never carries a
   * focus counter: the host owns its own `focusResultSeq` and bumps it from
   * its current value when `requestFocus` is true.
   */
  applyRespond(
    taskId: TaskId,
    sent: Pick<TaskApprovalRequest, 'requestId' | 'ownerRevision'>,
    decision: ApprovalDecision,
    outcome: ApprovalRespondOutcome,
    selectedTaskId: string | null,
  ): {
    readonly chrome: TaskApprovalChrome
    readonly acceptedRequest: TaskApprovalRequest | null
    readonly requestFocus: boolean
  } {
    const result = taskApprovalRespondedChrome(
      this.asChrome(),
      taskId,
      sent,
      decision,
      outcome,
      selectedTaskId,
    )
    this.entries = result.chrome.entries
    return {
      chrome: { ...result.chrome, focusResultSeq: 0 },
      acceptedRequest: result.acceptedRequest,
      requestFocus: result.chrome.focusResultSeq > 0,
    }
  }

  /** Apply a refresh result; focus is the host's to bump when `request` is set. */
  applyRefresh(
    taskId: TaskId,
    requestId: string,
    result: ApprovalRefreshResult,
  ): {
    readonly chrome: TaskApprovalChrome
    readonly request: TaskApprovalRequest | null
  } {
    const next = taskApprovalRefreshedChrome(
      this.asChrome(),
      taskId,
      requestId,
      result,
    )
    this.entries = next.chrome.entries
    return { chrome: { ...next.chrome, focusResultSeq: 0 }, request: next.request }
  }

  /**
   * Merge seeded entries by task id: entries for the seeded tasks are
   * replaced, entries for other tasks stay.
   */
  mergeSeedEntries(entries: readonly TaskApprovalEntry[]): void {
    const seeded = new Set(entries.map((e) => e.taskId))
    this.entries = [
      ...this.entries.filter((e) => !seeded.has(e.taskId)),
      ...entries,
    ]
  }

  isInFlight(taskId: string, requestId: string): boolean {
    return this.inFlight.has(taskApprovalFlightKey(taskId, requestId))
  }

  /**
   * Start a respond. Returns false when already in flight.
   * Bumps the respond generation so a refresh across it is stale.
   */
  beginRespond(taskId: string, requestId: string): boolean {
    const key = taskApprovalFlightKey(taskId, requestId)
    if (this.inFlight.has(key)) return false
    this.inFlight.add(key)
    this.respondEvents += 1
    return true
  }

  endRespond(taskId: string, requestId: string): void {
    this.inFlight.delete(taskApprovalFlightKey(taskId, requestId))
    this.respondEvents += 1
  }

  respondGeneration(): number {
    return this.respondEvents
  }
}
