import type { TaskStatusNotice as TaskStatusNoticeView } from '../presentation/taskStatusView'
import { Icon } from './Icon'
import {
  TASK_RETRY_READ_UNAVAILABLE_EXPLANATION,
  TASK_RETRY_READ_UNAVAILABLE_ID,
} from './taskUnavailable'

type Props = {
  readonly notice: TaskStatusNoticeView
  readonly onUnavailable: (label: string) => void
}

/**
 * Static notice text — not a live region. Announcements go through StatusRegion.
 */
export function TaskStatusNotice({ notice, onUnavailable }: Props) {
  return (
    <div className={`hd-m05-notice hd-m05-notice--${notice.tone}`}>
      <Icon name={notice.tone === 'warning' ? 'alert' : 'clock'} />
      <div>
        <strong>{notice.title}</strong>
        <span>{notice.body}</span>
      </div>
      {notice.actionLabel ? (
        <button
          type="button"
          className="hd-btn hd-btn--secondary hd-btn--sm"
          aria-disabled="true"
          aria-describedby={TASK_RETRY_READ_UNAVAILABLE_ID}
          title={TASK_RETRY_READ_UNAVAILABLE_EXPLANATION}
          onClick={(event) => {
            event.preventDefault()
            onUnavailable(notice.actionLabel ?? 'Retry read')
          }}
        >
          {notice.actionLabel}
        </button>
      ) : null}
    </div>
  )
}
