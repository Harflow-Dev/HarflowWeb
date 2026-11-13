import type { ReactNode } from 'react'
import {
  GraphSkeleton,
  LanesSkeleton,
  StandaloneNodesSkeleton,
} from './skeletonLanes'
import { Icon } from './Icon'
import {
  SkelBlock,
  SkelLine,
  SkelParagraph,
  SkelStatus,
  SkelToolRow,
} from './skeletonPrimitives'

function RunTopbarSkeleton({ actions }: { readonly actions: ReactNode }) {
  return (
    <div className="hd-topbar">
      <SkelLine width={173} height={14} />
      <SkelBlock width={72} height={22} shape="pill" />
      <span className="hw-topbar-meta-skel">
        <SkelLine width={105} height={10} />
      </span>
      <span className="hd-topbar__spacer" />
      {actions}
    </div>
  )
}

function RunViewActions({
  active,
}: {
  readonly active: 'graph' | 'parallel'
}) {
  return (
    <>
      <div className="hd-seg" role="group" aria-label="Run view">
        {(['graph', 'parallel'] as const).map((view) => (
          <button
            key={view}
            type="button"
            className={`hd-seg__item${active === view ? ' is-active' : ''}`}
            disabled
            aria-disabled="true"
            aria-pressed={active === view}
            aria-current={active === view ? 'page' : undefined}
          >
            {view === 'graph' ? 'Graph' : 'Parallel'}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="hd-btn hd-btn--ghost"
        disabled
        aria-disabled="true"
      >
        <Icon name="pause" size="sm" />
        Pause
      </button>
      <button
        type="button"
        className="hd-btn hd-btn--ghost"
        disabled
        aria-disabled="true"
      >
        Cancel run
      </button>
      <button
        type="button"
        className="hd-btn hd-btn--icon hd-btn--sm"
        aria-label="More actions"
        disabled
        aria-disabled="true"
      >
        <Icon name="more" />
      </button>
    </>
  )
}

function OnDemandPaneSkeleton() {
  return (
    <aside className="hd-pane" aria-label="Loading selected node">
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
          aria-label="Message this node"
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
      <SkelStatus>Loading workflow run…</SkelStatus>
      <RunTopbarSkeleton actions={<RunViewActions active="graph" />} />
      <div className="hd-standalone">
        <span className="hd-standalone__label">
          <strong>Standalone</strong>
          Outside the workflow path
        </span>
        <StandaloneNodesSkeleton />
      </div>
      <div className="hd-split" style={{ flex: '1 1 auto', minHeight: 0 }}>
        <div className="hd-canvas">
          <div
            className="hd-canvas__port hd-thin-scroll"
            role="region"
            aria-label="Loading workflow graph"
            style={{ scrollbarGutter: 'auto' }}
          >
            <GraphSkeleton />
          </div>
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
      <SkelStatus>Loading workflow run…</SkelStatus>
      <RunTopbarSkeleton actions={<RunViewActions active="parallel" />} />
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

/** Parallel group first-load — Design `parallel-group/loading` (or loading-two). */
export function ParallelGroupLoadingPage({
  laneCount = 3,
}: {
  readonly laneCount?: number
} = {}): ReactNode {
  return (
    <div
      role="group"
      aria-busy="true"
      aria-label="Loading Parallel group"
      style={columnStyle}
    >
      <SkelStatus>Loading parallel group…</SkelStatus>
      <div className="hd-topbar">
        <SkelLine width={150} height={14} />
        <SkelBlock width={72} height={22} shape="pill" />
        <span className="hw-topbar-meta-skel">
          <SkelLine width={300} height={10} />
        </span>
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
      <LanesSkeleton count={laneCount} />
    </div>
  )
}
