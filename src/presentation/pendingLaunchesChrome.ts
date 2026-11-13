import { pendingLaunchDetailView } from './pendingLaunchViews'
import type { PendingLaunchesScreenState } from './pendingLaunchesState'

/** Stop sheet covers the app only for a ready detail that shows Stop. */
export function pendingStopDialogOpen(
  state: PendingLaunchesScreenState,
): boolean {
  if (!state.stopConfirm || state.selectedLaunchId === null) return false
  if (state.status.kind !== 'ready') return false
  if (state.stopOutcome !== null) return false
  return pendingLaunchDetailView(state.status.status).showStop
}

/** Capability gate for the Pending launches nav item. */
export function pendingLaunchesNavVisible(
  state: PendingLaunchesScreenState,
): boolean {
  return state.capability.kind === 'ready' && state.capability.supported
}
