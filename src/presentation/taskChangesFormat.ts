import type { TaskChangesEntryRef, TaskChangesScopeId } from '../model'

export function changesEntriesEqual(
  a: TaskChangesEntryRef | null,
  b: TaskChangesEntryRef | null,
): boolean {
  if (a === null || b === null) return a === b
  return (
    a.repositoryRoot === b.repositoryRoot &&
    a.scope === b.scope &&
    a.path === b.path
  )
}

export function scopeTitle(scope: TaskChangesScopeId): string {
  return scope === 'working_tree' ? 'Working tree' : 'Committed'
}

export function formatStoredKiB(bytes: number): string {
  return `${Math.round(bytes / 1024)} KiB`
}

export function dirtyLabel(
  dirty: boolean | 'unknown',
): 'Yes' | 'No' | 'Unknown' {
  if (dirty === true) return 'Yes'
  if (dirty === 'unknown') return 'Unknown'
  return 'No'
}
