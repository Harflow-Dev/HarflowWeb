import type { ReactNode } from 'react'
import { Icon } from './Icon'
import { SkelBlock, SkelLine, SKEL_TITLE_WIDTHS } from './skeletonPrimitives'

export { WorkflowEditorLoadingPage } from './skeletonWorkflowEditor'

function WorkflowListRowSkeleton({ index }: { readonly index: number }) {
  return (
    <div className="hd-list-row" aria-hidden="true">
      <SkelBlock width={32} height={32} shape="soft" />
      <span className="hd-list-row__body">
        <SkelLine
          width={SKEL_TITLE_WIDTHS[index % SKEL_TITLE_WIDTHS.length]!}
          height={14}
        />
        <SkelLine width={280 + (index % 2) * 60} height={10} />
      </span>
      <SkelBlock width={46} height={12} shape="pill" />
      <span className="hd-list-row__actions">
        <SkelBlock width={70} height={32} shape="pill" />
        <SkelBlock width={70} height={32} shape="pill" />
      </span>
    </div>
  )
}

/** Workflows list first-load — Design `workflows` / `workflows/loading`. */
export function WorkflowsLoadingPage(): ReactNode {
  return (
    <div
      className="hd-page"
      role="group"
      aria-busy="true"
      aria-label="Loading Workflows"
    >
      <div className="hd-page__head">
        <h1 className="hd-page__title">Workflows</h1>
        <button
          type="button"
          className="hd-btn hd-btn--secondary"
          aria-label="New workflow"
          aria-disabled="true"
          disabled
        >
          <Icon name="plus" size="sm" />
          New workflow
        </button>
      </div>
      <div className="hd-list" data-skel-region="" data-skeleton="">
        {Array.from({ length: 5 }, (_, index) => (
          <WorkflowListRowSkeleton key={index} index={index} />
        ))}
      </div>
    </div>
  )
}
