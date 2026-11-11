import type { ReactNode } from 'react'
import {
  GraphSkeleton,
  LanesSkeleton,
  StandaloneNodesSkeleton,
} from './skeletonLanes'
import { SkelBlock, SkelLine, SkelParagraph, SkelToolRow } from './skeletonPrimitives'

function RunTopbarSkeleton({ actions }: { readonly actions: ReactNode }) {
  return (
    <div className="hd-topbar">
      <SkelLine width={173} height={14} />
      <SkelBlock width={72} height={22} shape="pill" />
      <SkelLine width={105} height={10} />
      <span className="hd-topbar__spacer" />
      {actions}
    </div>
  )
}

function RunViewActions() {
  return (
    <>
      <button
        type="button"
        className="hd-btn hd-btn--ghost hd-btn--sm"
        disabled
        aria-disabled="true"
      >
        Graph
      </button>
      <button
        type="button"
        className="hd-btn hd-btn--ghost hd-btn--sm"
        disabled
        aria-disabled="true"
      >
        Parallel
      </button>
      <button
        type="button"
        className="hd-btn hd-btn--ghost hd-btn--sm"
        disabled
        aria-disabled="true"
      >
        Pause
      </button>
      <button
        type="button"
        className="hd-btn hd-btn--danger hd-btn--sm"
        disabled
        aria-disabled="true"
      >
        Cancel run
      </button>
    </>
  )
}

function OnDemandPaneSkeleton() {
  return (
    <aside className="hd-pane">
      <div className="hd-pane__head">
        <SkelLine width={110} height={14} />
        <SkelBlock width={60} height={10} shape="pill" />
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className="hd-btn hd-btn--ghost hd-btn--sm"
          disabled
          aria-disabled="true"
        >
          Close
        </button>
      </div>
      <div
        className="hd-scroll"
        data-skel-region=""
        style={{ pointerEvents: 'none', padding: 16 }}
      >
        <SkelParagraph widths={['100%', '70%']} />
        <div style={{ margin: '0 0 8px' }}>
          <SkelLine width={60} height={10} />
        </div>
        <SkelToolRow width={200} />
        <SkelToolRow width={200} />
        <SkelParagraph widths={['60%']} />
        <SkelParagraph widths={['100%', '95%', '50%']} />
        <SkelToolRow width={190} />
      </div>
      <form className="hd-composer" aria-label="Message this node">
        <textarea
          className="hd-composer__input"
          rows={2}
          readOnly
          disabled
          aria-disabled="true"
          style={{ minHeight: 28 }}
        />
        <button
          type="button"
          className="hd-btn hd-btn--primary hd-btn--sm"
          aria-label="Send"
          disabled
          aria-disabled="true"
        >
          Send
        </button>
      </form>
    </aside>
  )
}

const columnStyle = {
  flex: '1 1 auto',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
} as const

/** Workflow run graph first-load — Design `workflow-run/loading`. */
export function WorkflowRunLoadingPage(): ReactNode {
  return (
    <div
      role="group"
      aria-busy="true"
      aria-label="Loading Workflow run"
      style={columnStyle}
    >
      <RunTopbarSkeleton actions={<RunViewActions />} />
      <div className="hd-standalone">
        <span className="hd-standalone__label">
          <strong>Standalone</strong>
          Outside the workflow path
        </span>
        <StandaloneNodesSkeleton />
      </div>
      <div className="hd-split" style={{ flex: '1 1 auto', minHeight: 0 }}>
        <div
          className="hd-canvas hd-thin-scroll"
          aria-label="Workflow steps"
          style={{ flex: '1 1 auto', overflow: 'auto', position: 'relative' }}
        >
          <GraphSkeleton />
        </div>
        <OnDemandPaneSkeleton />
      </div>
    </div>
  )
}

/** Workflow run Parallel first-load — Design `workflow-run/loading-parallel`. */
export function WorkflowRunParallelLoadingPage(): ReactNode {
  return (
    <div
      role="group"
      aria-busy="true"
      aria-label="Loading Workflow run"
      style={columnStyle}
    >
      <RunTopbarSkeleton actions={<RunViewActions />} />
      <LanesSkeleton />
      <div
        data-skel-region=""
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 16px',
          height: 48,
          borderTop: '1px solid var(--border)',
        }}
      >
        <SkelBlock width={16} height={16} shape="circle" />
        <SkelLine width={230} height={12} />
        <span style={{ flex: 1 }} />
        <SkelLine width={110} height={10} />
      </div>
    </div>
  )
}

/** Parallel group first-load — Design `parallel-group/loading`. */
export function ParallelGroupLoadingPage(): ReactNode {
  return (
    <div
      role="group"
      aria-busy="true"
      aria-label="Loading Parallel group"
      style={columnStyle}
    >
      <div className="hd-topbar">
        <SkelLine width={150} height={14} />
        <SkelBlock width={72} height={22} shape="pill" />
        <SkelLine width={300} height={10} />
        <span className="hd-topbar__spacer" />
        <button
          type="button"
          className="hd-btn hd-btn--ghost"
          disabled
          aria-disabled="true"
        >
          View prompt
        </button>
        <button
          type="button"
          className="hd-btn hd-btn--danger"
          disabled
          aria-disabled="true"
        >
          Cancel all
        </button>
      </div>
      <LanesSkeleton />
    </div>
  )
}
