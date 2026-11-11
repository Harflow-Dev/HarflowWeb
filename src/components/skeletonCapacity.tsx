import type { ReactNode } from 'react'
import { SKEL_TITLE_WIDTHS } from './skeletonConstants'
import { SkelBlock, SkelLine, SkelStatus } from './skeletonPrimitives'

/** Card count of the loaded mock Resources screen (five harnesses). */
const RESOURCE_CARD_COUNT = 5

function ResourceCardSkeleton({ index }: { readonly index: number }) {
  return (
    <section className="hd-card" aria-hidden="true" data-skel-region="">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <SkelLine width={110} height={14} />
          <SkelBlock width={70} height={12} shape="pill" />
        </div>
        <SkelBlock width="100%" height={8} shape="pill" style={{ flex: 'none' }} />
        <div className="hd-task-row" style={{ padding: 0 }}>
          <SkelBlock width={14} height={14} shape="circle" />
          <span style={{ flex: 1, display: 'block' }}>
            <SkelLine
              width={SKEL_TITLE_WIDTHS[index % SKEL_TITLE_WIDTHS.length]!}
              height={12}
            />
          </span>
          <SkelBlock width={34} height={10} shape="pill" />
        </div>
      </div>
    </section>
  )
}

/** Resources first-load — Design `resources/loading`. */
export function ResourcesLoadingPage(): ReactNode {
  return (
    <div
      className="hd-page"
      role="group"
      aria-busy="true"
      aria-label="Loading Resources"
    >
      <SkelStatus>Loading resources…</SkelStatus>
      <div className="hd-page__head">
        <h1 className="hd-page__title">Resources</h1>
      </div>
      <p
        className="hd-muted"
        style={{ margin: 'calc(-1 * var(--space-3)) 0 var(--space-5)' }}
      >
        Slots limit how many tasks each harness runs at once. A task waits for a
        free slot before it starts.
      </p>
      <div className="hd-grid hd-grid--2" data-skeleton="">
        {Array.from({ length: RESOURCE_CARD_COUNT }, (_, index) => (
          <ResourceCardSkeleton key={index} index={index} />
        ))}
      </div>
      <h2 className="heading" style={{ margin: 'var(--space-6) 0 var(--space-2)' }}>
        Waiting for a slot
      </h2>
      <div className="hd-list" data-skel-region="" data-skeleton="">
        <div className="hd-list-row" aria-hidden="true">
          <SkelBlock width={13} height={13} shape="circle" />
          <span className="hd-list-row__body">
            <SkelLine width={190} height={14} />
            <SkelLine width={150} height={10} />
          </span>
          <SkelBlock width={61} height={12} shape="pill" />
          <SkelBlock width={77} height={26} shape="pill" />
        </div>
      </div>
    </div>
  )
}

const BAR_HEIGHTS = [
  40, 70, 55, 90, 60, 100, 75, 45, 85, 65, 95, 50, 80, 58, 72, 92, 48, 68,
] as const

function StatisticsBarsSkeleton() {
  return (
    <div style={{ flex: 1, minWidth: 0 }} data-skel-region="">
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 10,
          height: 176,
          padding: '16px 8px 0 0',
          boxSizing: 'border-box',
        }}
      >
        {BAR_HEIGHTS.map((height, index) => (
          <SkelBlock
            key={index}
            width={0}
            height={`${height}%`}
            shape="soft"
            style={{ flex: 1, minWidth: 0 }}
          />
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
        }}
      >
        <SkelLine width={40} height={10} />
        <SkelLine width={40} height={10} />
        <SkelLine width={40} height={10} />
      </div>
    </div>
  )
}

function StatisticsRowSkeleton() {
  const widths = [110, 30, 40, 46, 60] as const
  return (
    <tr aria-hidden="true" style={{ borderBottom: '1px solid var(--border)' }}>
      {widths.map((width, cell) => (
        <td key={cell} style={{ padding: '8px 12px' }}>
          <SkelLine width={width} height={12} />
        </td>
      ))}
    </tr>
  )
}

/** Statistics first-load — Design `statistics/loading`. Labels and range stay real. */
export function StatisticsLoadingBody(): ReactNode {
  return (
    <div role="group" aria-busy="true" aria-label="Loading Statistics">
      <SkelStatus>Loading statistics…</SkelStatus>
      <div className="hd-grid hd-grid--4">
        {['Tasks run', 'Success rate', 'Agent time', 'Reported cost'].map(
          (label) => (
            <div key={label} className="hd-stat" data-skel-region="">
              <span className="hd-stat__label">{label}</span>
              <span className="hd-stat__value">
                <SkelLine width={80} height={24} />
              </span>
              <span className="hd-stat__delta">
                <SkelLine width={120} height={10} />
              </span>
            </div>
          ),
        )}
      </div>
      <div className="hd-card" style={{ marginTop: 'var(--space-4)' }}>
        <div className="hd-row" style={{ marginBottom: 'var(--space-3)' }}>
          <h2 className="hd-card__title" style={{ margin: 0, flex: 1 }}>
            Tasks per day
          </h2>
          <span className="caption hd-muted">Done</span>
          <span className="caption hd-muted">Failed</span>
        </div>
        <StatisticsBarsSkeleton />
      </div>
      <div className="hd-card" style={{ marginTop: 'var(--space-4)' }}>
        <h2 className="hd-card__title">By harness</h2>
        <table
          style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px 12px' }}>Harness</th>
              <th style={{ textAlign: 'right', padding: '8px 12px' }}>Tasks</th>
              <th style={{ textAlign: 'right', padding: '8px 12px' }}>Success</th>
              <th style={{ textAlign: 'right', padding: '8px 12px' }}>
                Median duration
              </th>
              <th style={{ textAlign: 'right', padding: '8px 12px' }}>Cost</th>
            </tr>
          </thead>
          <tbody data-skel-region="">
            {Array.from({ length: 5 }, (_, index) => (
              <StatisticsRowSkeleton key={index} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
