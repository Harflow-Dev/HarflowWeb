import {
  taskChangesRowEntry,
  type TaskChangesEntryRef,
  type TaskChangesRepository,
  type TaskChangesRow,
  type TaskChangesScope,
  type TaskChangesScopeId,
} from '../model'
import {
  CLEAN_BILL_NOTE,
  ZERO_SCOPE_NOTE,
  scopeReasonNote,
  workingTreeCaption,
} from '../presentation/taskChangesCopy'
import {
  changesDisplayPath,
  changesRowKey,
} from '../presentation/taskChangesPaths'
import { scopeUnmergedUnknown } from '../presentation/taskChangesScopes'
import { formatScopeCount } from '../presentation/taskChangesCounts'
import {
  changesRowIsDisabled,
  changesRowStateLabel,
  changesStatusLetter,
} from '../presentation/taskChangesRowLabels'
import { scopeTag } from '../presentation/taskChangesTags'
import {
  changesEntriesEqual,
  scopeTitle,
} from '../presentation/taskChangesFormat'
import { ChangesAction, ChangesTagView } from './TaskChangesChrome'

type Props = {
  readonly repo: TaskChangesRepository
  readonly scopeId: TaskChangesScopeId
  readonly scope: TaskChangesScope
  readonly selectedEntry: TaskChangesEntryRef | null
  readonly onSelectEntry: (entry: TaskChangesEntryRef) => void
  readonly onUnavailable: (label: string) => void
}

export function TaskChangesScope({
  repo,
  scopeId,
  scope,
  selectedEntry,
  onSelectEntry,
  onUnavailable,
}: Props) {
  const tag = scopeTag(scope)
  const note = scopeNote(repo, scopeId, scope)
  // Row-limit scopes keep the truncated tag; paging "Showing N of M" is only
  // for available scopes with more pages still to read (design multi).
  const showMore =
    !scope.rowsTruncated &&
    scope.state === 'available' &&
    scope.rows.length > 0 &&
    scope.rows.length < scope.rowCount
  return (
    <div className="hd-m05-scope">
      <div className="hd-m05-scope__head">
        <span>{scopeTitle(scopeId)}</span>
        <span className="hd-tab__count">{formatScopeCount(scope)}</span>
        {tag ? <ChangesTagView tag={tag} /> : null}
      </div>
      {note ? <p className="hd-m05-caption">{note}</p> : null}
      {scope.rows.map((row) => (
        <FileRow
          key={`${scopeId}:${changesRowKey(row)}`}
          repo={repo}
          scopeId={scopeId}
          row={row}
          selected={changesEntriesEqual(
            selectedEntry,
            taskChangesRowEntry(repo.repositoryRoot, scopeId, row),
          )}
          onSelectEntry={onSelectEntry}
        />
      ))}
      {showMore ? (
        <div className="hd-m05-more">
          <span className="caption hd-faint">
            Showing {scope.rows.length} of {scope.rowCount} rows
          </span>
          <ChangesAction label="Load more rows" onUnavailable={onUnavailable} />
        </div>
      ) : null}
    </div>
  )
}

function FileRow({
  repo,
  scopeId,
  row,
  selected,
  onSelectEntry,
}: {
  readonly repo: TaskChangesRepository
  readonly scopeId: TaskChangesScopeId
  readonly row: TaskChangesRow
  readonly selected: boolean
  readonly onSelectEntry: (entry: TaskChangesEntryRef) => void
}) {
  const disabled = changesRowIsDisabled(row)
  const state = changesRowStateLabel(row)
  const selectedClass = selected ? ' is-selected' : ''
  const dimClass = disabled ? ' hd-m05-file--dim' : ''
  return (
    <button
      type="button"
      className={`hd-file hd-m05-file${selectedClass}${dimClass}`}
      disabled={disabled}
      aria-current={selected ? 'true' : undefined}
      onClick={() =>
        onSelectEntry(taskChangesRowEntry(repo.repositoryRoot, scopeId, row))
      }
    >
      <span
        className={`hd-m05-status hd-m05-status--${row.status}`}
        title={row.status}
      >
        {changesStatusLetter(row.status)}
        <span className="hd-sr"> {row.status}</span>
      </span>
      <span className="hd-file__path">{changesDisplayPath(row)}</span>
      {state ? <span className="hd-m05-rowstate">{state}</span> : null}
      {row.additions === null ? null : (
        <>
          <span className="hd-file__add">+{row.additions}</span>
          <span className="hd-file__del">{`\u2212${row.deletions ?? 0}`}</span>
        </>
      )}
    </button>
  )
}

function scopeNote(
  repo: TaskChangesRepository,
  scopeId: TaskChangesScopeId,
  scope: TaskChangesScope,
): string | null {
  if (scope.state === 'not_captured') {
    return scopeReasonNote(scope.reason)
  }
  if (scope.rowCount === 0 && scopeUnmergedUnknown(scope)) return CLEAN_BILL_NOTE
  if (scope.rowCount === 0 && scope.state === 'available') return ZERO_SCOPE_NOTE
  if (scopeId !== 'working_tree') return null
  return workingTreeCaption(repo.baselineDirty)
}
