import type { SidebarData } from '../model'
import type { TaskScreenState } from './taskState'

/**
 * The open running task's attention glyph follows the observed
 * `awaitingDecisionCount`, the same fact as its top-bar badge, so both clear
 * together. Rows without an approval observation are left as listed.
 */
export function sidebarWithApprovalGlyph(
  sidebar: SidebarData,
  task: TaskScreenState,
): SidebarData {
  if (task.selectedTaskId === null || task.load.kind !== 'ready') return sidebar
  const summary = task.load.observation.approvalSummary
  if (summary === undefined) return sidebar
  const awaiting = summary.awaitingDecisionCount > 0
  let changed = false
  const running = sidebar.running.map((row) => {
    if (row.mappedTaskId !== task.selectedTaskId) return row
    const glyph = awaiting
      ? ('attention' as const)
      : row.glyph === 'attention'
        ? ('running' as const)
        : row.glyph
    if (glyph === row.glyph) return row
    changed = true
    return { ...row, glyph }
  })
  return changed ? { ...sidebar, running } : sidebar
}
