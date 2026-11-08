/**
 * Task transcript observation surface (HarflowDesign 854caae
 * task/transcript-* redraws). Read results are independent of execution status.
 */

export type TranscriptRequestKind =
  | 'sidecar'
  | 'inline'
  | 'preview'
  | 'unverified'
  | 'truncated'
  | 'loading'
  | 'unavailable'
  | 'integrity-failed'

export type TranscriptHistoryKind =
  | 'observed'
  | 'empty'
  | 'loading'
  | 'partial'
  | 'unknown'
  | 'unavailable'
  | 'unsupported'
  | 'nonprogress'
  | 'reconnecting'
  | 'reset'
  | 'capacity'
  | 'drained'

export type TranscriptSummaryCoverage =
  | 'observed'
  | 'empty'
  | 'loading'
  | 'unavailable'
  | 'limited'

export type TranscriptRowType =
  | 'message'
  | 'tool_result'
  | 'unsupported'

/** One captured activity row. Content is observation-owned (mock fixtures). */
export type TranscriptRow = {
  readonly id: string
  readonly sourceEpoch: string
  readonly windowEpoch: number
  readonly occurrence: number
  readonly seq: number
  readonly type: TranscriptRowType
  /** Stable scroll-anchor identity (`data-row`), independent of array index. */
  readonly anchorId: string
  readonly title: string
  readonly body: string
  readonly toolSummary?: string
  readonly toolBody?: string
  readonly disclosure?: string
}

export type NormalizedEventRecord = {
  readonly format: string
  readonly v: number
  readonly product: string
  readonly product_version: string
  readonly seq: number
  readonly observed_at: string
  readonly kind: string
  readonly call_id?: string
  readonly ok?: boolean
  readonly output_tail?: string
  readonly truncated?: boolean
  readonly oversized?: boolean
  readonly bytes?: number
}

export type TranscriptObservation = {
  readonly request: TranscriptRequestKind
  /** Full assignment text when the request read succeeds. */
  readonly assignmentText: string
  /** Bytes shown for truncated/unverified prefixes (specimen 64→128). */
  readonly requestMaxBytes: number
  readonly history: TranscriptHistoryKind
  readonly summaryCoverage: TranscriptSummaryCoverage
  readonly captureUncertainty: boolean
  readonly sourceEpoch: string
  readonly pendingSourceEpoch: string | null
  readonly windowEpoch: number
  readonly rows: readonly TranscriptRow[]
  readonly olderLoaded: boolean
  readonly freshShown: boolean
  readonly currentWindow: boolean
  readonly liveMessage: string
  readonly recoveredMessage: string
  readonly normalizedRecord: NormalizedEventRecord | null
  readonly stubRecord: NormalizedEventRecord | null
  readonly ordering: readonly { readonly kind: string; readonly seq: number }[]
  /**
   * Task-owned prototypes for local reading actions. Presentation never invents
   * their content — Load earlier / New / rebase copy these from the observation.
   */
  readonly earlierPrototype: TranscriptRow | null
  readonly freshPrototype: TranscriptRow | null
  readonly currentWindowPrototype: TranscriptRow | null
}

/** Full original assignment text from the Design specimen. */
export const TRANSCRIPT_REQUEST_TEXT =
  'Find and fix the slot release race. Keep notification under the lock. Add a deterministic regression. Preserve unrelated edits. Report the exact focused validation result and any remaining uncertainty before concluding.'

export const TRANSCRIPT_TOOL_BODY = `Mock focused regression
Arrange: hold the release lock
Start a waiting consumer
Release and notify under the lock
Assert: consumer observes the free slot
Result: deterministic race reproduced
Patch: notification moved under lock
Result after patch: focused regression passed`
