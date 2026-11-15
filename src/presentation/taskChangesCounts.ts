import type {
  TaskChangesObservation,
  TaskChangesRepository,
  TaskChangesScope,
} from '../model'

/**
 * Tab count rule (G-DIFF): sum of stored row_count values when every repository
 * and scope is available and none hit the row limit; otherwise no number.
 * Incomplete / limited / loading / not_captured scopes remove the count.
 */
export function changesTabCount(
  observation: TaskChangesObservation | null,
): string | null {
  if (observation === null) return null
  if (observation.capture.state === 'pending') return null
  if (observation.capture.state === 'unavailable') return null
  if (observation.capture.state === 'not_captured') return null
  if (observation.capture.state === 'incomplete') return null
  if (observation.repositories.length === 0) {
    if (observation.capture.reason === 'no_repository') return null
    return '0'
  }
  let sum = 0
  for (const repo of observation.repositories) {
    if (!repositoryAllowsTabCount(repo)) return null
    for (const scope of scopesOf(repo)) {
      if (!scopeAllowsTabCount(scope)) return null
      sum += scope.rowCount
    }
  }
  return String(sum)
}

export function repositoryAllowsTabCount(repo: TaskChangesRepository): boolean {
  return repo.state === 'available'
}

export function scopeAllowsTabCount(scope: TaskChangesScope): boolean {
  return scope.state === 'available' && !scope.rowsTruncated
}

/**
 * Derived completeness: every repository available, every scope available,
 * none truncated, conflicts examined (unmergedUnknown false on every scope).
 * Only then may the pane say "No differences observed".
 */
export function changesCaptureIsComplete(
  observation: TaskChangesObservation,
): boolean {
  if (observation.capture.state !== 'available') return false
  if (observation.repositories.length === 0) return false
  for (const repo of observation.repositories) {
    if (repo.state !== 'available') return false
    for (const scope of scopesOf(repo)) {
      if (scope.state !== 'available') return false
      if (scope.rowsTruncated) return false
      if (scope.unmergedUnknown) return false
    }
  }
  return true
}

/** Pane-level "No differences observed" caption — only a complete capture. */
export function changesShowsZeroCompleteCaption(
  observation: TaskChangesObservation,
): boolean {
  if (!changesCaptureIsComplete(observation)) return false
  return observation.repositories.every((repo) =>
    [repo.scopes.committed_range, repo.scopes.working_tree].every(
      (scope) => scope === null || scope.rowCount === 0,
    ),
  )
}

/**
 * Design notCaptured specimen draws the task-level reasons list even when
 * capture.state is available because some repositories were not captured.
 */
export function showsTaskLevelNotCapturedReasons(
  observation: TaskChangesObservation,
): boolean {
  if (observation.capture.state === 'not_captured') return true
  // Design notCaptured specimen keeps capture.available while repositories
  // are not_captured. Limited/incomplete captures use per-repo tags only.
  if (observation.capture.state !== 'available') return false
  return observation.repositories.some((repo) => repo.state === 'not_captured')
}

export function repositoryStoredRowCount(repo: TaskChangesRepository): number {
  let sum = 0
  for (const scope of scopesOf(repo)) sum += scope.rowCount
  return sum
}

export function formatScopeCount(scope: TaskChangesScope): string {
  if (scope.state === 'not_captured') return '—'
  if (scope.rowsTruncated) return `${scope.rowCount}+`
  if (scope.state === 'incomplete' && scope.rowCount === 0) return '0+'
  if (scope.state === 'incomplete') return `${scope.rowCount}+`
  return String(scope.rowCount)
}

export function formatRepositoryCount(
  repo: TaskChangesRepository,
): string | null {
  if (repo.state === 'not_captured') return null
  if (repo.state === 'unavailable') return null
  const scopes = scopesOf(repo)
  if (scopes.length === 0) return null
  const truncated = scopes.find((s) => s.rowsTruncated)
  if (truncated) return `${truncated.rowCount}+`
  const incomplete = scopes.some((s) => s.state === 'incomplete')
  const sum = repositoryStoredRowCount(repo)
  if (incomplete) return `${sum}+`
  return String(sum)
}

function scopesOf(
  repo: TaskChangesRepository,
): readonly TaskChangesScope[] {
  const out: TaskChangesScope[] = []
  if (repo.scopes.committed_range) out.push(repo.scopes.committed_range)
  if (repo.scopes.working_tree) out.push(repo.scopes.working_tree)
  return out
}
