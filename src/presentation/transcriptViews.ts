import {
  TRANSCRIPT_REQUEST_TEXT,
  type TranscriptHistoryKind,
  type TranscriptObservation,
  type TranscriptRequestKind,
  type TranscriptSummaryCoverage,
} from '../model'

export type RequestView = {
  readonly title: string
  readonly text: string
  readonly copyLabel: string
  readonly integrity: string
  readonly withheld: boolean
  readonly loading: boolean
  readonly unavailable: boolean
}

export type ActivityView = {
  readonly title: string
  readonly toolCount: number | null
  readonly countLabel: string
  readonly reason: string
  readonly summaryCoverage: TranscriptSummaryCoverage
}

const HISTORY_TITLES: Record<TranscriptHistoryKind, string> = {
  observed: 'Captured activity caught up',
  empty: 'No rows in the available captured history',
  loading: 'Loading captured history',
  partial: 'History incomplete · capture gap',
  unknown: 'History incomplete · unsupported record retained in Events',
  unavailable: 'Captured history unavailable · the read could not be completed',
  unsupported:
    'History unavailable · this engine does not support bounded history',
  nonprogress: 'History paused · read made no progress',
  reconnecting: 'Reconnecting · cached history is not current',
  reset: 'Activity source changed · cached history is not current',
  capacity: 'This view reached its limit. Your reading position is kept.',
  drained: 'Available captured history reached its beginning',
}

export function requestView(obs: TranscriptObservation): RequestView {
  const kind = obs.request
  const full = kind === 'sidecar' || kind === 'inline'
  const withheld =
    kind === 'loading' || kind === 'unavailable' || kind === 'integrity-failed'
  const source = obs.assignmentText || TRANSCRIPT_REQUEST_TEXT
  const text = withheld ? '' : full ? source : source.slice(0, obs.requestMaxBytes)
  return {
    title: requestTitle(kind),
    text,
    copyLabel: full
      ? 'Copy original request'
      : kind === 'preview'
        ? 'Copy preview'
        : 'Copy displayed text',
    integrity: integrityLabel(kind),
    withheld: kind === 'integrity-failed',
    loading: kind === 'loading',
    unavailable: kind === 'unavailable',
  }
}

export function activityView(obs: TranscriptObservation): ActivityView {
  let coverage = obs.summaryCoverage
  const uncertain =
    obs.captureUncertainty ||
    (!obs.currentWindow &&
      [
        'partial',
        'unknown',
        'unsupported',
        'reset',
        'reconnecting',
        'unavailable',
        'nonprogress',
      ].includes(obs.history))
  if (uncertain && (coverage === 'observed' || coverage === 'empty')) {
    coverage = 'unavailable'
  }
  if (coverage === 'empty' && hasToolEvidence(obs)) coverage = 'unavailable'
  if (obs.history === 'loading') coverage = 'loading'
  const sound = coverage === 'observed' || coverage === 'empty'
  const toolCount = sound ? (coverage === 'empty' ? 0 : 2) : null
  const title = obs.currentWindow
    ? obs.captureUncertainty
      ? 'Current activity window · captured history remains incomplete'
      : 'Current activity window · earlier rows outside this view'
    : HISTORY_TITLES[obs.history]
  return {
    title,
    toolCount,
    countLabel:
      coverage === 'loading'
        ? 'Loading tool activity'
        : sound
          ? coverage === 'empty'
            ? 'No tool calls observed in the available captured history'
            : '2 tool calls observed'
          : 'Tool activity unavailable',
    reason:
      coverage === 'limited'
        ? 'The activity summary reached its limit; tool activity totals are unavailable.'
        : sound
          ? 'Observed in available captured history traversed from its beginning to the current boundary; this does not prove complete execution capture.'
          : 'Capture coverage is insufficient for a tool count.',
    summaryCoverage: coverage,
  }
}

function hasToolEvidence(obs: TranscriptObservation): boolean {
  return obs.rows.some(
    (row) => row.type === 'tool_result' || row.type === 'unsupported',
  )
}

function requestTitle(kind: TranscriptRequestKind): string {
  switch (kind) {
    case 'sidecar':
    case 'inline':
      return 'Original request'
    case 'preview':
      return 'Request preview'
    case 'integrity-failed':
      return 'Original request · integrity check failed'
    case 'loading':
      return 'Original request · loading'
    case 'unavailable':
      return 'Original request unavailable'
    default:
      return 'Partial request'
  }
}

function integrityLabel(kind: TranscriptRequestKind): string {
  switch (kind) {
    case 'sidecar':
      return 'Verified stored request · complete'
    case 'inline':
      return 'Complete stored request'
    case 'unverified':
      return 'Unverified text · completeness unknown'
    case 'truncated':
      return 'Bounded prefix · truncated'
    case 'preview':
      return 'Preview only · not the full assignment'
    default:
      return ''
  }
}
