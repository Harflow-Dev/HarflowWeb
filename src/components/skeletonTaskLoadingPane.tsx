import type { ReactNode } from 'react'
import { Icon } from './Icon'
import { SkelBlock, SkelLine, SkelParagraph } from './skeletonPrimitives'
import { TASK_PANE_ASIDE_ID } from './TaskPaneTabs'

/**
 * A tab that names a surface that is not readable yet: aria-disabled, no
 * click effect, and only the selected tab is in the tab order (roving).
 */
function LoadingTab({
  label,
  active,
  dim = false,
}: {
  readonly label: string
  readonly active: boolean
  readonly dim?: boolean
}): ReactNode {
  return (
    <button
      type="button"
      role="tab"
      className={
        active ? 'hd-tab is-active' : dim ? 'hd-tab is-disabled' : 'hd-tab'
      }
      aria-selected={active}
      aria-disabled="true"
      tabIndex={active ? 0 : -1}
    >
      {label}
    </button>
  )
}

/** Pane shell for `task/loading-pane`: real tab names, shimmer-only body. */
export function LoadingTaskPane({
  tab,
  onClose,
}: {
  readonly tab: 'changes' | 'events'
  readonly onClose: () => void
}): ReactNode {
  return (
    <aside
      id={TASK_PANE_ASIDE_ID}
      className="hd-pane hd-m05-pane"
      aria-label="Task details"
    >
      <div className="hd-pane__head">
        <div className="hd-tabs" role="tablist">
          <LoadingTab label="Changes" active={tab === 'changes'} />
          <LoadingTab label="Artifacts" active={false} dim />
          <LoadingTab label="Events" active={tab === 'events'} />
        </div>
        <span className="hd-topbar__spacer" />
        <button
          type="button"
          className="hd-btn hd-btn--icon hd-btn--sm"
          aria-label="Close right pane"
          onClick={onClose}
        >
          <Icon name="x" />
        </button>
      </div>
      <div className="hd-scroll hd-m05-panescroll">
        <PaneBodyPattern />
      </div>
    </aside>
  )
}

/** Disclosure row: a soft marker and one line (Design `disclosure`). */
function PaneDisclosure({ width }: { readonly width: number }): ReactNode {
  return (
    <div
      style={{
        height: 28,
        margin: '0 0 8px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <SkelBlock width={14} height={14} shape="soft" />
      <SkelLine width={width} height={12} />
    </div>
  )
}

function PaneHeading({
  width,
  margin,
}: {
  readonly width: number
  readonly margin: string
}): ReactNode {
  return (
    <div style={{ margin }}>
      <SkelLine width={width} height={14} />
    </div>
  )
}

function PaneFacts(): ReactNode {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '61px 1fr',
        gap: '10px 12px',
        margin: '0 0 20px',
      }}
    >
      {[140, 190, 120, 168, 100, 150].map((width) => (
        <PaneFactRow key={width} width={width} />
      ))}
    </div>
  )
}

function PaneFactRow({ width }: { readonly width: number }): ReactNode {
  return (
    <>
      <SkelLine width={48} height={10} />
      <SkelLine width={width} height={12} />
    </>
  )
}

/** Design `paneBodyPattern`: disclosure rows, a facts grid and paragraphs. */
function PaneBodyPattern(): ReactNode {
  return (
    <div
      className="hd-m05-panebody"
      role="group"
      aria-busy="true"
      aria-label="Loading task details"
      style={{
        pointerEvents: 'none',
        boxSizing: 'border-box',
        overflow: 'hidden',
        height: 405,
        flex: '0 0 auto',
      }}
    >
      <PaneDisclosure width={40} />
      <PaneFacts />
      <PaneDisclosure width={120} />
      <PaneDisclosure width={52} />
      <PaneHeading width={150} margin="16px 0 8px" />
      <SkelParagraph widths={['70%']} />
      <PaneHeading width={110} margin="0 0 8px" />
      <SkelParagraph widths={['100%', '86%']} />
    </div>
  )
}
