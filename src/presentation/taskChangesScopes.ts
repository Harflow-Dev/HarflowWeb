import type {
  TaskChangesObservation,
  TaskChangesRepository,
  TaskChangesScope,
  TaskChangesWorkingTreeScope,
} from '../model'

/** Populated scopes of one repository, committed range first. */
export function scopesOf(
  repo: TaskChangesRepository,
): readonly TaskChangesScope[] {
  const out: TaskChangesScope[] = []
  if (repo.scopes.committed_range) out.push(repo.scopes.committed_range)
  if (repo.scopes.working_tree) out.push(repo.scopes.working_tree)
  return out
}

/** Only the working-tree scope examines the agent's index for conflicts. */
export function scopeUnmergedUnknown(scope: TaskChangesScope): boolean {
  return 'unmergedUnknown' in scope && scope.unmergedUnknown
}

export function scopeCountsAndPatchSeparate(scope: TaskChangesScope): boolean {
  return 'countsAndPatchSeparate' in scope && scope.countsAndPatchSeparate
}

function workingTreeOf(
  repo: TaskChangesRepository,
): TaskChangesWorkingTreeScope | null {
  return repo.scopes.working_tree
}

/** Advisory conflict names the engine reported for this repository. */
export function repositoryHasReportedConflict(
  repo: TaskChangesRepository,
): boolean {
  const names = workingTreeOf(repo)?.reportedConflicts.names
  return names !== undefined && names.length > 0
}

export function observationHasReportedConflict(
  observation: TaskChangesObservation,
): boolean {
  return observation.repositories.some(repositoryHasReportedConflict)
}
