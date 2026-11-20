import type { TaskId } from './ids'
import type { AccessLevel } from './types'
import type {
  TaskApprovalRequest,
  TaskApprovalSummary,
} from './taskApproval'
import type { TaskMessage } from './taskMessaging'
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
 * Enforcement block of a task record, field names following the contract
 * (`os_enforced`, `writes_confined`, `local_commit`, `publish_attempts_allowed`,
 * `network_access`). A record that predates persisted enforcement carries only
 * `freedom` and a `note`; it restates nothing.
 */
export type TaskEnforcement =
  | {
      readonly recorded: true
      readonly freedom: string
      readonly mechanism: string
      readonly osEnforced: boolean
      readonly writesConfined: boolean
      readonly localCommit?: 'denied' | 'allowed' | 'not_enforced'
      readonly publishAttemptsAllowed: boolean
      readonly networkAccess: string
    }
  | {
      readonly recorded: false
      readonly freedom: string
      readonly note: string
    }

/**
 * Continuity evidence from `supervision.adopted_after_restart`. The contract's
 * previous/current server fields are kept when reported; none is displayed.
 */
export type TaskContinuity = {
  readonly adoptedAfterRestart: true
  readonly at: string | null
  readonly previousServer?: string
  readonly currentServer?: string
}

/** Launch has no task record yet because it is waiting for slot resources. */
export type TaskLaunchWait = 'resources'

/** One line of tool output; `marker` is a leading outcome word such as FAILED. */
export type ConversationOutputLine = {
  readonly marker?: string
  readonly text: string
}

/** Approved M05 conversation rows — fixture evidence, never HTML. */
export type ConversationItem =
  | {
      readonly kind: 'agent'
      readonly paragraphs: readonly (readonly InlineRun[])[]
    }
  | {
      readonly kind: 'tool'
      readonly tool: 'file' | 'pencil' | 'terminal'
      readonly summary: readonly InlineRun[]
      readonly output?: readonly ConversationOutputLine[]
    }
  | { readonly kind: 'working'; readonly label: string }
  | { readonly kind: 'separator'; readonly label: string }

/**
 * Stored request plus the agent conversation read for the task screen
 * (HarflowDesign m05-proposal `transcript(...)`). Separate from the captured
 * activity `transcript`, which backs the D2B reading states and Events.
 */
export type TaskConversation = {
  readonly request: string
  readonly items: readonly ConversationItem[]
}

/** Parent task lineage when this observation is a sub-task. */
export type TaskParentLineage = {
  readonly taskId: TaskId
  readonly title: string
}

/** Repository identity observed for the task (name for menus; path for copy). */
export type TaskRepository = {
  readonly name: string
  readonly path: string
}

/**
 * A task this run started in an earlier turn that was still running when the
 * task list was last read. Client-derived "won't be stopped" copy uses this;
 * it is not an engine cancel-result field.
 */
export type EarlierTurnRunningTask = {
  readonly taskId: TaskId
  readonly title: string
}

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
  /**
   * When the adapter read this status (ISO-8601). Not an engine status
   * field: ages such as the held-resource age are relative to it.
   */
  readonly observedAt?: string
  /** Observed run duration in seconds; presentation formats the badge clock. */
  readonly elapsedSeconds?: number
  /** Number of turns in the continuation chain, when the engine reports it. */
  readonly turnCount?: number
  /** Set while a pending launch has no record because it waits for resources. */
  readonly launchWait?: TaskLaunchWait
  /** Stored request and agent conversation for the M05 task column. */
  readonly conversation?: TaskConversation
  readonly failure?: TaskFailureExplanation
  readonly summary?: TaskSummary
  readonly transcript: TranscriptObservation
  /**
   * Which right-pane surface this observation supports.
   * Transcript redraws use Events; completed Changes fixture uses Changes.
   */
  readonly detailsPane: 'events' | 'changes' | null
  /** Parent lineage when this task was started by another task. */
  readonly parent?: TaskParentLineage
  /** Repository name and path when the observation records one. */
  readonly repository?: TaskRepository
  /**
   * Access level observed as enforced for this task. Presentation maps it to
   * a label; when absent, nothing that needs it (Take over) is offered.
   */
  readonly accessLevel?: AccessLevel
  /**
   * Task-list read: tasks this run started in earlier turns that were running
   * when last read. Presentation derives the labelled "won't be stopped" list.
   */
  readonly earlierTurnRunningTasks?: readonly EarlierTurnRunningTask[]
  /** Enforcement reporting when the engine recorded it for this task. */
  readonly enforcement?: TaskEnforcement
  /** Status notices listed in Events facts; omitted means none. */
  readonly notices?: readonly string[]
  /** Present only when the engine reported adopted-after-restart. */
  readonly continuity?: TaskContinuity
  /**
   * Whole-task `resources` on status (`held` / `released`). Absent when the
   * task asked for none. Presentation draws the inline resource card.
   */
  readonly resources?: TaskResources
  /**
   * Status `messages` ledger when messaging.v1 is offered. Empty or absent
   * means no retained records; delivered/cancelled keep metadata only.
   * Data only: it does not gate any control.
   */
  readonly messages?: readonly TaskMessage[]
  /**
   * The approval request drawn at the end of the task transcript.
   * Absent means no card. Typed respond refusals are session chrome, not here.
   */
  readonly approval?: TaskApprovalRequest
  /**
   * Additive `approval_summary` facts. `awaitingDecisionCount` drives the
   * topbar Needs you badge and the sidebar attention glyph for this task.
   */
  readonly approvalSummary?: TaskApprovalSummary
}

/**
 * Additive status `resources` object (HarflowMCP docs/contracts.md): `names`,
 * `reservation_id`, `state` (`held` | `released`), `granted_at`. Only the
 * fields the task card reads are modelled; times are ISO-8601 strings.
 */
export type TaskResources = {
  readonly names: readonly string[]
  readonly reservationId: string
  readonly state: 'held' | 'released'
  /** When the reservation was granted (`granted_at`). */
  readonly grantedAt?: string
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