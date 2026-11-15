import type { ReactNode } from 'react'
import { SkelLine } from './skeletonPrimitives'

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
