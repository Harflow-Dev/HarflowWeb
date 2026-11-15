import type { TaskChangesEntryRef, TaskChangesRepository } from '../model'
import {
  CHANGES_ATTRIBUTION,
  CONFLICTS_MAY_EXIST_NOTE,
  repositoryReasonNote,
} from '../presentation/taskChangesCopy'
import {
  dirtyLabel,
  formatObservedAt,
  repositoryDisplayName,
} from '../presentation/taskChangesFormat'
import { scopeUnmergedUnknown } from '../presentation/taskChangesScopes'
import { repositoryTag } from '../presentation/taskChangesTags'
import { Icon } from './Icon'
import { ChangesPaneNote, ChangesTagView } from './TaskChangesChrome'
import { TaskChangesScope } from './TaskChangesScope'

type Props = {
  readonly repo: TaskChangesRepository
  readonly expanded: boolean
  /** Summary count drawn on the repository row; null draws none. */
  readonly count: string | null
  readonly selectedEntry: TaskChangesEntryRef | null
  /** Summary layout: attribution lives at pane level, no per-repository Provenance. */
  readonly summaryLayout: boolean
  readonly onToggleRepo: (repositoryRoot: string, expanded: boolean) => void
  readonly onSelectEntry: (entry: TaskChangesEntryRef) => void
  readonly onUnavailable: (label: string) => void
}

export function TaskChangesRepoBlock({
  repo,
  expanded,
  count,
  selectedEntry,
  summaryLayout,
  onToggleRepo,
  onSelectEntry,
  onUnavailable,
}: Props) {
  const tag = repositoryTag(repo)
  return (
    <details
      className="hd-m05-repo"
      open={expanded}
      onToggle={(event) => {
        onToggleRepo(repo.repositoryRoot, event.currentTarget.open)
      }}
    >
      <summary>
        <Icon name="chevron-right" size="sm" />
        <Icon name="folder" size="sm" />
        <span className="hd-m05-repo__name">{repositoryDisplayName(repo.repositoryRoot)}</span>
        {tag ? <ChangesTagView tag={tag} /> : null}
        {count !== null ? <span className="hd-tab__count">{count}</span> : null}
      </summary>
      <RepoBody
        repo={repo}
        selectedEntry={selectedEntry}
        summaryLayout={summaryLayout}
        onSelectEntry={onSelectEntry}
        onUnavailable={onUnavailable}
      />
    </details>
  )
}

function RepoBody({
  repo,
  selectedEntry,
  summaryLayout,
  onSelectEntry,
  onUnavailable,
}: Omit<Props, 'expanded' | 'count' | 'onToggleRepo'>) {
  const committed = repo.scopes.committed_range
  const working = repo.scopes.working_tree
  if (committed === null && working === null) {
    const note = repositoryReasonNote(repo.reason)
    return note ? <p className="hd-m05-caption">{note}</p> : null
  }
  return (
    <>
      {summaryLayout ? null : (
        <>
          <p className="hd-m05-attribution">{CHANGES_ATTRIBUTION}</p>
          <Provenance repo={repo} />
        </>
      )}
      {committed ? (
        <TaskChangesScope
          repo={repo}
          scopeId="committed_range"
          scope={committed}
          selectedEntry={selectedEntry}
          onSelectEntry={onSelectEntry}
          onUnavailable={onUnavailable}
        />
      ) : null}
      {working ? (
        <TaskChangesScope
          repo={repo}
          scopeId="working_tree"
          scope={working}
          selectedEntry={selectedEntry}
          onSelectEntry={onSelectEntry}
          onUnavailable={onUnavailable}
        />
      ) : null}
      {showConflictsNote(repo) ? (
        <ChangesPaneNote
          tone="warn"
          title={CONFLICTS_MAY_EXIST_NOTE.title}
          body={CONFLICTS_MAY_EXIST_NOTE.body}
        />
      ) : null}
    </>
  )
}

function Provenance({ repo }: { readonly repo: TaskChangesRepository }) {
  const base =
    repo.baseCommit === null
      ? null
      : repo.baseProvenance
        ? `${repo.baseCommit} · ${repo.baseProvenance}`
        : repo.baseCommit
  return (
    <details className="hd-m05-prov">
      <summary>Provenance</summary>
      <dl>
        {base ? (
          <>
            <dt>Base</dt>
            <dd className="hd-mono">{base}</dd>
          </>
        ) : null}
        {repo.headCommit ? (
          <>
            <dt>Head</dt>
            <dd className="hd-mono">{repo.headCommit}</dd>
          </>
        ) : null}
        {repo.worktree ? (
          <>
            <dt>Working tree</dt>
            <dd className="hd-mono">{repo.worktree}</dd>
          </>
        ) : null}
        {repo.observedAt ? (
          <>
            <dt>Observed</dt>
            <dd>{formatObservedAt(repo.observedAt)}</dd>
          </>
        ) : null}
        <dt>Started dirty</dt>
        <dd>{dirtyLabel(repo.baselineDirty)}</dd>
      </dl>
    </details>
  )
}

function showConflictsNote(repo: TaskChangesRepository): boolean {
  const working = repo.scopes.working_tree
  return (
    working !== null &&
    scopeUnmergedUnknown(working) &&
    working.state === 'available' &&
    working.rowCount > 0
  )
}
