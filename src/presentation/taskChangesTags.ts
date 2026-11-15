import type { TaskChangesRepository, TaskChangesScope } from '../model'

export type ChangesTagTone = 'warn' | 'ok' | 'info' | 'neutral'

export type ChangesTag = {
  readonly label: string
  readonly tone: ChangesTagTone
}

export function repositoryTag(
  repo: TaskChangesRepository,
): ChangesTag | null {
  if (anyScopeRowsTruncated(repo)) {
    return { label: 'Row limit', tone: 'warn' }
  }
  if (workingTreeNotCaptured(repo) && repo.state === 'available') {
    return { label: 'Working tree not captured', tone: 'warn' }
  }
  if (repo.state === 'incomplete') {
    if (repo.reason === 'budget_exhausted') {
      return { label: 'Not started · budget used', tone: 'warn' }
    }
    return { label: 'Incomplete', tone: 'warn' }
  }
  if (repo.state === 'not_captured') {
    if (repo.reason === 'alternates_present') {
      return { label: 'Not captured', tone: 'warn' }
    }
    if (repo.reason === 'repository_identity_changed') {
      return { label: 'Identity changed', tone: 'warn' }
    }
    if (repo.reason === 'working_tree_not_captured') {
      return { label: 'Working tree not captured', tone: 'warn' }
    }
    return { label: 'Not captured', tone: 'warn' }
  }
  if (repo.state === 'unavailable') {
    return { label: 'Unavailable', tone: 'warn' }
  }
  if (repo.reason === 'reported_conflict') {
    return { label: 'Reported conflict', tone: 'info' }
  }
  if (anyScopeUnmergedUnknown(repo)) {
    return { label: 'Conflicts unknown', tone: 'warn' }
  }
  return null
}

export function scopeTag(scope: TaskChangesScope): ChangesTag | null {
  if (scope.state === 'not_captured') {
    return { label: 'Not captured', tone: 'warn' }
  }
  if (scope.state === 'incomplete') {
    if (scope.reason === 'capture_timeout') {
      return { label: 'Incomplete · time limit', tone: 'warn' }
    }
    if (scope.unmergedUnknown) {
      return { label: 'Conflicts unknown', tone: 'warn' }
    }
    return { label: 'Incomplete', tone: 'warn' }
  }
  if (scope.rowsTruncated) {
    return {
      label: `Row limit · ${scope.rowCount} of more`,
      tone: 'warn',
    }
  }
  if (scope.state === 'available' && scope.unmergedUnknown && scope.rowCount === 0) {
    return { label: 'Conflicts unknown', tone: 'warn' }
  }
  return null
}

function anyScopeUnmergedUnknown(repo: TaskChangesRepository): boolean {
  const scopes = [repo.scopes.committed_range, repo.scopes.working_tree]
  return scopes.some((s) => s !== null && s.unmergedUnknown && s.state === 'available')
}

function anyScopeRowsTruncated(repo: TaskChangesRepository): boolean {
  const scopes = [repo.scopes.committed_range, repo.scopes.working_tree]
  return scopes.some((s) => s !== null && s.rowsTruncated)
}

function workingTreeNotCaptured(repo: TaskChangesRepository): boolean {
  const wt = repo.scopes.working_tree
  const cr = repo.scopes.committed_range
  return (
    wt !== null &&
    wt.state === 'not_captured' &&
    cr !== null &&
    cr.state === 'available'
  )
}
