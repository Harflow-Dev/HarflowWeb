import type { ReactNode, RefObject } from 'react'
import { APPROVAL_COPY } from '../presentation/taskApprovalCopy'
import type { NeedsYouCheckpointCardView } from '../presentation/needsYouCheckpointCardView'
import type { NeedsYouTaskApprovalCardView } from '../presentation/needsYouApprovalCardView'
import { Icon } from './Icon'
import type { NeedsYouCardActions } from './NeedsYouCard'

export function ApprovalHead({
  view,
}: {
  readonly view: NeedsYouTaskApprovalCardView
}) {
  return (
    <div className="hd-approval__head">
      <Icon name={view.headIcon} />
      <span>{view.actionLabel}</span>
      {view.showSource ? (
        <span className="hd-approval__src">{view.source}</span>
      ) : null}
    </div>
  )
}

export function SettledActions({
  title,
  lines,
  refresh,
  refreshDisabled,
  resultRef,
  onRefresh,
  openLink,
}: {
  readonly title: string | null
  readonly lines: readonly string[]
  readonly refresh: boolean
  readonly refreshDisabled: boolean
  readonly resultRef: RefObject<HTMLDivElement | null>
  readonly onRefresh: () => void
  readonly openLink: ReactNode
}) {
  const showResult = title !== null || lines.length > 0
  const showActions = refresh || openLink !== null
  return (
    <>
      {showResult ? (
        <div
          className="hd-approval__result"
          role="status"
          tabIndex={-1}
          ref={resultRef}
        >
          {title ? (
            <p className="hd-approval__result-title">{title}</p>
          ) : null}
          {lines.map((line, index) => (
            // Lines are positional facts and may repeat; the index is stable.
            // oxlint-disable-next-line react/no-array-index-key
            <p key={`${index}:${line}`}>{line}</p>
          ))}
        </div>
      ) : null}
      {showActions ? (
        <div className="hd-approval__actions">
          {refresh ? (
            <button
              type="button"
              className="hd-btn hd-btn--secondary"
              disabled={refreshDisabled}
              onClick={onRefresh}
            >
              {APPROVAL_COPY.refresh}
            </button>
          ) : null}
          <span style={{ flex: 1 }} />
          {openLink}
        </div>
      ) : null}
    </>
  )
}

export function OpenLink({
  link,
  actions,
}: {
  readonly link:
    | NeedsYouTaskApprovalCardView['openLink']
    | NeedsYouCheckpointCardView['openLink']
  readonly actions: NeedsYouCardActions
}) {
  if (link.kind === 'task') {
    return (
      <button
        type="button"
        className="hd-btn hd-btn--ghost"
        aria-label={`Open task ${link.title}`}
        onClick={() => actions.onOpenTask(link.taskId)}
      >
        <Icon name="external" />
        Open task
      </button>
    )
  }
  if (link.kind === 'run') {
    return (
      <button
        type="button"
        className="hd-btn hd-btn--ghost"
        aria-label={`Open run ${link.title}`}
        onClick={() => actions.onOpenRun(link.runId)}
      >
        <Icon name="external" />
        Open run
      </button>
    )
  }
  const label = link.kind === 'task_unavailable' ? 'Open task' : 'Open run'
  return (
    <button
      type="button"
      className="hd-btn hd-btn--ghost"
      aria-label={`${label} ${link.title}`}
      disabled
      aria-disabled="true"
      style={{ opacity: 0.45, cursor: 'default' }}
    >
      <Icon name="external" />
      {label}
    </button>
  )
}
