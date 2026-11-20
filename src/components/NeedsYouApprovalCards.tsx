import type { NeedsYouTaskApprovalCardView } from '../presentation/needsYouApprovalCardView'
import type { NeedsYouCheckpointCardView } from '../presentation/needsYouCheckpointCardView'
import { Icon } from './Icon'
import type { NeedsYouCardActions } from './NeedsYouCard'
import {
  ApprovalHead,
  OpenLink,
  SettledActions,
} from './NeedsYouCardChrome'
import {
  useFocusResult,
  useNeedsYouCardRefs,
} from './NeedsYouCardHooks'

export function TaskApprovalNeedsYouCard({
  itemId,
  view,
  focusResultSeq,
  actions,
}: {
  readonly itemId: string
  readonly view: NeedsYouTaskApprovalCardView
  readonly focusResultSeq: number
  readonly actions: NeedsYouCardActions
}) {
  const { rootRef, resultRef } = useNeedsYouCardRefs()
  useFocusResult(focusResultSeq, resultRef, rootRef)

  const className = view.settled
    ? 'hd-approval hd-approval--settled'
    : 'hd-approval'

  return (
    <section
      className={className}
      aria-label={view.actionLabel}
      tabIndex={-1}
      ref={rootRef}
    >
      <ApprovalHead view={view} />
      <div className="hd-approval__body">
        <div className="hd-approval__cmd">{view.command}</div>
        <div className="hd-approval__meta">{view.cwdMeta}</div>
      </div>
      {view.mode.kind === 'decide' ? (
        <div className="hd-approval__actions">
          <button
            type="button"
            className="hd-btn hd-btn--primary"
            disabled={view.mode.disabled}
            onClick={() => actions.onRespondTask(itemId, 'approve')}
          >
            {view.approveLabel}
          </button>
          <button
            type="button"
            className="hd-btn hd-btn--secondary"
            disabled={view.mode.disabled}
            onClick={() => actions.onRespondTask(itemId, 'reject')}
          >
            {view.rejectLabel}
          </button>
          <span style={{ flex: 1 }} />
          <OpenLink link={view.openLink} actions={actions} />
        </div>
      ) : (
        <SettledActions
          title={view.mode.title}
          lines={view.mode.lines}
          refresh={view.mode.refresh}
          refreshDisabled={view.mode.refreshDisabled}
          resultRef={resultRef}
          onRefresh={() => actions.onRefreshTask(itemId)}
          openLink={<OpenLink link={view.openLink} actions={actions} />}
        />
      )}
    </section>
  )
}

export function CheckpointNeedsYouCard({
  itemId,
  view,
  focusResultSeq,
  actions,
}: {
  readonly itemId: string
  readonly view: NeedsYouCheckpointCardView
  readonly focusResultSeq: number
  readonly actions: NeedsYouCardActions
}) {
  const { rootRef, resultRef } = useNeedsYouCardRefs()
  useFocusResult(focusResultSeq, resultRef, rootRef)

  const className = view.settled
    ? 'hd-approval hd-approval--settled'
    : 'hd-approval'

  return (
    <section
      className={className}
      aria-label={view.actionLabel}
      tabIndex={-1}
      ref={rootRef}
    >
      <div className="hd-approval__head">
        <Icon name={view.headIcon} />
        <span>{view.actionLabel}</span>
        <span className="hd-approval__src">{view.source}</span>
      </div>
      <div className="hd-approval__body">
        <div className="hd-approval__cmd">{view.command}</div>
        <div className="hd-approval__meta">{view.meta}</div>
      </div>
      {view.mode.kind === 'decide' ? (
        <div className="hd-approval__actions">
          <button
            type="button"
            className="hd-btn hd-btn--primary"
            disabled={view.mode.disabled}
            onClick={() => actions.onRespondCheckpoint(itemId, 'approve')}
          >
            {view.approveLabel}
          </button>
          <button
            type="button"
            className="hd-btn hd-btn--secondary"
            disabled={view.mode.disabled}
            onClick={() => actions.onRespondCheckpoint(itemId, 'reject')}
          >
            {view.rejectLabel}
          </button>
          <span style={{ flex: 1 }} />
          <OpenLink link={view.openLink} actions={actions} />
        </div>
      ) : (
        <SettledActions
          title={view.mode.title}
          lines={view.mode.lines}
          refresh={view.mode.refresh}
          refreshDisabled={view.mode.refreshDisabled}
          resultRef={resultRef}
          onRefresh={() => actions.onRefreshCheckpoint(itemId)}
          openLink={<OpenLink link={view.openLink} actions={actions} />}
        />
      )}
    </section>
  )
}