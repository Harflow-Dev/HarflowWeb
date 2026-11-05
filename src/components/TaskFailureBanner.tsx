import type { TaskFailureExplanation } from '../model'
import { Icon } from './Icon'

type Props = {
  readonly failure: TaskFailureExplanation
  readonly onUnavailable: (label: string) => void
}

/** Approved task/failed explanation — Retry and Copy resume stay unavailable. */
export function TaskFailureBanner({ failure, onUnavailable }: Props) {
  return (
    <div className="hd-banner" role="alert">
      <Icon name="alert" />
      <div className="hd-banner__body">
        <div className="hd-banner__title">{failure.title}</div>
        <div>{failure.intro}</div>
        <div className="hd-mono" style={{ margin: '4px 0 10px', wordBreak: 'break-all' }}>
          {failure.lastError}
        </div>
        <div className="hd-row">
          <button
            type="button"
            className="hd-btn hd-btn--secondary hd-btn--sm"
            aria-label="Retry (unavailable in this slice)"
            title="Retry — unavailable in this slice"
            onClick={() => onUnavailable('Retry')}
          >
            <Icon name="refresh" size="sm" /> Retry
          </button>
          <button
            type="button"
            className="hd-btn hd-btn--ghost hd-btn--sm"
            aria-label="Copy resume command (unavailable in this slice)"
            title="Copy resume command — unavailable in this slice"
            onClick={() => onUnavailable('Copy resume command')}
          >
            <Icon name="copy" size="sm" /> Copy resume command
          </button>
        </div>
      </div>
    </div>
  )
}
