import type { TaskStatusBanner } from '../presentation/taskStatusView'
import { Icon } from './Icon'

type Props = {
  readonly banner: TaskStatusBanner
  readonly onUnavailable: (label: string) => void
}

/** Approved M05 outcome banner — actions stay unavailable in this slice. */
export function TaskFailureBanner({ banner, onUnavailable }: Props) {
  return (
    <div
      className={`hd-banner${banner.tone === 'warning' ? ' hd-banner--warning' : ''}`}
      role="alert"
    >
      <Icon name="alert" />
      <div className="hd-banner__body">
        <div className="hd-banner__title">{banner.title}</div>
        {banner.body.map((row, index) =>
          row.kind === 'text' ? (
            <div key={index}>{row.value}</div>
          ) : (
            <BannerLastError
              key={index}
              intro={row.intro}
              error={row.error}
            />
          ),
        )}
        <BannerActions banner={banner} onUnavailable={onUnavailable} />
        {banner.caption ? (
          <p className="hd-m05-caption">{banner.caption}</p>
        ) : null}
      </div>
    </div>
  )
}

function BannerLastError({
  intro,
  error,
}: {
  readonly intro: string
  readonly error: string
}) {
  return (
    <>
      {intro ? <div>{intro}</div> : null}
      <div
        className="hd-mono hd-m05-err"
        style={{ margin: '4px 0 10px', wordBreak: 'break-all' }}
      >
        {error}
      </div>
    </>
  )
}

function BannerActions({
  banner,
  onUnavailable,
}: {
  readonly banner: TaskStatusBanner
  readonly onUnavailable: (label: string) => void
}) {
  if (banner.actions.length === 0) return null
  return (
    <div className="hd-row hd-m05-actions">
      {banner.actions.map((action) => (
        <button
          key={action.label}
          type="button"
          className={`hd-btn hd-btn--${
            action.kind === 'stop'
              ? 'danger'
              : action.kind === 'continue' || action.kind === 'starting'
                ? 'secondary'
                : 'ghost'
          } hd-btn--sm`}
          disabled={action.disabled}
          aria-label={`${action.label} (unavailable in this slice)`}
          title={`${action.label} — unavailable in this slice`}
          onClick={() => onUnavailable(action.label)}
        >
          {action.kind === 'continue' ||
          action.kind === 'starting' ||
          action.kind === 'refresh' ? (
            <Icon name="refresh" size="sm" />
          ) : null}
          {action.kind === 'copyResume' ? (
            <Icon name="copy" size="sm" />
          ) : null}
          {action.kind === 'stop' ? <Icon name="stop" size="sm" /> : null}{' '}
          {action.label}
        </button>
      ))}
    </div>
  )
}