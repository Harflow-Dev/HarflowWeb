import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import type {
  PendingLaunchId,
  PendingLaunchInventoryEntry,
} from '../model'
import { PENDING_COPY } from '../presentation/pendingLaunchCopy'
import {
  pendingLaunchDetailView,
  pendingLaunchInventoryRow,
  type PendingLaunchDetailView,
  type PendingLaunchFact,
} from '../presentation/pendingLaunchViews'
import type { PendingLaunchesScreenState } from '../presentation/pendingLaunchesState'
import { SkelLine } from './skeletonPrimitives'

type Props = {
  readonly state: PendingLaunchesScreenState
  readonly onOpenLaunch: (id: PendingLaunchId) => void
  readonly onStopConfirm: (open: boolean) => void
}

const CHECK_UNAVAILABLE_ID = 'pending-check-unavailable'

/** Pending launches inventory or locked detail. */
export function PendingLaunchesView({
  state,
  onOpenLaunch,
  onStopConfirm,
}: Props) {
  const stopRef = useRef<HTMLButtonElement>(null)
  const wasConfirm = useRef(false)

  useEffect(() => {
    if (wasConfirm.current && !state.stopConfirm) {
      queueMicrotask(() => stopRef.current?.focus())
    }
    wasConfirm.current = state.stopConfirm
  }, [state.stopConfirm])

  if (state.selectedLaunchId !== null) {
    return (
      <PendingDetail
        state={state}
        stopRef={stopRef}
        onStopConfirm={onStopConfirm}
      />
    )
  }
  return <PendingInventory state={state} onOpenLaunch={onOpenLaunch} />
}

function PendingInventory({
  state,
  onOpenLaunch,
}: {
  readonly state: PendingLaunchesScreenState
  readonly onOpenLaunch: (id: PendingLaunchId) => void
}) {
  const load = state.inventory
  if (load.kind === 'loading') {
    return (
      <div
        className="hd-pending"
        role="group"
        aria-busy="true"
        aria-label={PENDING_COPY.loadingHeading}
      >
        <PendingChrome title={PENDING_COPY.inventoryHeading}>
          <section className="hd-pending-card">
            <h2>{PENDING_COPY.loadingHeading}</h2>
            <p>{PENDING_COPY.loadingLead}</p>
          </section>
          <div className="hd-pending-inventory" data-skel-region="">
            {[0, 1].map((index) => (
              <div key={index} className="hd-pending-launch" aria-hidden="true">
                <SkelLine width={190} height={12} />
                <SkelLine width={190} height={10} />
                <SkelLine width={140} height={10} />
              </div>
            ))}
          </div>
          <UnavailableCheck label={PENDING_COPY.checkAgain} />
        </PendingChrome>
      </div>
    )
  }
  if (load.kind === 'unavailable') {
    return (
      <div className="hd-pending">
        <PendingChrome title={PENDING_COPY.inventoryHeading}>
          <section className="hd-pending-card">
            <h2>{PENDING_COPY.failedHeading}</h2>
            <p>{PENDING_COPY.failedLead}</p>
          </section>
          <UnavailableCheck label={PENDING_COPY.checkAgain} />
        </PendingChrome>
      </div>
    )
  }
  const { inventory } = load
  if (inventory.coverage === 'complete' && inventory.entries.length === 0) {
    return (
      <div className="hd-pending">
        <PendingChrome title={PENDING_COPY.inventoryHeading}>
          <section className="hd-pending-card">
            <h2>{PENDING_COPY.emptyHeading}</h2>
            <p>{PENDING_COPY.emptyLead}</p>
          </section>
        </PendingChrome>
      </div>
    )
  }
  const incomplete = inventory.coverage === 'incomplete'
  return (
    <div className="hd-pending">
      <PendingChrome title={PENDING_COPY.inventoryHeading}>
        {incomplete ? (
          <section className="hd-pending-card">
            <h2>{PENDING_COPY.incompleteHeading}</h2>
            <p>{PENDING_COPY.incompleteLead}</p>
          </section>
        ) : (
          <section className="hd-pending-card">
            <h2>{PENDING_COPY.inventoryHeading}</h2>
            <p>{PENDING_COPY.inventoryLead}</p>
          </section>
        )}
        <div className="hd-pending-inventory">
          {inventory.entries.map((entry) => (
            <InventoryRow
              key={entry.launchId}
              entry={entry}
              onOpen={onOpenLaunch}
            />
          ))}
        </div>
        <UnavailableCheck
          label={
            incomplete ? PENDING_COPY.checkNextPage : PENDING_COPY.checkAgain
          }
        />
      </PendingChrome>
    </div>
  )
}

function InventoryRow({
  entry,
  onOpen,
}: {
  readonly entry: PendingLaunchInventoryEntry
  readonly onOpen: (id: PendingLaunchId) => void
}) {
  const row = pendingLaunchInventoryRow(entry)
  return (
    <button
      type="button"
      className="hd-pending-launch"
      onClick={() => onOpen(row.launchId)}
    >
      <strong>{row.title}</strong>
      <small>{row.meta}</small>
      <code>{row.launchId}</code>
    </button>
  )
}

function PendingDetail({
  state,
  stopRef,
  onStopConfirm,
}: {
  readonly state: PendingLaunchesScreenState
  readonly stopRef: RefObject<HTMLButtonElement | null>
  readonly onStopConfirm: (open: boolean) => void
}) {
  const load = state.status
  if (load.kind === 'loading') {
    return (
      <div className="hd-pending">
        <PendingChrome title={PENDING_COPY.neutralTitle}>
          <section className="hd-pending-card" aria-busy="true">
            <div aria-hidden="true" data-skel-region="">
              <SkelLine width={180} height={14} />
              <SkelLine width={320} height={10} />
              <SkelLine width={260} height={10} />
            </div>
          </section>
        </PendingChrome>
      </div>
    )
  }
  if (load.kind === 'unavailable') {
    return (
      <div className="hd-pending">
        <PendingChrome title={PENDING_COPY.neutralTitle}>
          <section className="hd-pending-card">
            <h2>{PENDING_COPY.unavailableHeading}</h2>
            <p>{PENDING_COPY.unavailableLead}</p>
          </section>
          <UnavailableCheck label={PENDING_COPY.checkAgain} />
          <p className="hd-pending-note">{PENDING_COPY.detailNote}</p>
        </PendingChrome>
      </div>
    )
  }
  const view = pendingLaunchDetailView(load.status, state.stopOutcome)
  return (
    <div className="hd-pending">
      <PendingChrome title={view.topbarTitle}>
        <DetailBody
          view={view}
          stopRef={stopRef}
          onStopConfirm={onStopConfirm}
        />
      </PendingChrome>
    </div>
  )
}

function DetailBody({
  view,
  stopRef,
  onStopConfirm,
}: {
  readonly view: PendingLaunchDetailView
  readonly stopRef: RefObject<HTMLButtonElement | null>
  readonly onStopConfirm: (open: boolean) => void
}) {
  return (
    <>
      <section className="hd-pending-card">
        <h2>{view.heading}</h2>
        <p>{view.lead}</p>
      </section>
      <Facts facts={view.facts} />
      <div className="hd-row">
        {view.showStop ? (
          <button
            ref={stopRef}
            type="button"
            className="hd-btn hd-btn--danger"
            onClick={() => onStopConfirm(true)}
          >
            {PENDING_COPY.stop}
          </button>
        ) : null}
        {view.showCheckAgain ? (
          <UnavailableCheck label={PENDING_COPY.checkAgain} />
        ) : null}
        {view.showCheckTaskStatus ? (
          <UnavailableCheck
            label={PENDING_COPY.checkTaskStatus}
            explanation={PENDING_COPY.checkTaskUnavailable}
          />
        ) : null}
      </div>
      {view.showStopAvailabilityNote ? (
        <p className="hd-pending-note">{PENDING_COPY.stopAvailabilityNote}</p>
      ) : null}
      {view.showUnconfirmedStopNote ? (
        <p className="hd-pending-note">{PENDING_COPY.unconfirmedStopNote}</p>
      ) : null}
      {view.showDetailNote ? (
        <p className="hd-pending-note">{PENDING_COPY.detailNote}</p>
      ) : null}
    </>
  )
}

function Facts({ facts }: { readonly facts: readonly PendingLaunchFact[] }) {
  return (
    <dl className="hd-pending-facts">
      {facts.map((fact) => (
        <Fact key={fact.label} fact={fact} />
      ))}
    </dl>
  )
}

function Fact({ fact }: { readonly fact: PendingLaunchFact }) {
  return (
    <>
      <dt>{fact.label}</dt>
      <dd>{fact.code ? <code>{fact.value}</code> : fact.value}</dd>
    </>
  )
}

function UnavailableCheck({
  label,
  explanation = PENDING_COPY.checkAgainUnavailable,
}: {
  readonly label: string
  readonly explanation?: string
}) {
  const describedBy = `${CHECK_UNAVAILABLE_ID}-${label.replace(/\s+/g, '-')}`
  return (
    <>
      <button
        type="button"
        className="hd-btn"
        disabled
        aria-disabled="true"
        aria-describedby={describedBy}
        title={explanation}
      >
        {label}
      </button>
      <span id={describedBy} className="hd-sr">
        {explanation}
      </span>
    </>
  )
}

function PendingChrome({
  title,
  children,
}: {
  readonly title: string
  readonly children: ReactNode
}) {
  return (
    <>
      <header className="hd-topbar">
        <span className="hd-topbar__title">{title}</span>
        <span className="hd-badge">{PENDING_COPY.badge}</span>
      </header>
      <div className="hd-pending-content">{children}</div>
      <footer className="hd-pending-composer">
        <textarea
          disabled
          aria-label="Pending launch message unavailable"
          placeholder={PENDING_COPY.composerPlaceholder}
        />
        <p>{PENDING_COPY.composerCaption}</p>
      </footer>
    </>
  )
}
