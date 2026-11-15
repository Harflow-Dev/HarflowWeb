import { useLayoutEffect, useRef } from 'react'
import type { TaskEventsObservation, TaskEventsRecord } from '../model'
import type { EventsEarlierState } from '../presentation'
import { eventRecordTitle } from '../presentation/taskEventsRecords'
import {
  EVENTS_ACTIVITY_CAPTION,
  EVENTS_ACTIVITY_COUNT,
  EVENTS_ACTIVITY_HEADING,
  EVENTS_BEGINNING,
  EVENTS_EMPTY_CAPTION,
  EVENTS_EMPTY_ROWS,
  EVENTS_HISTORY_UNAVAILABLE,
  EVENTS_LOAD_EARLIER,
  EVENTS_PAGE_ERROR,
  EVENTS_RECORDS_CAPTION,
  EVENTS_RECORDS_HEADING,
  EVENTS_RECOVERED_CAPTION,
  EVENTS_RECOVERED_HEADING,
} from '../presentation/taskEventsCopy'
import { ChangesAction, ChangesPaneNote } from './TaskChangesChrome'
import {
  captureVisibleAnchor,
  restoreVisibleAnchor,
  type VisibleAnchor,
} from './transcriptScroll'

type Props = {
  readonly observation: TaskEventsObservation
  readonly earlier: EventsEarlierState
  readonly onLoadEarlier: () => void
  readonly onUnavailable: (label: string) => void
}

/** Captured activity facts, paging chrome, records, recovered note. */
export function TaskEventsRecords({
  observation,
  earlier,
  onLoadEarlier,
  onUnavailable,
}: Props) {
  const scroller = useRef<HTMLElement | null>(null)
  const anchor = useRef<VisibleAnchor | null>(null)
  const olderCount = earlier.records.length
  // Keep the first visible record where it was when older records are added.
  useLayoutEffect(() => {
    if (anchor.current === null) return
    const pending = anchor.current
    anchor.current = null
    restoreVisibleAnchor(scroller.current, pending)
  }, [olderCount])

  if (observation.log.state === 'unavailable') {
    return <HistoryUnavailable onUnavailable={onUnavailable} />
  }
  const hasOlder =
    earlier.status === 'loaded' ? earlier.hasOlder : observation.hasOlder
  if (observation.records.length === 0 && !hasOlder && olderCount === 0) {
    return (
      <>
        <h3 className="hd-m05-h">{EVENTS_RECORDS_HEADING}</h3>
        <p>{EVENTS_EMPTY_ROWS}</p>
        <p className="hd-m05-caption">{EVENTS_EMPTY_CAPTION}</p>
      </>
    )
  }
  const records = [...earlier.records, ...observation.records]
  function loadEarlier(button: HTMLElement): void {
    scroller.current = button.closest<HTMLElement>('.hd-m05-panescroll')
    anchor.current = captureVisibleAnchor(scroller.current)
    onLoadEarlier()
  }
  return (
    <>
      {observation.toolCallsObserved !== undefined ? (
        <ActivityFacts count={observation.toolCallsObserved} />
      ) : null}
      <h3 className="hd-m05-h">{EVENTS_RECORDS_HEADING}</h3>
      <p className="hd-m05-caption">{EVENTS_RECORDS_CAPTION}</p>
      <EarlierChrome
        status={earlier.status}
        hasOlder={hasOlder}
        onLoadEarlier={loadEarlier}
        onUnavailable={onUnavailable}
      />
      {records.map((record) => (
        <EventRecord key={record.seq} record={record} />
      ))}
      {observation.recoveredTranscript === true ? (
        <>
          <h3 className="hd-m05-h">{EVENTS_RECOVERED_HEADING}</h3>
          <p className="hd-m05-caption">{EVENTS_RECOVERED_CAPTION}</p>
        </>
      ) : null}
    </>
  )
}

function ActivityFacts({ count }: { readonly count: number }) {
  return (
    <>
      <h3 className="hd-m05-h">{EVENTS_ACTIVITY_HEADING}</h3>
      <p>{EVENTS_ACTIVITY_COUNT(count)}</p>
      <p className="hd-m05-caption">{EVENTS_ACTIVITY_CAPTION}</p>
    </>
  )
}

function EarlierChrome({
  status,
  hasOlder,
  onLoadEarlier,
  onUnavailable,
}: {
  readonly status: EventsEarlierState['status']
  readonly hasOlder: boolean
  readonly onLoadEarlier: (button: HTMLElement) => void
  readonly onUnavailable: (label: string) => void
}) {
  if (status === 'error') {
    // The design draws the note where the Load earlier button was: inside the
    // paging row, so it is inset like that row.
    return (
      <div className="hd-m05-more">
        <ChangesPaneNote
          tone="warn"
          title={EVENTS_PAGE_ERROR.title}
          body={EVENTS_PAGE_ERROR.body}
        >
          <div className="hd-row hd-m05-actions">
            <ChangesAction
              label={EVENTS_PAGE_ERROR.action}
              onUnavailable={onUnavailable}
            />
          </div>
        </ChangesPaneNote>
      </div>
    )
  }
  if (!hasOlder) {
    // The beginning is only stated after an older read reached it.
    if (status !== 'loaded') return null
    return (
      <div className="hd-m05-more">
        <span className="caption hd-faint">{EVENTS_BEGINNING}</span>
      </div>
    )
  }
  return (
    <div className="hd-m05-more">
      <button
        type="button"
        className="hd-btn hd-btn--secondary hd-btn--sm"
        disabled={status === 'loading'}
        onClick={(event) => onLoadEarlier(event.currentTarget)}
      >
        {EVENTS_LOAD_EARLIER}
      </button>
    </div>
  )
}

function EventRecord({ record }: { readonly record: TaskEventsRecord }) {
  return (
    <details className="hd-m05-record" data-row={`event-${record.seq}`}>
      <summary>{eventRecordTitle(record)}</summary>
      <pre>{record.json}</pre>
    </details>
  )
}

function HistoryUnavailable({
  onUnavailable,
}: {
  readonly onUnavailable: (label: string) => void
}) {
  return (
    <ChangesPaneNote
      tone="warn"
      title={EVENTS_HISTORY_UNAVAILABLE.title}
      body={EVENTS_HISTORY_UNAVAILABLE.body}
    >
      <div className="hd-row hd-m05-actions">
        <ChangesAction
          label={EVENTS_HISTORY_UNAVAILABLE.action}
          onUnavailable={onUnavailable}
        />
      </div>
    </ChangesPaneNote>
  )
}
