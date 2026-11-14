import type { TaskStatusComposer } from '../presentation/taskStatusView'
import { Icon } from './Icon'

type Props = {
  readonly composer: TaskStatusComposer
  readonly onUnavailable: (label: string) => void
}

/**
 * Follow-up composer shell — send stays unavailable; Stop only when mapped.
 */
export function TaskFollowUp({ composer, onUnavailable }: Props) {
  return (
    <div
      style={{
        flex: 'none',
        width: '100%',
        maxWidth: 'var(--content-width)',
        margin: '0 auto',
        padding: 'var(--space-2) var(--space-6) var(--space-5)',
      }}
    >
      <form
        className="hd-composer"
        aria-label="Follow-up"
        onSubmit={(event) => {
          event.preventDefault()
        }}
      >
        <label className="hd-sr" htmlFor="followup">
          Follow-up message
        </label>
        <textarea
          id="followup"
          className="hd-composer__input"
          rows={2}
          placeholder={composer.placeholder}
          style={{ minHeight: 28 }}
          readOnly
          aria-readonly="true"
          disabled={composer.locked}
        />
        <div className="hd-composer__bar">
          {composer.hint ? (
            <span className="caption hd-faint">{composer.hint}</span>
          ) : (
            <span className="hd-composer__spacer" />
          )}
          {composer.hint ? <span className="hd-composer__spacer" /> : null}
          {composer.stopMode === 'stop' ? (
            <button
              type="button"
              className="hd-btn hd-btn--secondary hd-btn--sm"
              aria-label="Stop (unavailable in this slice)"
              title="Stop — unavailable in this slice"
              onClick={() => onUnavailable('Stop')}
            >
              <Icon name="stop" size="sm" /> Stop
            </button>
          ) : null}
          {composer.stopMode === 'stopping' ? (
            <button
              type="button"
              className="hd-btn hd-btn--secondary hd-btn--sm"
              disabled
              aria-label="Stopping (unavailable in this slice)"
            >
              <Icon name="stop" size="sm" /> Stopping…
            </button>
          ) : null}
          <button
            type="submit"
            className="hd-composer__send"
            aria-label="Send follow-up (unavailable in this slice)"
            title="Send follow-up — unavailable in this slice"
            disabled
          >
            <Icon name="arrow-up" />
          </button>
        </div>
      </form>
    </div>
  )
}