import type {
  ApprovalDecision,
  NeedsYouItem,
  NeedsYouLoad,
  TaskId,
  WorkflowRunId,
} from '../model'
import type { NeedsYouScreenState } from '../presentation'
import type { NeedsYouChrome } from '../presentation/needsYouChrome'
import { needsYouObservationWaitingCount } from '../presentation/needsYouDisplay'
import { Icon } from './Icon'
import { NeedsYouCard, type NeedsYouCardActions } from './NeedsYouCard'
import { NeedsYouLoadingPage } from './skeleton'

const UNAVAILABLE_ID = 'needs-you-action-unavailable'
export const NEEDS_YOU_QUESTION_EXPLANATION =
  'Unavailable. Question replies are not available in this slice.'

type Props = {
  readonly state: NeedsYouScreenState
  readonly onOpenTask: (taskId: TaskId) => void
  readonly onOpenRun: (runId: WorkflowRunId) => void
  readonly onRespondTask: (itemId: string, decision: ApprovalDecision) => void
  readonly onRefreshTask: (itemId: string) => void
  readonly onRespondCheckpoint: (
    itemId: string,
    decision: ApprovalDecision,
  ) => void
  readonly onRefreshCheckpoint: (itemId: string) => void
}

/** Approved needs-you/waiting, empty, and main-pane loading composition. */
export function NeedsYouPage({
  state,
  onOpenTask,
  onOpenRun,
  onRespondTask,
  onRefreshTask,
  onRespondCheckpoint,
  onRefreshCheckpoint,
}: Props) {
  const { load } = state
  if (load.kind === 'loading') {
    return <NeedsYouLoadingPage />
  }

  const actions: NeedsYouCardActions = {
    onRespondTask,
    onRefreshTask,
    onRespondCheckpoint,
    onRefreshCheckpoint,
    onOpenTask,
    onOpenRun,
  }

  return (
    <div className="hd-page">
      <div className="hd-page__head">
        <h1 className="hd-page__title">Needs you</h1>
        <WaitingBadge load={load} />
      </div>
      <NeedsYouBody state={state} actions={actions} />
    </div>
  )
}

function WaitingBadge({ load }: { readonly load: NeedsYouLoad }) {
  if (load.kind !== 'ready' || load.observation.coverage !== 'complete') {
    return null
  }
  const waiting = needsYouObservationWaitingCount(load)
  if (waiting === 0) return null
  return (
    <span className="hd-badge hd-badge--attention">{waiting} waiting</span>
  )
}

function NeedsYouBody({
  state,
  actions,
}: {
  readonly state: NeedsYouScreenState
  readonly actions: NeedsYouCardActions
}) {
  const { load, chrome, displayItems } = state
  if (load.kind === 'unavailable') {
    return <p role="status">{load.message}</p>
  }
  if (load.kind !== 'ready') return null
  if (load.observation.coverage === 'partial') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <QuestionExplanation />
        <p className="hd-sr">
          Fixture requests. Not commands or answers on this computer.
        </p>
        <p role="status">{load.observation.coverageNote}</p>
        <p className="caption">
          {load.observation.items.length} known. Not a complete total.
        </p>
        <CardList
          items={displayItems}
          chrome={chrome}
          focusResultSeq={chrome.focusResultSeq}
          focusItemId={chrome.focusItemId}
          actions={actions}
        />
      </div>
    )
  }
  if (displayItems.length === 0) {
    return <NeedsYouEmpty />
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <QuestionExplanation />
      <p className="hd-sr">
        Fixture requests. Not commands or answers on this computer.
      </p>
      <CardList
        items={displayItems}
        chrome={chrome}
        focusResultSeq={chrome.focusResultSeq}
        focusItemId={chrome.focusItemId}
        actions={actions}
      />
    </div>
  )
}

function CardList({
  items,
  chrome,
  focusResultSeq,
  focusItemId,
  actions,
}: {
  readonly items: readonly NeedsYouItem[]
  readonly chrome: NeedsYouChrome
  readonly focusResultSeq: number
  readonly focusItemId: string | null
  readonly actions: NeedsYouCardActions
}) {
  return (
    <>
      {items.map((item) => (
        <NeedsYouCard
          key={item.id}
          item={item}
          chrome={chrome}
          focusResultSeq={focusResultSeq}
          focusItemId={focusItemId}
          unavailableId={UNAVAILABLE_ID}
          actions={actions}
        />
      ))}
    </>
  )
}

function QuestionExplanation() {
  return (
    <p id={UNAVAILABLE_ID} className="hd-sr">
      {NEEDS_YOU_QUESTION_EXPLANATION}
    </p>
  )
}

function NeedsYouEmpty() {
  return (
    <div className="hd-empty" style={{ paddingTop: 120 }}>
      <div className="hd-empty__icon">
        <Icon name="hand" />
      </div>
      <div className="hd-empty__title">Nothing needs you</div>
      <div className="hd-empty__text">
        Approvals and questions from running tasks and workflows appear here,
        so you can answer them in one place.
      </div>
    </div>
  )
}
