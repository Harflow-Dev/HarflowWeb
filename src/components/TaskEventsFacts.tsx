import type { TaskObservation } from '../model'
import {
  eventsFactsGroups,
  type EventsFactsGroupView,
} from '../presentation/taskEventsFacts'
import { Icon } from './Icon'

type Props = {
  readonly observation: TaskObservation
  readonly reveal?: 'enforcement' | 'notices' | 'continuity' | null
}

/** Collapsed facts groups at the top of the M05 Events tab. */
export function TaskEventsFacts({ observation, reveal = null }: Props) {
  return (
    <>
      {eventsFactsGroups(observation).map((group) => (
        <FactsGroup key={group.id} group={group} reveal={reveal === group.id} />
      ))}
    </>
  )
}

function FactsGroup({
  group,
  reveal,
}: {
  readonly group: EventsFactsGroupView
  readonly reveal: boolean
}) {
  return (
    <details className="hd-m05-facts" data-group={group.id} open={reveal || undefined}>
      <summary tabIndex={0} {...(reveal ? { 'data-m05-focus': '' } : {})}>
        <Icon name="chevron-right" size="sm" />
        <span>{group.title}</span>
        {group.id === 'notices' && group.count !== null ? (
          <span className="hd-tab__count">{group.count}</span>
        ) : null}
      </summary>
      <div className="hd-m05-facts__body">
        <FactsGroupBody group={group} />
      </div>
    </details>
  )
}

function FactsGroupBody({ group }: { readonly group: EventsFactsGroupView }) {
  if (group.id === 'notices') {
    if (group.emptyCaption !== null) {
      return <p className="hd-m05-caption">{group.emptyCaption}</p>
    }
    return (
      <ul className="hd-m05-list">
        {group.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )
  }
  if (group.id === 'continuity') {
    return (
      <>
        {group.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p className="hd-m05-caption">{group.caption}</p>
      </>
    )
  }
  return (
    <>
      <dl>
        {group.pairs.map((pair) => (
          <FactPair key={pair.term} term={pair.term} value={pair.value} />
        ))}
      </dl>
      {group.caption ? (
        <p className="hd-m05-caption">{group.caption}</p>
      ) : null}
    </>
  )
}

function FactPair({
  term,
  value,
}: {
  readonly term: string
  readonly value: string
}) {
  return (
    <>
      <dt>{term}</dt>
      <dd>{value}</dd>
    </>
  )
}
