import { useEffect, useRef, type RefObject } from 'react'
import type { ApprovalDecision } from '../model'
import {
  APPROVAL_COPY,
  type TaskApprovalCardView,
} from '../presentation'
import { Icon } from './Icon'

type Props = {
  readonly view: TaskApprovalCardView
  readonly focusResultSeq: number
  readonly onRespond: (decision: ApprovalDecision) => void
  readonly onRefresh: () => void
}

/**
 * Task-transcript approval card (hd-approval*). Result is role="status" with
 * no aria-live — StatusRegion stays the only live region.
 */
export function TaskApprovalCard({
  view,
  focusResultSeq,
  onRespond,
  onRefresh,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const resultRef = useRef<HTMLDivElement | null>(null)
  // After a respond or a Refresh the card keeps focus: the result block, else
  // the card itself. Never a decision button, so a second Enter cannot
  // approve an action the person has not reviewed.
  useEffect(() => {
    if (focusResultSeq <= 0) return
    ;(resultRef.current ?? rootRef.current)?.focus()
  }, [focusResultSeq])

  const className = view.settled
    ? 'hd-approval hd-approval--settled'
    : 'hd-approval'

  return (
    <div
      className={className}
      role="group"
      aria-label={APPROVAL_COPY.ariaLabel}
      tabIndex={-1}
      ref={rootRef}
    >
      <div className="hd-approval__head">
        <Icon name={view.headIcon} size="sm" />
        <span>{view.actionLabel}</span>
        {view.showSource ? (
          <span className="hd-approval__src">{view.source}</span>
        ) : null}
      </div>
      <div className="hd-approval__body">
        <div className="hd-approval__cmd">{view.command}</div>
        <div className="hd-approval__meta">{view.cwdMeta}</div>
        {view.reasonLine ? (
          <p style={{ margin: 0, fontSize: 13, lineHeight: '20px' }}>
            {view.reasonLine}
          </p>
        ) : null}
      </div>
      {view.mode.kind === 'decide' ? (
        <div className="hd-approval__actions">
          <button
            type="button"
            className="hd-btn hd-btn--primary"
            disabled={view.mode.disabled}
            onClick={() => onRespond('approve')}
          >
            {APPROVAL_COPY.approveOnce}
          </button>
          <button
            type="button"
            className="hd-btn hd-btn--ghost"
            disabled={view.mode.disabled}
            onClick={() => onRespond('reject')}
          >
            {APPROVAL_COPY.reject}
          </button>
        </div>
      ) : (
        <ResultBlock
          title={view.mode.title}
          lines={view.mode.lines}
          refresh={view.mode.refresh}
          refreshDisabled={view.mode.refreshDisabled}
          resultRef={resultRef}
          onRefresh={onRefresh}
        />
      )}
    </div>
  )
}

function ResultBlock({
  title,
  lines,
  refresh,
  refreshDisabled,
  resultRef,
  onRefresh,
}: {
  readonly title: string | null
  readonly lines: readonly string[]
  readonly refresh: boolean
  readonly refreshDisabled: boolean
  readonly resultRef: RefObject<HTMLDivElement | null>
  readonly onRefresh: () => void
}) {
  const showResult = title !== null || lines.length > 0
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
      {refresh ? (
        <div className="hd-approval__actions">
          <button
            type="button"
            className="hd-btn hd-btn--secondary"
            disabled={refreshDisabled}
            onClick={onRefresh}
          >
            {APPROVAL_COPY.refresh}
          </button>
        </div>
      ) : null}
    </>
  )
}
