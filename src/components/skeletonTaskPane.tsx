import type { ReactNode } from 'react'
import { SkelLine, SkelStatus } from './skeletonPrimitives'

/**
 * Task Changes first-page skeleton — Design `task/changes-loading`
 * (M05 approval; formerly `m05-proposal/changes-loading`).
 * StatusRegion remains the only polite live region.
 */
export function ChangesLoadingBody(): ReactNode {
  return (
    <div
      className="hd-m05-panebody"
      role="group"
      aria-busy="true"
      aria-label="Reading stored changes"
    >
      <SkelStatus>Reading stored changes</SkelStatus>
      <div className="hd-m05-panenote hd-m05-panenote--info">
        <strong>Reading stored changes</strong>
      </div>
      <PaneSkeletonLines count={4} />
    </div>
  )
}

/** Diff region skeleton while the file list stays mounted (file switch). */
export function ChangesDiffLoadingBody(): ReactNode {
  return (
    <div
      role="group"
      aria-busy="true"
      aria-label="Reading diff"
      className="hw-changes-diff-skel"
    >
      <SkelStatus>Reading diff</SkelStatus>
      <PaneSkeletonLines count={2} />
      <p className="hd-m05-caption">
        Loading: the row stays selected and no text is implied.
      </p>
    </div>
  )
}

/**
 * Task Events pane skeleton — Design `task/events-loading`
 * (M05 approval; formerly `m05-proposal/events-loading`).
 */
export function EventsLoadingBody(): ReactNode {
  return (
    <div
      className="hd-m05-panebody"
      role="group"
      aria-busy="true"
      aria-label="Loading Events"
    >
      <SkelStatus>Loading Events</SkelStatus>
      <h3 className="hd-m05-h">Task</h3>
      <PaneSkeletonLines count={2} />
      <h3 className="hd-m05-h">Captured activity facts</h3>
      <p>Loading tool activity</p>
      <PaneSkeletonLines count={1} />
      <h3 className="hd-m05-h">Captured activity</h3>
      <p>Loading captured history</p>
      <PaneSkeletonLines count={3} />
    </div>
  )
}

function PaneSkeletonLines({ count }: { readonly count: number }) {
  return (
    <div className="hw-pane-skel-lines" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <SkelLine
          key={index}
          width={`${88 - index * 11}%`}
          height={14}
        />
      ))}
    </div>
  )
}
