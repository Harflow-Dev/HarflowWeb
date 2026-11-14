import type { TaskStatusResourceCard } from '../presentation'
import { Icon } from './Icon'
import {
  TASK_COPY_REQUEST_UNAVAILABLE_EXPLANATION,
  TASK_COPY_REQUEST_UNAVAILABLE_ID,
  TASK_OPEN_SLOTS_UNAVAILABLE_EXPLANATION,
  TASK_OPEN_SLOTS_UNAVAILABLE_ID,
} from './taskUnavailable'

type Props = {
  readonly request: string
  readonly onUnavailable: (label: string) => void
}

/** Collapsed Original request disclosure (Design `promptHtml`). */
export function TaskRequestHead({ request, onUnavailable }: Props) {
  return (
    <details className="hd-m05-request">
      <summary>
        <Icon name="chevron-right" size="sm" />
        Original request
      </summary>
      <p className="hd-m05-caption">Complete stored request</p>
      <pre>{request}</pre>
      <div className="hd-row hd-m05-actions">
        <button
          type="button"
          className="hd-btn hd-btn--secondary hd-btn--sm"
          aria-disabled="true"
          aria-describedby={TASK_COPY_REQUEST_UNAVAILABLE_ID}
          title={TASK_COPY_REQUEST_UNAVAILABLE_EXPLANATION}
          onClick={(event) => {
            event.preventDefault()
            onUnavailable('Copy original request')
          }}
        >
          Copy original request
        </button>
      </div>
    </details>
  )
}

/** Pending resource-wait card (Design `resourceCard('queued')`). */
export function TaskResourceCard({
  card,
  onUnavailable,
}: {
  readonly card: TaskStatusResourceCard
  readonly onUnavailable: (label: string) => void
}) {
  return (
    <div className="hd-m05-resource">
      <strong>{card.title}</strong>
      <span>{card.detail}</span>
      <span className="hd-faint">{card.note}</span>
      <button
        type="button"
        className="hd-m05-resource__link"
        aria-disabled="true"
        aria-describedby={TASK_OPEN_SLOTS_UNAVAILABLE_ID}
        title={TASK_OPEN_SLOTS_UNAVAILABLE_EXPLANATION}
        onClick={(event) => {
          event.preventDefault()
          onUnavailable(card.linkLabel)
        }}
      >
        {card.linkLabel}
      </button>
    </div>
  )
}
