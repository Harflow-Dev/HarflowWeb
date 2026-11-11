import type { CSSProperties } from 'react'

export type SkelShape = 'line' | 'pill' | 'circle' | 'soft' | 'rect'

/** Alternating title widths from Design skeleton-specs `TITLE`. */
export const SKEL_TITLE_WIDTHS = [190, 140, 168, 120] as const

function size(v: number | string): string {
  return typeof v === 'number' ? `${v}px` : v
}

/** One shimmer block — mirrors Design `skelBlock` / `B` output markup. */
export function SkelBlock({
  width,
  height,
  shape = 'line',
  style,
}: {
  readonly width: number | string
  readonly height: number | string
  readonly shape?: SkelShape
  readonly style?: CSSProperties
}) {
  const shapeClass =
    shape === 'pill'
      ? ' hd-skel--pill'
      : shape === 'circle'
        ? ' hd-skel--circle'
        : shape === 'soft'
          ? ' hd-skel--soft'
          : ''
  return (
    <span
      className={`hd-skel hd-skel--shimmer${shapeClass}`}
      aria-hidden="true"
      style={{
        width: size(width),
        height: size(height),
        flex: 'none',
        ...style,
      }}
    />
  )
}

/** Line block — Design `line` helper: `B(w, h || 12)` with `max-width:100%`. */
export function SkelLine({
  width,
  height = 12,
}: {
  readonly width: number | string
  readonly height?: number
}) {
  return (
    <SkelBlock
      width={width}
      height={height}
      shape="line"
      style={{ maxWidth: '100%' }}
    />
  )
}

/** Sidebar / list task row: circle + title line + trailing pill. */
export function SkelTaskRow({ index }: { readonly index: number }) {
  return (
    <div className="hd-task-row" aria-hidden="true">
      <SkelBlock width={16} height={16} shape="circle" />
      <span style={{ flex: 1, minWidth: 0, display: 'block' }}>
        <SkelLine
          width={SKEL_TITLE_WIDTHS[index % SKEL_TITLE_WIDTHS.length]!}
          height={12}
        />
      </span>
      <SkelBlock width={24} height={10} shape="pill" />
    </div>
  )
}

export function SkelParagraph({
  widths,
}: {
  readonly widths: readonly (number | string)[]
}) {
  return (
    <div
      style={{
        margin: '0 0 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {widths.map((width, index) => (
        <SkelLine key={index} width={width} height={12} />
      ))}
    </div>
  )
}

export function SkelToolRow({ width }: { readonly width: number }) {
  return (
    <div
      style={{
        height: 28,
        margin: '0 0 16px',
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
