import type { ReactNode } from 'react'
import type { TaskPaneLayoutMode } from '../presentation/taskPaneDefaults'
import { Icon } from './Icon'
import {
  SkelBlock,
  SkelLine,
  SkelStatus,
} from './skeletonPrimitives'
import { LoadingTaskPane } from './skeletonTaskLoadingPane'
import { TaskTranscriptSkeleton } from './skeletonWork'
import { TASK_PANE_ASIDE_ID } from './TaskPaneTabs'

type LoadingProps = {
  readonly knownTitle?: string | null
  readonly paneOpen?: boolean
  readonly paneMode?: TaskPaneLayoutMode
  readonly paneTab?: 'changes' | 'events'
  readonly onTogglePane?: (open: boolean) => void
}

/**
 * Task first-load skeleton: Design `task` / `task/loading` mirroring
 * `task/running-stop`, with the same bar → body → column/pane structure as the
 * loaded task. Badge, meta, chip, transcript and Stop shimmer; the follow-up
 * frame stays real and disabled; the pane toggle is real and More is
 * disabled. `task/loading-pane` adds the pane: real tab names, a shimmer-only
 * body (Design `paneBodyPattern`) and Close. The real title stays when the
 * listing knows it (a known deviation, provenance.md).
 */
export function TaskLoadingPage({
  knownTitle = null,
  paneOpen = false,
  paneMode = 'split',
  paneTab = 'events',
  onTogglePane,
}: LoadingProps): ReactNode {
  const overlay = paneOpen && paneMode === 'overlay'
  const bodyMode = paneOpen ? paneMode : 'nopane'
  return (
    <>
      <LoadingBar
        knownTitle={knownTitle}
        paneOpen={paneOpen}
        onTogglePane={onTogglePane}
      />
      <div className={`hd-m05-body hd-m05-body--${bodyMode}`}>
        <div
          className="hd-m05-column"
          role="group"
          aria-busy="true"
          aria-label="Loading Task"
          {...(overlay ? { inert: true } : {})}
        >
          <SkelStatus>Loading task…</SkelStatus>
          <div className="hd-scroll hd-m05-scroll">
            <TaskTranscriptSkeleton />
          </div>
          <TaskLoadingComposer />
        </div>
        {paneOpen ? (
          <LoadingTaskPane
            tab={paneTab}
            onClose={() => onTogglePane?.(false)}
          />
        ) : null}
      </div>
    </>
  )
}

/** Bar shimmer: title, badge, meta, one chip pill; real toggle, disabled More. */
function LoadingBar({
  knownTitle,
  paneOpen,
  onTogglePane,
}: {
  readonly knownTitle: string | null
  readonly paneOpen: boolean
  readonly onTogglePane: ((open: boolean) => void) | undefined
}): ReactNode {
  return (
    <div className="hd-m05-bar">
      <span />
      <div className="hd-m05-bar__center">
        <span className="hd-topbar__title">
          {knownTitle ?? <SkelLine width={190} height={14} />}
        </span>
        <SkelBlock width={114} height={22} shape="pill" />
        <span className="hd-topbar__meta hw-m05-meta">
          <SkelLine width={170} height={10} />
        </span>
      </div>
      <div className="hd-m05-bar__right">
        <SkelBlock width={136} height={24} shape="pill" />
        <button
          type="button"
          className={`hd-btn hd-btn--icon hd-btn--sm${paneOpen ? ' is-active' : ''}`}
          aria-label={paneOpen ? 'Hide right pane' : 'Show right pane'}
          aria-expanded={paneOpen}
          {...(paneOpen ? { 'aria-controls': TASK_PANE_ASIDE_ID } : {})}
          onClick={() => onTogglePane?.(!paneOpen)}
        >
          <Icon name="panel-right" />
        </button>
        <span className="hd-m05-more-anchor">
          <button
            type="button"
            className="hd-btn hd-btn--icon hd-btn--sm"
            aria-label="More actions"
            aria-disabled="true"
            disabled
          >
            <Icon name="more" />
          </button>
        </span>
      </div>
    </div>
  )
}

/** Follow-up frame drawn real and disabled while the task is read (Design `task/loading`). */
function TaskLoadingComposer(): ReactNode {
  return (
    <div
      className="hw-task-composer"
      style={{
        flex: 'none',
        width: '100%',
        maxWidth: 'var(--content-width)',
        margin: '0 auto',
        padding: 'var(--space-2) var(--space-6) var(--space-4)',
      }}
    >
      <form className="hd-composer" aria-label="Follow-up">
        <label className="hd-sr" htmlFor="task-loading-followup">
          Message this task
        </label>
        <textarea
          id="task-loading-followup"
          className="hd-composer__input"
          rows={1}
          placeholder="Queue a message…"
          readOnly
          aria-readonly="true"
          aria-disabled="true"
          disabled
          style={{ minHeight: 26 }}
        />
        <div className="hd-composer__bar">
          <span className="caption hd-faint">
            Send queues. Send now requests delivery when safe.
          </span>
          <span className="hd-composer__spacer" />
          <SkelBlock width={65} height={26} shape="pill" />
          <button
            type="submit"
            className="hd-composer__send"
            aria-label="Send"
            aria-disabled="true"
            disabled
          >
            <Icon name="arrow-up" />
          </button>
        </div>
      </form>
    </div>
  )
}
