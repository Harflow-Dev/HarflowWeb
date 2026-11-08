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

export type TranscriptRow = {
  readonly id: string
  readonly sourceEpoch: string
  readonly windowEpoch: number
  readonly occurrence: number
  readonly seq: number
  readonly type: TranscriptRowType
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
}

/** Full original assignment text from the Design specimen. */
export const TRANSCRIPT_REQUEST_TEXT =
  'Find and fix the slot release race. Keep notification under the lock. Add a deterministic regression. Preserve unrelated edits. Report the exact focused validation result and any remaining uncertainty before concluding.'
