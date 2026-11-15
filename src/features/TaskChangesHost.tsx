import { TaskChangesPane } from '../components'
import type { TaskChangesEntryRef, TaskId } from '../model'
import type { TaskPaneTab, TaskScreenState } from '../presentation'

type Props = {
  readonly state: TaskScreenState
  readonly onSelectEntry: (entry: TaskChangesEntryRef) => void
  readonly onSelectTab: (tab: TaskPaneTab) => void
  readonly onSelectTurn: (taskId: TaskId) => void
  readonly onToggleRepo: (root: string, expanded: boolean) => void
  readonly onClosePane: () => void
  readonly onUnavailable: (label: string) => void
}

/** Bind task screen state to the Changes pane. Ready observation required. */
export function TaskChangesHost({
  state,
  onSelectEntry,
  onSelectTab,
  onSelectTurn,
  onToggleRepo,
  onClosePane,
  onUnavailable,
}: Props) {
  if (state.load.kind !== 'ready') return null
  return (
    <TaskChangesPane
      load={state.changesLoad}
      list={state.changesList}
      taskObservation={state.load.observation}
      selectedEntry={state.selectedChangeEntry}
      expandedRepos={state.expandedRepos}
      onSelectEntry={onSelectEntry}
      onSelectTab={onSelectTab}
      onSelectTurn={onSelectTurn}
      onToggleRepo={onToggleRepo}
      onClosePane={onClosePane}
      onUnavailable={onUnavailable}
    />
  )
}
