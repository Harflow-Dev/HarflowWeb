import type {
  DiffLine,
  TaskChangesEntryRef,
  TaskChangesTextObservation,
} from '../model'
import type { TaskChangesTextPanel } from '../presentation/taskState'
import {
  SAME_PATH_CAPTION,
  TEXT_LOADING_CAPTION,
  TEXT_REFUSAL_NOTE,
} from '../presentation/taskChangesCopy'
import { formatStoredKiB, scopeTitle } from '../presentation/taskChangesFormat'
import { changesEntryDisplayPath } from '../presentation/taskChangesPaths'
import {
  ChangesAction,
  ChangesPaneNote,
  ChangesPaneSkelLines,
} from './TaskChangesChrome'

type Props = {
  readonly selectedEntry: TaskChangesEntryRef | null
  readonly text: TaskChangesTextObservation | null
  readonly textPanels: readonly TaskChangesTextPanel[] | null
  readonly loadingText: boolean
  readonly samePathCaption: boolean
  readonly onUnavailable: (label: string) => void
}

export function TaskChangesDiffBlock({
  selectedEntry,
  text,
  textPanels,
  loadingText,
  samePathCaption,
  onUnavailable,
}: Props) {
  if (textPanels !== null && textPanels.length > 0) {
    return (
      <>
        {textPanels.map((panel, index) => (
          <TextPanelView
            key={`${panel.kind}-${index}`}
            panel={panel}
            onUnavailable={onUnavailable}
          />
        ))}
      </>
    )
  }
  if (loadingText && selectedEntry !== null) {
    return (
      <>
        <DiffHead entry={selectedEntry} />
        <div role="group" aria-busy="true" aria-label="Reading diff">
          <ChangesPaneSkelLines count={2} />
        </div>
        <p className="hd-m05-caption">{TEXT_LOADING_CAPTION}</p>
      </>
    )
  }
  if (text === null || selectedEntry === null) return null
  return (
    <>
      <TextObservationView text={text} onUnavailable={onUnavailable} />
      {samePathCaption ? <p className="hd-m05-caption">{SAME_PATH_CAPTION}</p> : null}
    </>
  )
}

function TextPanelView({
  panel,
  onUnavailable,
}: {
  readonly panel: TaskChangesTextPanel
  readonly onUnavailable: (label: string) => void
}) {
  if (panel.kind === 'loading') {
    return (
      <>
        <DiffHead entry={panel.entry} />
        <div role="group" aria-busy="true" aria-label="Reading diff">
          <ChangesPaneSkelLines count={2} />
        </div>
        <p className="hd-m05-caption">{TEXT_LOADING_CAPTION}</p>
      </>
    )
  }
  if (panel.kind === 'refusal') {
    return (
      <>
        <DiffHead entry={panel.entry} />
        <RefusalNote onUnavailable={onUnavailable} />
      </>
    )
  }
  return <TextObservationView text={panel.text} onUnavailable={onUnavailable} />
}

function TextObservationView({
  text,
  onUnavailable,
}: {
  readonly text: TaskChangesTextObservation
  readonly onUnavailable: (label: string) => void
}) {
  if (text.refusal !== null) {
    return (
      <>
        <DiffHead entry={text.entry} />
        <RefusalNote onUnavailable={onUnavailable} />
      </>
    )
  }
  return (
    <>
      <DiffHead entry={text.entry} />
      <DiffLines path={changesEntryDisplayPath(text.entry)} lines={text.lines} />
      <DiffMore text={text} onUnavailable={onUnavailable} />
    </>
  )
}

function DiffHead({ entry }: { readonly entry: TaskChangesEntryRef }) {
  return (
    <div className="hd-m05-diffhead">
      <span className="hd-file__path">{changesEntryDisplayPath(entry)}</span>
      <span className="hd-m05-tag">{scopeTitle(entry.scope)}</span>
    </div>
  )
}

function DiffLines({
  path,
  lines,
}: {
  readonly path: string
  readonly lines: readonly DiffLine[]
}) {
  return (
    <div className="hd-diff" role="group" aria-label={`Diff of ${path}`}>
      {lines.map((line, index) => (
        <DiffLineRow key={`${line.kind}-${index}`} line={line} />
      ))}
    </div>
  )
}

function DiffLineRow({ line }: { readonly line: DiffLine }) {
  const modifier =
    line.kind === 'add'
      ? ' hd-diff__line--add'
      : line.kind === 'del'
        ? ' hd-diff__line--del'
        : line.kind === 'hunk'
          ? ' hd-diff__line--hunk'
          : ''
  const sign =
    line.kind === 'add' ? '+' : line.kind === 'del' ? '\u2212' : ''
  return (
    <div className={`hd-diff__line${modifier}`}>
      <span className="hd-diff__sign">{sign}</span>
      {line.text}
    </div>
  )
}

function DiffMore({
  text,
  onUnavailable,
}: {
  readonly text: TaskChangesTextObservation
  readonly onUnavailable: (label: string) => void
}) {
  if (text.hasMore) {
    const label = `Read ${formatStoredKiB(text.returnedBytes)} of ${formatStoredKiB(text.totalBytes)} stored`
    return (
      <div className="hd-m05-more">
        <span className="caption hd-faint">{label}</span>
        <ChangesAction label="Read more" onUnavailable={onUnavailable} />
      </div>
    )
  }
  if (text.content.state === 'truncated' && text.content.reason === 'file_limit') {
    const end = formatStoredKiB(text.returnedBytes)
    return (
      <div className="hd-m05-more">
        <span className="caption hd-faint">
          Stored text ends here · {end} of a larger patch
        </span>
      </div>
    )
  }
  return null
}

function RefusalNote({
  onUnavailable,
}: {
  readonly onUnavailable: (label: string) => void
}) {
  return (
    <ChangesPaneNote
      tone="warn"
      title={TEXT_REFUSAL_NOTE.title}
      body={TEXT_REFUSAL_NOTE.body}
    >
      <div className="hd-row hd-m05-actions">
        <ChangesAction label="Reload changes" onUnavailable={onUnavailable} />
      </div>
    </ChangesPaneNote>
  )
}
