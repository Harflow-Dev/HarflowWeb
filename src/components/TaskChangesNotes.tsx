import type { ReactNode } from 'react'
import {
  DOCUMENT_UNAVAILABLE_NOTE,
  DOCUMENT_UNAVAILABLE_REASONS,
  ENGINE_UNAVAILABLE_NOTE,
  LOADING_NOTE,
  NOT_OBSERVED_NOTE,
  NOT_STARTED_NOTE,
  NO_REPOSITORY_NOTE,
  RUNNING_NOTE,
  SETTLING_NOTE,
} from '../presentation/taskChangesCopy'
import {
  ChangesAction,
  ChangesPaneNote,
  ChangesPaneSkelLines,
} from './TaskChangesChrome'

export function ChangesPaneShell({ children }: { readonly children: ReactNode }) {
  return <div className="hd-m05-panebody">{children}</div>
}

export function ChangesNotStartedBody() {
  return (
    <ChangesPaneShell>
      <ChangesPaneNote
        tone="info"
        title={NOT_STARTED_NOTE.title}
        body={NOT_STARTED_NOTE.body}
      />
    </ChangesPaneShell>
  )
}

export function ChangesRunningBody() {
  return (
    <ChangesPaneShell>
      <ChangesPaneNote
        tone="info"
        title={RUNNING_NOTE.title}
        body={RUNNING_NOTE.body}
      />
      <p className="hd-m05-caption">{RUNNING_NOTE.caption}</p>
    </ChangesPaneShell>
  )
}

export function ChangesNotObservedBody() {
  return (
    <ChangesPaneShell>
      <ChangesPaneNote
        tone="warn"
        title={NOT_OBSERVED_NOTE.title}
        body={NOT_OBSERVED_NOTE.body}
      />
    </ChangesPaneShell>
  )
}

export function ChangesNoRepositoryBody() {
  return (
    <ChangesPaneShell>
      <ChangesPaneNote
        tone="info"
        title={NO_REPOSITORY_NOTE.title}
        body={NO_REPOSITORY_NOTE.body}
      />
    </ChangesPaneShell>
  )
}

export function ChangesLoadingBody() {
  return (
    <div
      className="hd-m05-panebody"
      role="group"
      aria-busy="true"
      aria-label={LOADING_NOTE.title}
    >
      <ChangesPaneNote tone="info" title={LOADING_NOTE.title} />
      <ChangesPaneSkelLines count={4} />
    </div>
  )
}

export function ChangesSettlingBody() {
  return (
    <div className="hd-m05-panebody" role="group" aria-busy="true">
      <ChangesPaneNote
        tone="info"
        title={SETTLING_NOTE.title}
        body={SETTLING_NOTE.body}
      />
      <ChangesPaneSkelLines count={3} />
    </div>
  )
}

export function ChangesEngineUnavailableBody({
  onUnavailable,
}: {
  readonly onUnavailable: (label: string) => void
}) {
  return (
    <ChangesPaneShell>
      <ChangesPaneNote
        tone="warn"
        title={ENGINE_UNAVAILABLE_NOTE.title}
        body={ENGINE_UNAVAILABLE_NOTE.body}
      >
        <div className="hd-row hd-m05-actions">
          <ChangesAction label="Retry read" onUnavailable={onUnavailable} />
        </div>
      </ChangesPaneNote>
    </ChangesPaneShell>
  )
}

export function ChangesDocumentUnavailableBody({
  onUnavailable,
}: {
  readonly onUnavailable: (label: string) => void
}) {
  return (
    <ChangesPaneShell>
      <ChangesPaneNote
        tone="warn"
        title={DOCUMENT_UNAVAILABLE_NOTE.title}
        body={DOCUMENT_UNAVAILABLE_NOTE.body}
      >
        <div className="hd-row hd-m05-actions">
          <ChangesAction label="Retry read" onUnavailable={onUnavailable} />
        </div>
      </ChangesPaneNote>
      <ChangesReasonsList items={DOCUMENT_UNAVAILABLE_REASONS} />
    </ChangesPaneShell>
  )
}

export function ChangesReasonsList({
  items,
}: {
  readonly items: readonly { readonly code: string; readonly detail: string }[]
}) {
  return (
    <dl className="hd-m05-reasons">
      {items.map((item) => (
        <ReasonPair key={item.code} code={item.code} detail={item.detail} />
      ))}
    </dl>
  )
}

function ReasonPair({
  code,
  detail,
}: {
  readonly code: string
  readonly detail: string
}) {
  return (
    <>
      <dt>{code}</dt>
      <dd>{detail}</dd>
    </>
  )
}
