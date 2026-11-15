import type {
  TaskChangesEntryRef,
  TaskChangesRepository,
  TaskChangesRow,
  TaskChangesScope,
  TaskChangesScopeId,
} from '../model'
import { workingTreeCaption } from '../presentation/taskChangesCopy'
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

const GIT_DIR_NOTE =
  'Its Git directory could not be verified, so no command was given this work tree.'
const CLEAN_BILL_NOTE =
  'No rows in this scope. Conflicts were not examined, so this is not a clean bill.'
const ZERO_SCOPE_NOTE = 'No differences observed.'

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
          key={`${scopeId}:${row.path}`}
          repo={repo}
          scopeId={scopeId}
          row={row}
          selected={changesEntriesEqual(selectedEntry, {
            repositoryRoot: repo.repositoryRoot,
            scope: scopeId,
            path: row.path,
          })}
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
        onSelectEntry({
          repositoryRoot: repo.repositoryRoot,
          scope: scopeId,
          path: row.path,
        })
      }
    >
      <span
        className={`hd-m05-status hd-m05-status--${row.status}`}
        title={row.status}
      >
        {changesStatusLetter(row.status)}
        <span className="hd-sr"> {row.status}</span>
      </span>
      <span className="hd-file__path">{row.path}</span>
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
    return scope.reason === 'git_dir_unverified' ? GIT_DIR_NOTE : null
  }
  if (scope.rowCount === 0 && scope.unmergedUnknown) return CLEAN_BILL_NOTE
  if (scope.rowCount === 0 && scope.state === 'available') return ZERO_SCOPE_NOTE
  if (scopeId !== 'working_tree') return null
  return workingTreeCaption(repo.baselineDirty)
}
