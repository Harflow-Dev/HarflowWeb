import type { TaskChangesEntryRef, TaskChangesRepository } from '../model'
import {
  CHANGES_ATTRIBUTION,
  CONFLICTS_MAY_EXIST_NOTE,
} from '../presentation/taskChangesCopy'
import { formatRepositoryCount } from '../presentation/taskChangesCounts'
import { repositoryTag } from '../presentation/taskChangesTags'
import { Icon } from './Icon'
import { dirtyLabel } from '../presentation/taskChangesFormat'
import { ChangesPaneNote, ChangesTagView } from './TaskChangesChrome'
import { TaskChangesScope } from './TaskChangesScope'

const ALTERNATES_NOTE =
  'This repository uses alternates, which capture never accepts. Nothing about it was read.'

type Props = {
  readonly repo: TaskChangesRepository
  readonly expanded: boolean
  readonly selectedEntry: TaskChangesEntryRef | null
  readonly paneAttribution: boolean
  readonly onToggleRepo: (repositoryRoot: string, expanded: boolean) => void
  readonly onSelectEntry: (entry: TaskChangesEntryRef) => void
  readonly onUnavailable: (label: string) => void
}

export function TaskChangesRepoBlock({
  repo,
  expanded,
  selectedEntry,
  paneAttribution,
  onToggleRepo,
  onSelectEntry,
  onUnavailable,
}: Props) {
  const tag = repositoryTag(repo)
  const count = formatRepositoryCount(repo)
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
        <span className="hd-m05-repo__name">{repo.name}</span>
        {tag ? <ChangesTagView tag={tag} /> : null}
        {count !== null ? <span className="hd-tab__count">{count}</span> : null}
      </summary>
      <RepoBody
        repo={repo}
        selectedEntry={selectedEntry}
        paneAttribution={paneAttribution}
        onSelectEntry={onSelectEntry}
        onUnavailable={onUnavailable}
      />
    </details>
  )
}

function RepoBody({
  repo,
  selectedEntry,
  paneAttribution,
  onSelectEntry,
  onUnavailable,
}: Omit<Props, 'expanded' | 'onToggleRepo'>) {
  const committed = repo.scopes.committed_range
  const working = repo.scopes.working_tree
  if (committed === null && working === null) {
    return repo.reason === 'alternates_present' ? (
      <p className="hd-m05-caption">{ALTERNATES_NOTE}</p>
    ) : null
  }
  return (
    <>
      {paneAttribution ? null : (
        <p className="hd-m05-attribution">{CHANGES_ATTRIBUTION}</p>
      )}
      <Provenance repo={repo} />
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
        {repo.observedAtLabel ? (
          <>
            <dt>Observed</dt>
            <dd>{repo.observedAtLabel}</dd>
          </>
        ) : null}
        <dt>Started dirty</dt>
        <dd>{dirtyLabel(repo.baselineDirty)}</dd>
      </dl>
    </details>
  )
}

function showConflictsNote(repo: TaskChangesRepository): boolean {
  const scopes = [repo.scopes.committed_range, repo.scopes.working_tree]
  return scopes.some(
    (scope) =>
      scope !== null &&
      scope.unmergedUnknown &&
      scope.state === 'available' &&
      scope.rowCount > 0,
  )
}
