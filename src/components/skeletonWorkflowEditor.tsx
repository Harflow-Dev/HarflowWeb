import type { ReactNode } from 'react'
import { Icon } from './Icon'
import { GraphSkeleton, StandaloneNodesSkeleton } from './skeletonLanes'
import { SkelBlock, SkelLine } from './skeletonPrimitives'

function EditorTopbarSkeleton() {
  return (
    <div className="hd-topbar">
      <button
        type="button"
        className="hd-btn hd-btn--ghost hd-btn--sm"
        aria-disabled="true"
        disabled
      >
        <Icon name="arrow-left" size="sm" />
        Workflows
      </button>
      <SkelLine width={150} height={14} />
      <SkelLine width={150} height={10} />
      <span className="hd-topbar__spacer" />
      <button
        type="button"
        className="hd-btn hd-btn--ghost hd-btn--sm"
        disabled
        aria-disabled="true"
      >
        Edit with agent
      </button>
      <button
        type="button"
        className="hd-btn hd-btn--ghost hd-btn--sm"
        disabled
        aria-disabled="true"
      >
        Discard
      </button>
      <button
        type="button"
        className="hd-btn hd-btn--secondary hd-btn--sm"
        disabled
        aria-disabled="true"
      >
        Save
      </button>
      <button
        type="button"
        className="hd-btn hd-btn--primary hd-btn--sm"
        disabled
        aria-disabled="true"
      >
        Run
      </button>
    </div>
  )
}

function EditorInspectorSkeleton() {
  return (
    <aside className="hd-inspector" aria-label="Node settings">
      <div className="hd-inspector__head">
        <SkelLine width={90} height={14} />
      </div>
      <div className="hd-inspector__body hd-thin-scroll">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: 16,
          }}
        >
          <SkelLine width={90} height={14} />
          <SkelBlock width="100%" height={36} shape="soft" />
          <SkelBlock width="100%" height={36} shape="soft" />
          <SkelBlock width="100%" height={80} shape="soft" />
          <SkelLine width={120} height={12} />
        </div>
      </div>
    </aside>
  )
}

/** Workflow editor first-load — Design `workflow-editor/loading`. */
export function WorkflowEditorLoadingPage(): ReactNode {
  return (
    <div
      role="group"
      aria-busy="true"
      aria-label="Loading Workflow editor"
      style={{
        flex: '1 1 auto',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <EditorTopbarSkeleton />
      <div className="hd-standalone">
        <span className="hd-standalone__label">
          <strong>Standalone</strong>
          Outside the workflow path
        </span>
        <StandaloneNodesSkeleton />
      </div>
      <div className="hd-split" style={{ flex: '1 1 auto', minHeight: 0 }}>
        <div
          style={{
            flex: '1 1 auto',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <div
            className="hd-canvas hd-thin-scroll"
            aria-label="Workflow canvas"
            style={{ flex: '1 1 auto', overflow: 'auto', position: 'relative' }}
          >
            <GraphSkeleton />
          </div>
          <div
            className="caption hd-faint"
            style={{
              flex: 'none',
              padding: '6px var(--space-4)',
              borderTop: '1px solid var(--border)',
            }}
          >
            <SkelLine width={180} height={10} />
          </div>
        </div>
        <EditorInspectorSkeleton />
      </div>
    </div>
  )
}
