import type { AppScreenState } from '../presentation'

/**
 * Label for the main screen while it is in its first load, else null.
 * Announced by the app-level `StatusRegion`, the single polite live region.
 */
export function mainLoadingLabel(state: AppScreenState): string | null {
  switch (state.route) {
    case 'parallel-group':
      return state.parallelGroup.load.kind === 'loading'
        ? 'Loading parallel group'
        : null
    case 'workflows':
      return workflowsLabel(state)
    case 'new-task':
      return state.newTask.context.kind === 'loading' ? 'Loading new task' : null
    case 'resources':
      return state.resources.load.kind === 'loading' ? 'Loading resources' : null
    case 'statistics':
      return state.statistics.load.kind === 'loading'
        ? 'Loading statistics'
        : null
    case 'settings':
      return settingsLabel(state)
    case 'needs-you':
      return state.needsYou.load.kind === 'loading' ? 'Loading Needs you' : null
    case 'task':
      return state.task.load.kind === 'loading' ? 'Loading task' : null
  }
}

function workflowsLabel(state: AppScreenState): string | null {
  if (state.workflowExecution.runId !== null) {
    return state.workflowExecution.load.kind === 'loading'
      ? 'Loading workflow run'
      : null
  }
  if (state.workflowEditor.workflowId !== null) {
    return state.workflowEditor.load.kind === 'loading'
      ? 'Loading workflow editor'
      : null
  }
  if (state.workflows.runWorkflowId !== null) return null
  return state.workflows.load.kind === 'loading' ? 'Loading workflows' : null
}

function settingsLabel(state: AppScreenState): string | null {
  if (state.settingsSection === 'general') {
    return state.settingsGeneral.load.kind === 'loading'
      ? 'Loading settings'
      : null
  }
  if (state.harnesses.load.kind !== 'loading') return null
  return state.harnesses.expandedId !== null
    ? 'Loading MCP approvals'
    : 'Loading harness registration'
}
