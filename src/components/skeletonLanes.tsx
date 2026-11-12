import {
  SkelBlock,
  SkelLine,
  SkelParagraph,
  SkelToolRow,
} from './skeletonPrimitives'

function LaneHeadSkeleton() {
  return (
    <div
      className="hd-lane__head"
      data-skel-region=""
      style={{ display: 'flex', alignItems: 'center', gap: 10 }}
    >
      <SkelBlock width={16} height={16} shape="circle" />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <SkelLine width={120} height={12} />
        <SkelLine width={80} height={10} />
      </div>
      <SkelBlock width={64} height={12} shape="pill" />
      <SkelBlock width={26} height={26} shape="soft" />
    </div>
  )
}

function LaneBodySkeleton({ index }: { readonly index: number }) {
  const long = index % 2 === 0
  return (
    <div className="hd-lane__body" data-skel-region="" style={{ pointerEvents: 'none' }}>
      <SkelParagraph
        widths={long ? ['100%', '96%', '80%', '45%'] : ['100%', '70%']}
      />
      <SkelToolRow width={long ? 170 : 130} />
      <SkelParagraph widths={['100%', '92%', '60%']} />
      <SkelToolRow width={150} />
      {long ? <SkelParagraph widths={['100%', '84%']} /> : null}
    </div>
  )
}

function LaneFootSkeleton() {
  return (
    <div className="hd-lane__foot">
      <form className="hd-composer" aria-label="Message">
        <textarea
          className="hd-composer__input"
          aria-label="Message this lane"
          rows={1}
          readOnly
          aria-readonly="true"
          aria-disabled="true"
          disabled
          style={{ minHeight: 28 }}
        />
        <button
          type="button"
          className="hd-btn hd-btn--primary hd-btn--sm"
          aria-label="Send"
          aria-disabled="true"
          disabled
        >
          Send
        </button>
      </form>
    </div>
  )
}

/** Shared lane column skeletons for Parallel group and workflow-run Parallel. */
export function LanesSkeleton({ count = 3 }: { readonly count?: number }) {
  return (
    <div
      className="hd-lanes"
      role="region"
      aria-label="Parallel lanes"
      data-skeleton=""
    >
      {Array.from({ length: count }, (_, index) => (
        <section
          key={index}
          className="hd-lane"
          style={{ flex: '1 0 360px', minWidth: 360 }}
        >
          <LaneHeadSkeleton />
          <LaneBodySkeleton index={index} />
          <LaneFootSkeleton />
        </section>
      ))}
    </div>
  )
}

export function StandaloneNodesSkeleton() {
  return (
    <div
      className="hd-standalone__nodes"
      data-skel-region=""
      style={{ display: 'flex', gap: 12 }}
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          style={{
            width: 200,
            height: 74,
            flex: 'none',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          <SkelBlock
            width="100%"
            height="100%"
            shape="soft"
            style={{ flex: 'none' }}
          />
        </div>
      ))}
    </div>
  )
}

/** Fixed four-node graph skeleton from Design `graph()` defaults. */
export function GraphSkeleton({
  width = 560,
  height = 320,
}: {
  readonly width?: number
  readonly height?: number
}) {
  const nw = 220
  const nh = 88
  const tw = 70
  const th = 38
  const cy = Math.round(height / 2)
  const gap = Math.round(nw * 0.5)
  const items: Array<{ w: number; h: number; shape: 'pill' | 'soft' }> = [
    { w: tw, h: th, shape: 'pill' },
    { w: nw, h: nh, shape: 'soft' },
    { w: nw, h: nh, shape: 'soft' },
    { w: tw, h: th, shape: 'pill' },
  ]
  let x = 8
  const edges: Array<{ x1: number; x2: number }> = []
  const nodes = items.map((item, index) => {
    const left = x
    if (index < items.length - 1) {
      edges.push({ x1: left + item.w, x2: left + item.w + gap })
    }
    x += item.w + gap
    return { ...item, left }
  })
  return (
    <div
      data-skel-region=""
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <svg
        width={width}
        height={height}
        style={{ position: 'absolute', left: 0, top: 0 }}
        aria-hidden="true"
      >
        {edges.map((edge, index) => (
          <line
            key={index}
            x1={edge.x1}
            y1={cy}
            x2={edge.x2}
            y2={cy}
            stroke="var(--border-strong)"
            strokeWidth={1.5}
          />
        ))}
      </svg>
      {nodes.map((node, index) => (
        <SkelBlock
          key={index}
          width={node.w}
          height={node.h}
          shape={node.shape}
          style={{
            position: 'absolute',
            left: node.left,
            top: Math.round(cy - node.h / 2),
          }}
        />
      ))}
    </div>
  )
}
