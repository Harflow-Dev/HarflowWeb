import type { TaskStatusBanner } from '../presentation/taskStatusView'
import { Icon } from './Icon'
import {
  TASK_BANNER_ACTION_UNAVAILABLE_EXPLANATION,
  TASK_BANNER_ACTION_UNAVAILABLE_ID,
  TASK_CHECK_NEW_TASK_UNAVAILABLE_EXPLANATION,
  TASK_CHECK_NEW_TASK_UNAVAILABLE_ID,
  TASK_CONTINUE_UNAVAILABLE_EXPLANATION,
  TASK_CONTINUE_UNAVAILABLE_ID,
  TASK_COPY_RESUME_UNAVAILABLE_EXPLANATION,
  TASK_COPY_RESUME_UNAVAILABLE_ID,
  TASK_OPEN_EVENTS_UNAVAILABLE_EXPLANATION,
  TASK_OPEN_EVENTS_UNAVAILABLE_ID,
  TASK_REFRESH_UNAVAILABLE_EXPLANATION,
  TASK_REFRESH_UNAVAILABLE_ID,
  TASK_STOP_UNAVAILABLE_EXPLANATION,
  TASK_STOP_UNAVAILABLE_ID,
} from './taskUnavailable'

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
      {banner.actions.map((action) => {
        const describedBy = describedByFor(action.kind)
        return (
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
            aria-disabled="true"
            aria-describedby={describedBy}
            title={titleFor(action.kind)}
            onClick={(event) => {
              event.preventDefault()
              onUnavailable(action.label)
            }}
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
        )
      })}
    </div>
  )
}

function describedByFor(
  kind: TaskStatusBanner['actions'][number]['kind'],
): string {
  switch (kind) {
    case 'continue':
    case 'starting':
      return TASK_CONTINUE_UNAVAILABLE_ID
    case 'checkNewTask':
      return TASK_CHECK_NEW_TASK_UNAVAILABLE_ID
    case 'copyResume':
      return TASK_COPY_RESUME_UNAVAILABLE_ID
    case 'stop':
      return TASK_STOP_UNAVAILABLE_ID
    case 'refresh':
      return TASK_REFRESH_UNAVAILABLE_ID
    case 'openEvents':
      return TASK_OPEN_EVENTS_UNAVAILABLE_ID
    default:
      return TASK_BANNER_ACTION_UNAVAILABLE_ID
  }
}

function titleFor(
  kind: TaskStatusBanner['actions'][number]['kind'],
): string {
  switch (kind) {
    case 'continue':
    case 'starting':
      return TASK_CONTINUE_UNAVAILABLE_EXPLANATION
    case 'checkNewTask':
      return TASK_CHECK_NEW_TASK_UNAVAILABLE_EXPLANATION
    case 'copyResume':
      return TASK_COPY_RESUME_UNAVAILABLE_EXPLANATION
    case 'stop':
      return TASK_STOP_UNAVAILABLE_EXPLANATION
    case 'refresh':
      return TASK_REFRESH_UNAVAILABLE_EXPLANATION
    case 'openEvents':
      return TASK_OPEN_EVENTS_UNAVAILABLE_EXPLANATION
    default:
      return TASK_BANNER_ACTION_UNAVAILABLE_EXPLANATION
  }
}
