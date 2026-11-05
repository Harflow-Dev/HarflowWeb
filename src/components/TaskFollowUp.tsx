import { Icon } from './Icon'

type Props = {
  readonly placeholder: string
  readonly onUnavailable: (label: string) => void
}

/**
 * Follow-up composer shell from task/running — send and stop stay unavailable.
 */
export function TaskFollowUp({ placeholder, onUnavailable }: Props) {
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
          placeholder={placeholder}
          style={{ minHeight: 28 }}
          readOnly
          aria-readonly="true"
        />
        <div className="hd-composer__bar">
          <span className="hd-composer__spacer" />
          <button
            type="button"
            className="hd-btn hd-btn--secondary hd-btn--sm"
            aria-label="Stop (unavailable in this slice)"
            title="Stop — unavailable in this slice"
            onClick={() => onUnavailable('Stop')}
          >
            <Icon name="stop" size="sm" /> Stop
          </button>
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
