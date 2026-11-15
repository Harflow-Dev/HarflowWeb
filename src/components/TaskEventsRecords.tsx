import type { TaskEventsObservation, TaskEventsRecord } from '../model'
import {
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

type Props = {
  readonly observation: TaskEventsObservation
  readonly earlierLoaded: boolean
  readonly earlierError: boolean
  readonly onLoadEarlier: () => void
  readonly onUnavailable: (label: string) => void
}

/** Captured activity facts, paging chrome, records, recovered note. */
export function TaskEventsRecords({
  observation,
  earlierLoaded,
  earlierError,
  onLoadEarlier,
  onUnavailable,
}: Props) {
  if (observation.logState === 'unavailable') {
    return <HistoryUnavailable onUnavailable={onUnavailable} />
  }
  if (observation.logState === 'empty') {
    return (
      <>
        <h3 className="hd-m05-h">{EVENTS_RECORDS_HEADING}</h3>
        <p>{EVENTS_EMPTY_ROWS}</p>
        <p className="hd-m05-caption">{EVENTS_EMPTY_CAPTION}</p>
      </>
    )
  }
  const records = visibleRecords(observation, earlierLoaded)
  return (
    <>
      {observation.activityFacts ? (
        <ActivityFacts
          count={observation.activityFacts.toolCallsObserved}
          caption={observation.activityFacts.caption}
        />
      ) : null}
      <h3 className="hd-m05-h">{EVENTS_RECORDS_HEADING}</h3>
      <p className="hd-m05-caption">{EVENTS_RECORDS_CAPTION}</p>
      {observation.hasEarlier ? (
        <EarlierChrome
          loaded={earlierLoaded}
          error={earlierError}
          onLoadEarlier={onLoadEarlier}
          onUnavailable={onUnavailable}
        />
      ) : null}
      {records.map((record) => (
        <EventRecord key={`${record.title}:${record.json}`} record={record} />
      ))}
      {observation.recoveredTranscriptNote === true ? (
        <>
          <h3 className="hd-m05-h">{EVENTS_RECOVERED_HEADING}</h3>
          <p className="hd-m05-caption">{EVENTS_RECOVERED_CAPTION}</p>
        </>
      ) : null}
    </>
  )
}

function visibleRecords(
  observation: TaskEventsObservation,
  earlierLoaded: boolean,
): readonly TaskEventsRecord[] {
  if (!earlierLoaded || observation.earlierPage.length === 0) {
    return observation.records
  }
  return [...observation.earlierPage, ...observation.records]
}

function ActivityFacts({
  count,
  caption,
}: {
  readonly count: number
  readonly caption: string
}) {
  return (
    <>
      <h3 className="hd-m05-h">{EVENTS_ACTIVITY_HEADING}</h3>
      <p>{EVENTS_ACTIVITY_COUNT(count)}</p>
      <p className="hd-m05-caption">{caption}</p>
    </>
  )
}

function EarlierChrome({
  loaded,
  error,
  onLoadEarlier,
  onUnavailable,
}: {
  readonly loaded: boolean
  readonly error: boolean
  readonly onLoadEarlier: () => void
  readonly onUnavailable: (label: string) => void
}) {
  if (error) {
    return (
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
    )
  }
  if (loaded) {
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
        onClick={onLoadEarlier}
      >
        {EVENTS_LOAD_EARLIER}
      </button>
    </div>
  )
}

function EventRecord({ record }: { readonly record: TaskEventsRecord }) {
  return (
    <details className="hd-m05-record">
      <summary>{record.title}</summary>
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
