import type { ReactNode } from 'react'
import { Icon } from './Icon'
import {
  SkelBlock,
  SkelLine,
  SkelStatus,
} from './skeletonPrimitives'
import { EventsLoadingBody } from './skeletonTaskPane'
import { TaskTranscriptSkeleton } from './skeletonWork'

/**
 * Task first-load skeleton — Design `task` / `task/loading` mirroring
 * `task/running-stop`. Badge, meta, transcript, and Stop shimmer; follow-up
 * frame stays real and disabled. The pane toggle is real. `task/loading-pane`
 * adds the pane with real tab names and a busy body.
 */
export function TaskLoadingPage({
  knownTitle = null,
  paneOpen = false,
  onTogglePane,
}: {
  readonly knownTitle?: string | null
  readonly paneOpen?: boolean
  readonly onTogglePane?: (open: boolean) => void
}): ReactNode {
  const body = (
    <div
      role="group"
      aria-busy="true"
      aria-label="Loading Task"
      style={{
        flex: '1 1 auto',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <SkelStatus>Loading task…</SkelStatus>
      <div className="hd-topbar">
        {knownTitle ? (
          <span className="hd-topbar__title">{knownTitle}</span>
        ) : (
          <SkelLine width={190} height={14} />
        )}
        <SkelBlock width={72} height={22} shape="pill" />
        <SkelLine width={170} height={10} />
        <span className="hd-topbar__spacer" />
        <button
          type="button"
          className={`hd-btn hd-btn--icon hd-btn--sm${paneOpen ? ' is-active' : ''}`}
          aria-label={paneOpen ? 'Hide right pane' : 'Show right pane'}
          aria-expanded={paneOpen}
          aria-controls="task-details-pane"
          onClick={() => onTogglePane?.(!paneOpen)}
        >
          <Icon name="panel-right" />
        </button>
      </div>
      <div className="hd-scroll hd-m05-scroll">
        <TaskTranscriptSkeleton />
      </div>
      <TaskLoadingComposer />
    </div>
  )
  if (!paneOpen) return body
  return (
    <div className="hd-m05-body hd-m05-body--split" style={{ flex: 1, minHeight: 0 }}>
      {body}
      <LoadingTaskPane />
    </div>
  )
}

/** Pane shell for `task/loading-pane`: real tab names, busy body. */
function LoadingTaskPane(): ReactNode {
  return (
    <aside
      id="task-details-pane"
      className="hd-pane hd-m05-pane"
      aria-label="Task details"
    >
      <div className="hd-pane__head">
        <div className="hd-tabs" role="tablist">
          <button type="button" role="tab" className="hd-tab" aria-selected="false">
            Changes
          </button>
          <button
            type="button"
            role="tab"
            className="hd-tab is-disabled"
            aria-selected="false"
            aria-disabled="true"
          >
            Artifacts
          </button>
          <button
            type="button"
            role="tab"
            className="hd-tab is-active"
            aria-selected="true"
          >
            Events
          </button>
        </div>
      </div>
      <div className="hd-scroll hd-m05-panescroll">
        <EventsLoadingBody />
      </div>
    </aside>
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
