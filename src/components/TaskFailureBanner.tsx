import type { RefObject } from 'react'
import type { TaskStatusBanner } from '../presentation/taskStatusView'
import { Icon } from './Icon'
import {
  TASK_BANNER_ACTION_UNAVAILABLE_EXPLANATION,
  TASK_BANNER_ACTION_UNAVAILABLE_ID,
  TASK_BANNER_CAPTION_ID,
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
} from './taskUnavailable'

type Props = {
  readonly banner: TaskStatusBanner
  readonly onUnavailable: (label: string) => void
  /** Opens the shared Stop confirmation for banner Stop actions. */
  readonly onStop?: () => void
  readonly stopRef?: RefObject<HTMLButtonElement | null>
}

/**
 * Approved M05 outcome banner — actions stay unavailable in this slice.
 * A labelled group, not a live region: StatusRegion is the only announcer.
 * The caption sits after the banner box, as drawn.
 */
export function TaskFailureBanner({
  banner,
  onUnavailable,
  onStop,
  stopRef,
}: Props) {
  return (
    <>
      <div
        className={`hd-banner${banner.tone === 'warning' ? ' hd-banner--warning' : ''}`}
        role="group"
        aria-label={banner.title}
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
          <BannerActions
            banner={banner}
            onUnavailable={onUnavailable}
            {...(onStop ? { onStop } : {})}
            {...(stopRef ? { stopRef } : {})}
          />
        </div>
      </div>
      {banner.caption ? (
        <p id={TASK_BANNER_CAPTION_ID} className="hd-m05-caption">
          {banner.caption}
        </p>
      ) : null}
    </>
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
      <div className="hd-mono hd-m05-err">{error}</div>
    </>
  )
}

function BannerActions({
  banner,
  onUnavailable,
  onStop,
  stopRef,
}: {
  readonly banner: TaskStatusBanner
  readonly onUnavailable: (label: string) => void
  readonly onStop?: () => void
  readonly stopRef?: RefObject<HTMLButtonElement | null>
}) {
  if (banner.actions.length === 0) return null
  return (
    <div className="hd-row hd-m05-actions">
      {banner.actions.map((action) => {
        if (action.kind === 'stop') {
          return (
            <button
              key={action.label}
              ref={stopRef}
              type="button"
              className={`hd-btn hd-btn--${action.variant} hd-btn--sm`}
              onClick={(event) => {
                event.preventDefault()
                onStop?.()
              }}
            >
              <Icon name="stop" size="sm" /> {action.label}
            </button>
          )
        }
        const describedBy = describedByFor(action, Boolean(banner.caption))
        return (
          <button
            key={action.label}
            type="button"
            className={`hd-btn hd-btn--${action.variant} hd-btn--sm${
              action.disabled ? ' is-disabled' : ''
            }`}
            aria-disabled="true"
            aria-describedby={describedBy}
            title={titleFor(action.kind)}
            onClick={(event) => {
              event.preventDefault()
              onUnavailable(action.label)
            }}
          >
            {action.kind === 'continue' || action.kind === 'starting' ? (
              <Icon name="refresh" size="sm" />
            ) : null}
            {action.kind === 'copyResume' ? (
              <Icon name="copy" size="sm" />
            ) : null}{' '}
            {action.label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Space-separated ids. A Continue drawn disabled is explained by the banner
 * caption (why it cannot run) plus the generic mock explanation.
 */
function describedByFor(
  action: TaskStatusBanner['actions'][number],
  hasCaption: boolean,
): string {
  if (action.kind === 'continue' && action.disabled && hasCaption) {
    return `${TASK_BANNER_CAPTION_ID} ${TASK_CONTINUE_UNAVAILABLE_ID}`
  }
  switch (action.kind) {
    case 'continue':
    case 'starting':
      return TASK_CONTINUE_UNAVAILABLE_ID
    case 'checkNewTask':
      return TASK_CHECK_NEW_TASK_UNAVAILABLE_ID
    case 'copyResume':
      return TASK_COPY_RESUME_UNAVAILABLE_ID
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
    case 'refresh':
      return TASK_REFRESH_UNAVAILABLE_EXPLANATION
    case 'openEvents':
      return TASK_OPEN_EVENTS_UNAVAILABLE_EXPLANATION
    default:
      return TASK_BANNER_ACTION_UNAVAILABLE_EXPLANATION
  }
}
