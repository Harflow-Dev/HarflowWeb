import type { TaskChangesScopeId } from '../model'

export { taskChangesEntriesEqual as changesEntriesEqual } from '../model'

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

/** Display name of a repository: the last segment of its root path. */
export function repositoryDisplayName(repositoryRoot: string): string {
  const segments = repositoryRoot.split('/').filter((part) => part !== '')
  return segments[segments.length - 1] ?? repositoryRoot
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

/**
 * Observed-at instant as "Today 10:42" or "Nov 14 10:42" in local time.
 * `now` is a parameter so the result is deterministic under test.
 */
export function formatObservedAt(
  observedAt: string,
  now: Date = new Date(),
): string {
  const at = new Date(observedAt)
  if (Number.isNaN(at.getTime())) return observedAt
  const hh = String(at.getHours()).padStart(2, '0')
  const mm = String(at.getMinutes()).padStart(2, '0')
  const sameDay =
    at.getFullYear() === now.getFullYear() &&
    at.getMonth() === now.getMonth() &&
    at.getDate() === now.getDate()
  const day = sameDay ? 'Today' : `${MONTHS[at.getMonth()]} ${at.getDate()}`
  return `${day} ${hh}:${mm}`
}
