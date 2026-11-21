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
  EMPTY_TASK_APPROVAL,
  approvalEntryFor,
  retainedApprovalChrome,
  withApprovalEntry,
  withoutApprovalRefusal,
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

  /** Chrome snapshot with a focus bump when the open task matches. */
  withEntry(
    entry: TaskApprovalEntry,
    selectedTaskId: string | null,
  ): TaskApprovalChrome {
    const next = withApprovalEntry(
      { ...EMPTY_TASK_APPROVAL, entries: this.entries },
      entry,
      selectedTaskId,
    )
    this.entries = next.entries
    return { ...next, submitting: false }
  }

  withoutRefusal(taskId: string, requestId: string): TaskApprovalChrome {
    const next = withoutApprovalRefusal(
      { ...EMPTY_TASK_APPROVAL, entries: this.entries },
      taskId,
      requestId,
    )
    this.entries = next.entries
    return { ...next, submitting: false }
  }

  entryFor(
    taskId: string,
    request: TaskApprovalRequest,
  ): TaskApprovalEntry | null {
    return approvalEntryFor(this.asChrome(), taskId, request)
  }

  /** Drop typed refusals; keep non_actionable and answered. */
  retainNonRefusal(): TaskApprovalChrome {
    const next = retainedApprovalChrome(this.asChrome())
    this.entries = next.entries
    return next
  }

  /** Replace the full entry list (seeds). */
  replaceEntries(entries: readonly TaskApprovalEntry[]): void {
    this.entries = entries
  }

  applyRespond(
    taskId: TaskId,
    sent: Pick<TaskApprovalRequest, 'requestId' | 'ownerRevision'>,
    decision: ApprovalDecision,
    outcome: ApprovalRespondOutcome,
    selectedTaskId: string | null,
  ): {
    readonly chrome: TaskApprovalChrome
    readonly acceptedRequest: TaskApprovalRequest | null
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
    return result
  }

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
    return next
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

  hasAnyInFlight(): boolean {
    return this.inFlight.size > 0
  }
}
