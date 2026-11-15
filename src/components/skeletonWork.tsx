import type { ReactNode } from 'react'
import { Icon } from './Icon'
import { TASK_TRANSCRIPT_SKELETON_HEIGHT } from './skeletonConstants'
import {
  SkelBlock,
  SkelLine,
  SkelParagraph,
  SkelStatus,
  SkelTaskRow,
  SkelToolRow,
} from './skeletonPrimitives'

/** Count pill in nav / section heads while the sidebar listing is unread. */
export function SidebarCountSkeleton() {
  return <SkelBlock width={14} height={12} shape="pill" />
}

/** Running (2) + Recent (8) placeholder rows — Design `sidebarOps` row counts. */
export function SidebarListingSkeleton({
  running = 2,
  recent = 8,
}: {
  readonly running?: number
  readonly recent?: number
}) {
  return (
    <div role="group" aria-busy="true" aria-label="Loading tasks">
      <SkelStatus>Loading tasks…</SkelStatus>
      <section className="hd-section" aria-label="Running" data-skeleton="">
        <div className="hd-section__head">
          Running <SidebarCountSkeleton />
        </div>
        <div className="hd-section__list" data-skel-region="">
          {Array.from({ length: running }, (_, index) => (
            <SkelTaskRow key={`running-${index}`} index={index} />
          ))}
        </div>
      </section>
      <section className="hd-section" aria-label="Recent work" data-skeleton="">
        <div className="hd-section__head">Recent work</div>
        <div className="hd-section__list" data-skel-region="">
          {Array.from({ length: recent }, (_, index) => (
            <SkelTaskRow key={`recent-${index}`} index={index} />
          ))}
        </div>
      </section>
    </div>
  )
}

/**
 * New task first-load skeleton — Design `new-task` / `new-task/loading`.
 * Greeting, composer frame, and + stay real; pills and status are placeholders.
 */
export function NewTaskLoadingComposer(): ReactNode {
  return (
    <div
      role="group"
      aria-busy="true"
      aria-label="Loading New task"
      style={{ width: '100%' }}
    >
      <SkelStatus>Loading new task…</SkelStatus>
      <form className="hd-composer hw-composer" aria-label="New task">
        <label className="hd-sr" htmlFor="new-task-loading-prompt">
          Task prompt
        </label>
        <textarea
          id="new-task-loading-prompt"
          className="hd-composer__input"
          rows={1}
          placeholder="Describe the task. Use @ to mention files."
          readOnly
          aria-readonly="true"
          aria-disabled="true"
          disabled
          style={{ minHeight: 28 }}
        />
        <div className="hd-composer__bar">
          <button
            type="button"
            className="hd-btn hd-btn--icon hw-options-trigger"
            aria-label="More task options"
            aria-disabled="true"
            disabled
          >
            <Icon name="plus" />
            <span className="hd-sr">Default options</span>
          </button>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <SkelBlock width={120} height={32} shape="pill" />
            <SkelBlock width={160} height={32} shape="pill" />
            <SkelBlock width={140} height={32} shape="pill" />
          </span>
          <span className="hd-composer__spacer" />
          <button
            type="button"
            className="hd-btn hd-btn--primary"
            aria-label="Start task"
            aria-disabled="true"
            disabled
          >
            Start
          </button>
        </div>
      </form>
    </div>
  )
}

/** Transcript placeholder pattern from Design `transcriptPattern`. */
export function TaskTranscriptSkeleton() {
  return (
    <div
      className="hd-transcript"
      data-skel-region=""
      style={{
        pointerEvents: 'none',
        // Pinned to the running-stop transcript box, as the design pins it.
        boxSizing: 'border-box',
        overflow: 'hidden',
        height: TASK_TRANSCRIPT_SKELETON_HEIGHT,
        flex: '0 0 auto',
      }}
    >
      <div
        style={{
          height: 36,
          margin: '0 0 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <SkelBlock width={14} height={14} shape="soft" />
        <SkelLine width={140} height={12} />
      </div>
      <SkelParagraph widths={['100%', '94%', '58%']} />
      <SkelToolRow width={120} />
      <SkelParagraph widths={['100%', '72%']} />
      <SkelToolRow width={190} />
      <SkelToolRow width={150} />
      <SkelParagraph widths={['100%', '88%', '40%']} />
    </div>
  )
}
