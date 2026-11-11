import type { ReactNode } from 'react'
import { SkelBlock, SkelLine, SkelStatus } from './skeletonPrimitives'

const CARD_HEIGHTS = [167, 167, 154] as const

/**
 * Needs you loading card placeholder — Design `approvalCard(i, h)`.
 * Authored height + margin-bottom 12; flex defaults to 0 1 auto so cards can
 * shrink inside the pinned 512px body.
 */
export function NeedsYouApprovalCardSkeleton({
  height,
}: {
  readonly height: number
}) {
  return (
    <div
      className="hd-approval"
      aria-hidden="true"
      style={{
        height,
        margin: '0 0 12px',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="hd-approval__head"
        style={{ height: 38, gap: 10, boxSizing: 'border-box' }}
      >
        <SkelBlock width={16} height={16} shape="circle" />
        <SkelLine width={150} height={12} />
      </div>
      <div className="hd-approval__body" style={{ gap: 10 }}>
        <SkelLine width="90%" height={14} />
        <SkelLine width={200} height={10} />
      </div>
      <div className="hd-approval__actions" style={{ gap: 8 }}>
        <SkelBlock width={90} height={28} shape="pill" />
        <SkelBlock width={60} height={28} shape="pill" />
      </div>
    </div>
  )
}

/** Measured waiting badge outer box after Design fill (69×22, margin 0). */
export function NeedsYouBadgeSkeleton() {
  return (
    <SkelBlock
      width={69}
      height={22}
      shape="pill"
      style={{ margin: 0, boxSizing: 'border-box' }}
    />
  )
}

/**
 * Main-pane Needs you loading body — pinned 512px column with gap 12 and three
 * authored cards (167 / 167 / 154). Width follows the responsive parent.
 */
export function NeedsYouLoadingBody() {
  return (
    <div
      data-skel-region=""
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        height: 512,
        overflow: 'hidden',
        boxSizing: 'border-box',
        flex: '0 0 auto',
        pointerEvents: 'none',
      }}
    >
      {CARD_HEIGHTS.map((height, index) => (
        <NeedsYouApprovalCardSkeleton key={index} height={height} />
      ))}
    </div>
  )
}

export function NeedsYouLoadingPage(): ReactNode {
  return (
    <div
      className="hd-page"
      role="group"
      aria-busy="true"
      aria-label="Loading Needs you"
    >
      <SkelStatus>Loading Needs you…</SkelStatus>
      <div className="hd-page__head">
        <h1 className="hd-page__title">Needs you</h1>
        <NeedsYouBadgeSkeleton />
      </div>
      <NeedsYouLoadingBody />
    </div>
  )
}
