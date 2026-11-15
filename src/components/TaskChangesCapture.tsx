import type {
  TaskChangesEntryRef,
  TaskChangesObservation,
  TaskId,
} from '../model'
import type { TaskChangesTextPanel, TaskChangesTurnMember } from '../presentation/taskState'
import {
  CHANGES_ATTRIBUTION,
  INCOMPLETE_NOTE,
  MULTI_TAB_CAPTION,
  TASK_LEVEL_NOT_CAPTURED_REASON,
  TURNS_CAPTION,
  UNMERGED_CAPTION,
  ZERO_COMPLETE_CAPTION,
  taskLevelNotCapturedNote,
} from '../presentation/taskChangesCopy'
import {
  changesRepositoryCountLabel,
  changesShowsZeroCompleteCaption,
  changesTabCount,
  changesUsesSummaryLayout,
  showsTaskLevelNotCapturedReasons,
} from '../presentation/taskChangesCounts'
import { shortTaskId } from '../presentation/taskChangesFormat'
import {
  observationHasReportedConflict,
  scopeCountsAndPatchSeparate,
} from '../presentation/taskChangesScopes'
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
  readonly turns: readonly TaskChangesTurnMember[] | null
  readonly textPanels: readonly TaskChangesTextPanel[] | null
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
  turns,
  textPanels,
  onSelectEntry,
  onSelectTurn,
  onToggleRepo,
  onUnavailable,
}: Props) {
  const summaryLayout = changesUsesSummaryLayout(observation)
  const text = loadingText ? null : observation.text
  const textSpecimen = textPanels !== null && textPanels.length > 0
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
      {turns ? (
        <TurnBar
          observation={observation}
          turns={turns}
          onSelectTurn={onSelectTurn}
        />
      ) : null}
      {textSpecimen ? (
        <TaskChangesDiffBlock
          selectedEntry={selectedEntry}
          text={null}
          textPanels={textPanels}
          loadingText={false}
          samePathCaption={false}
          onUnavailable={onUnavailable}
        />
      ) : (
        <>
          {observation.capture.state === 'not_captured' ? (
            <ChangesPaneNote
              tone="warn"
              {...taskLevelNotCapturedNote(observation.capture.reason)}
            />
          ) : null}
          {summaryLayout ? (
            <p className="hd-m05-attribution">{CHANGES_ATTRIBUTION}</p>
          ) : null}
          {observation.repositories.map((repo) => (
            <TaskChangesRepoBlock
              key={repo.repositoryRoot}
              repo={repo}
              expanded={expandedRepos.includes(repo.repositoryRoot)}
              count={changesRepositoryCountLabel(observation, repo)}
              selectedEntry={selectedEntry}
              summaryLayout={summaryLayout}
              onToggleRepo={onToggleRepo}
              onSelectEntry={onSelectEntry}
              onUnavailable={onUnavailable}
            />
          ))}
          {showsTaskLevelNotCapturedReasons(observation) ? (
            <ChangesReasonsList items={[TASK_LEVEL_NOT_CAPTURED_REASON]} />
          ) : null}
          <TaskChangesDiffBlock
            selectedEntry={selectedEntry}
            text={text}
            textPanels={null}
            loadingText={loadingText}
            samePathCaption={selectedScopeSeparate(observation, selectedEntry)}
            onUnavailable={onUnavailable}
          />
          <CaptureCaptions
            observation={observation}
            summaryLayout={summaryLayout}
          />
        </>
      )}
    </ChangesPaneShell>
  )
}

function CaptureCaptions({
  observation,
  summaryLayout,
}: {
  readonly observation: TaskChangesObservation
  readonly summaryLayout: boolean
}) {
  const multiCounted = summaryLayout && changesTabCount(observation) !== null
  return (
    <>
      {changesShowsZeroCompleteCaption(observation) ? (
        <p className="hd-m05-caption">{ZERO_COMPLETE_CAPTION}</p>
      ) : null}
      {multiCounted ? <p className="hd-m05-caption">{MULTI_TAB_CAPTION}</p> : null}
      {observationHasReportedConflict(observation) ? (
        <p className="hd-m05-caption">{UNMERGED_CAPTION}</p>
      ) : null}
    </>
  )
}

function TurnBar({
  observation,
  turns,
  onSelectTurn,
}: {
  readonly observation: TaskChangesObservation
  readonly turns: readonly TaskChangesTurnMember[]
  readonly onSelectTurn: (taskId: TaskId) => void
}) {
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
          task {shortTaskId(current?.taskId ?? observation.taskId)}
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
  const scope = repo?.scopes[selected.scope]
  return scope !== undefined && scope !== null && scopeCountsAndPatchSeparate(scope)
}
