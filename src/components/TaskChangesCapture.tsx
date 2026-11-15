import type {
  TaskChangesEntryRef,
  TaskChangesObservation,
  TaskId,
} from '../model'
import {
  CHANGES_ATTRIBUTION,
  INCOMPLETE_NOTE,
  MULTI_TAB_CAPTION,
  TASK_LEVEL_NOT_CAPTURED_REASON,
  TURNS_CAPTION,
  UNMERGED_CAPTION,
  ZERO_COMPLETE_CAPTION,
} from '../presentation/taskChangesCopy'
import {
  changesShowsZeroCompleteCaption,
  changesTabCount,
  showsTaskLevelNotCapturedReasons,
} from '../presentation/taskChangesCounts'
import { scopeTitle } from '../presentation/taskChangesFormat'
import { ChangesPaneNote } from './TaskChangesChrome'
import { TaskChangesDiffBlock } from './TaskChangesDiffBlock'
import {
  ChangesPaneShell,
  ChangesReasonsList,
} from './TaskChangesNotes'
import { TaskChangesRepoBlock } from './TaskChangesRepoBlock'

type Props = {
  readonly observation: TaskChangesObservation
  readonly loadingText: boolean
  readonly selectedEntry: TaskChangesEntryRef | null
  readonly expandedRepos: readonly string[]
  readonly onSelectEntry: (entry: TaskChangesEntryRef) => void
  readonly onSelectTurn: (taskId: TaskId) => void
  readonly onToggleRepo: (repositoryRoot: string, expanded: boolean) => void
  readonly onUnavailable: (label: string) => void
}

export function TaskChangesCapture({
  observation,
  loadingText,
  selectedEntry,
  expandedRepos,
  onSelectEntry,
  onSelectTurn,
  onToggleRepo,
  onUnavailable,
}: Props) {
  const multi = observation.repositories.length > 1
  const selected = selectedEntry ?? observation.selectedEntry
  const text = loadingText ? null : observation.text
  const panels = loadingText ? null : observation.textPanels
  const textSpecimen = panels !== null && panels.length > 0
  return (
    <ChangesPaneShell>
      {!textSpecimen &&
      observation.capture.state === 'incomplete' &&
      observation.capture.reason === 'capture_timeout' ? (
        <ChangesPaneNote
          tone="warn"
          title={INCOMPLETE_NOTE.title}
          body={INCOMPLETE_NOTE.body}
        />
      ) : null}
      {observation.turns ? (
        <TurnBar observation={observation} onSelectTurn={onSelectTurn} />
      ) : null}
      {textSpecimen ? (
        <TaskChangesDiffBlock
          selectedEntry={selected}
          scopeLabel={null}
          text={null}
          textPanels={panels}
          loadingText={false}
          samePathCaption={false}
          onUnavailable={onUnavailable}
        />
      ) : (
        <>
          {multi ? (
            <p className="hd-m05-attribution">{CHANGES_ATTRIBUTION}</p>
          ) : null}
          {observation.repositories.map((repo) => (
            <TaskChangesRepoBlock
              key={repo.repositoryRoot}
              repo={repo}
              expanded={expandedRepos.includes(repo.repositoryRoot)}
              selectedEntry={selected}
              paneAttribution={multi}
              onToggleRepo={onToggleRepo}
              onSelectEntry={onSelectEntry}
              onUnavailable={onUnavailable}
            />
          ))}
          {showsTaskLevelNotCapturedReasons(observation) ? (
            <ChangesReasonsList items={[TASK_LEVEL_NOT_CAPTURED_REASON]} />
          ) : null}
          <TaskChangesDiffBlock
            selectedEntry={selected}
            scopeLabel={selected ? scopeTitle(selected.scope) : null}
            text={text}
            textPanels={null}
            loadingText={loadingText}
            samePathCaption={selectedScopeSeparate(observation, selected)}
            onUnavailable={onUnavailable}
          />
          <CaptureCaptions observation={observation} />
        </>
      )}
    </ChangesPaneShell>
  )
}

function CaptureCaptions({
  observation,
}: {
  readonly observation: TaskChangesObservation
}) {
  const completeZero = changesShowsZeroCompleteCaption(observation)
  const reported = observation.repositories.some(
    (repo) => repo.reason === 'reported_conflict',
  )
  const multiCounted =
    observation.repositories.length > 1 && changesTabCount(observation) !== null
  return (
    <>
      {completeZero ? (
        <p className="hd-m05-caption">{ZERO_COMPLETE_CAPTION}</p>
      ) : null}
      {multiCounted ? <p className="hd-m05-caption">{MULTI_TAB_CAPTION}</p> : null}
      {reported ? <p className="hd-m05-caption">{UNMERGED_CAPTION}</p> : null}
    </>
  )
}

function TurnBar({
  observation,
  onSelectTurn,
}: {
  readonly observation: TaskChangesObservation
  readonly onSelectTurn: (taskId: TaskId) => void
}) {
  const turns = observation.turns
  if (turns === null) return null
  const current = turns.find((turn) => turn.taskId === observation.taskId)
  return (
    <>
      <div className="hd-m05-turnbar">
        <label>
          Showing{' '}
          <select
            aria-label="Turn"
            value={observation.taskId}
            onChange={(event) => onSelectTurn(event.target.value as TaskId)}
          >
            {turns.map((turn) => (
              <option key={turn.taskId} value={turn.taskId}>
                {turnOptionLabel(turn)}
              </option>
            ))}
          </select>
        </label>
        <span className="caption hd-faint hd-mono">
          task {current?.taskId ?? observation.taskId}
        </span>
      </div>
      <p className="hd-m05-caption">{TURNS_CAPTION}</p>
    </>
  )
}

function turnOptionLabel(turn: {
  readonly turnIndex: number
  readonly turnCount: number
  readonly current: boolean
}): string {
  const base = `Turn ${turn.turnIndex} of ${turn.turnCount}`
  return turn.current ? `${base} · current` : base
}

function selectedScopeSeparate(
  observation: TaskChangesObservation,
  selected: TaskChangesEntryRef | null,
): boolean {
  if (selected === null) return false
  const repo = observation.repositories.find(
    (item) => item.repositoryRoot === selected.repositoryRoot,
  )
  return repo?.scopes[selected.scope]?.countsAndPatchSeparate === true
}
