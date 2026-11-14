import type { TaskStatusNotice as TaskStatusNoticeView } from '../presentation/taskStatusView'
import { Icon } from './Icon'

type Props = {
  readonly notice: TaskStatusNoticeView
  readonly onUnavailable: (label: string) => void
}

export function TaskStatusNotice({ notice, onUnavailable }: Props) {
  return (
    <div
      className={`hd-m05-notice hd-m05-notice--${notice.tone}`}
      role="status"
      style={{ margin: 'var(--space-4) var(--space-6) 0' }}
    >
      <Icon name={notice.tone === 'warning' ? 'alert' : 'clock'} />
      <div>
        <strong>{notice.title}</strong>
        <span>{notice.body}</span>
      </div>
      {notice.actionLabel ? (
        <button
          type="button"
          className="hd-btn hd-btn--secondary hd-btn--sm"
          onClick={() => onUnavailable(notice.actionLabel ?? 'Retry')}
        >
          {notice.actionLabel}
        </button>
      ) : null}
    </div>
  )
}