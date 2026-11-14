import type { TaskId } from './ids'
import type { TranscriptObservation } from './transcript'

/** Inline run of plain or code-styled text — never HTML. */
export type InlineRun =
  | { readonly kind: 'text'; readonly value: string }
  | { readonly kind: 'code'; readonly value: string }

export type AgentParagraph = {
  readonly kind: 'paragraph'
  readonly runs: readonly InlineRun[]
}

export type AgentList = {
  readonly kind: 'list'
  readonly items: readonly (readonly InlineRun[])[]
}

export type AgentSegment = AgentParagraph | AgentList

export type TaskFailureExplanation = {
  readonly title: string
  readonly intro: string
  readonly lastError: string
}

/** Approved summary section — fixture evidence only. */
export type TaskSummary = {
  readonly heading: string
  readonly segments: readonly AgentSegment[]
}

/** Closed engine task status vocabulary. */
export type EngineTaskStatus =
  | 'running'
  | 'completed'
  | 'failed'
  | 'timed_out'
  | 'cancelled'
  | 'pending'
  | 'taken_over'

export type TaskStatusRead =
  | { readonly kind: 'unread' }
  | { readonly kind: 'observed'; readonly status: EngineTaskStatus }

export type TaskSupervision = 'owner_lost' | 'unverified'

/**
 * Task screen observation — domain facts only.
 * Presentation maps badge, notices, banners, and composer chrome.
 */
export type TaskObservation = {
  readonly taskId: TaskId
  readonly title: string
  readonly headerMeta: string
  readonly statusRead: TaskStatusRead
  readonly supervision?: TaskSupervision
  /** When false, terminal status is reported without an observed process exit. */
  readonly exitObserved?: boolean
  /** Post-finish grace while last events or capture may still arrive. */
  readonly settling?: boolean
  /** Clock suffix on the badge when the engine reports one (e.g. `04:12`). */
  readonly elapsedLabel?: string
  /** Continue answered but the successor record is not yet reliable. */
  readonly continuationOutcome?: 'unknown'
  /** Engine refusal text when Continue was rejected. */
  readonly continueRefusedReason?: string
  readonly failure?: TaskFailureExplanation
  readonly summary?: TaskSummary
  readonly transcript: TranscriptObservation
  /**
   * Which right-pane surface this observation supports.
   * Transcript redraws use Events; completed Changes fixture uses Changes.
   */
  readonly detailsPane: 'events' | 'changes' | null
}

export type TaskLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable'; readonly message: string }
  | { readonly kind: 'ready'; readonly observation: TaskObservation }

/** Observed engine status when the read succeeded; null when unread. */
export function observedEngineStatus(
  read: TaskStatusRead,
): EngineTaskStatus | null {
  return read.kind === 'observed' ? read.status : null
}