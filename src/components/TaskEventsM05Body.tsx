import type {
  TaskEventsLoad,
  TaskEventsObservation,
  TaskObservation,
} from '../model'
import type { EventsEarlierState } from '../presentation'
import { IDLE_EVENTS_EARLIER } from '../presentation/taskState'
import { eventsLifecycleFor } from '../presentation/taskEventsLifecycle'
import {
  EVENTS_NOT_STARTED,
  EVENTS_UNAVAILABLE,
} from '../presentation/taskEventsCopy'
import {
  ChangesAction,
  ChangesPaneNote,
} from './TaskChangesChrome'
import { TaskEventsFacts } from './TaskEventsFacts'
import { TaskEventsRecords } from './TaskEventsRecords'
import { EventsLoadingBody } from './skeletonTaskPane'

type Props = {
  readonly taskObservation: TaskObservation
  readonly load: TaskEventsLoad
  readonly list: TaskEventsObservation | null
  readonly earlier: EventsEarlierState
  readonly factsReveal?: 'enforcement' | 'notices' | 'continuity' | null
  readonly factsRevealSeq?: number
  readonly onLoadEarlier: () => void
  readonly onUnavailable: (label: string) => void
}

/**
 * M05 Events tab body. Transcript screens keep TaskEventsPane unchanged.
 */
export function TaskEventsM05Body({
  taskObservation,
  load,
  list,
  earlier,
  factsReveal = null,
  factsRevealSeq = 0,
  onLoadEarlier,
  onUnavailable,
}: Props) {
  const life = eventsLifecycleFor(taskObservation, load)
  if (life === 'notStarted') {
    return (
      <div className="hd-m05-panebody hd-m05-events">
        <ChangesPaneNote
          tone="info"
          title={EVENTS_NOT_STARTED.title}
          body={EVENTS_NOT_STARTED.body}
        />
      </div>
    )
  }
  if (life === 'unavailable') {
    return (
      <div className="hd-m05-panebody hd-m05-events">
        <ChangesPaneNote
          tone="warn"
          title={EVENTS_UNAVAILABLE.title}
          body={EVENTS_UNAVAILABLE.body}
        >
          <div className="hd-row hd-m05-actions">
            <ChangesAction
              label={EVENTS_UNAVAILABLE.action}
              onUnavailable={onUnavailable}
            />
          </div>
        </ChangesPaneNote>
      </div>
    )
  }
  if (life === 'loading') {
    return (
      <div className="hd-m05-events">
        <EventsLoadingBody />
      </div>
    )
  }
  const observation = load.kind === 'ready' ? load.observation : list
  if (load.kind === 'unavailable' && observation === null) {
    return (
      <div className="hd-m05-panebody hd-m05-events">
        <TaskEventsFacts
          observation={taskObservation}
          reveal={factsReveal}
          revealSeq={factsRevealSeq}
        />
        <TaskEventsRecords
          observation={unavailableHistory(taskObservation.taskId)}
          earlier={IDLE_EVENTS_EARLIER}
          onLoadEarlier={onLoadEarlier}
          onUnavailable={onUnavailable}
        />
      </div>
    )
  }
  if (observation === null) {
    return (
      <div className="hd-m05-events">
        <EventsLoadingBody />
      </div>
    )
  }
  return (
    <div className="hd-m05-panebody hd-m05-events">
      <TaskEventsFacts
        observation={taskObservation}
        reveal={factsReveal}
        revealSeq={factsRevealSeq}
      />
      <TaskEventsRecords
        observation={observation}
        earlier={earlier}
        onLoadEarlier={onLoadEarlier}
        onUnavailable={onUnavailable}
      />
    </div>
  )
}

function unavailableHistory(
  taskId: TaskObservation['taskId'],
): TaskEventsObservation {
  return {
    taskId,
    log: { state: 'unavailable' },
    records: [],
    hasOlder: false,
    olderCursor: null,
  }
}
