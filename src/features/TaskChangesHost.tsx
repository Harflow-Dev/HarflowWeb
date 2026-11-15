import { TaskChangesPane } from '../components'
import type { TaskChangesEntryRef, TaskId } from '../model'
import type { TaskScreenState } from '../presentation'

type Props = {
  readonly state: TaskScreenState
  readonly onSelectEntry: (entry: TaskChangesEntryRef) => void
  readonly onSelectTurn: (taskId: TaskId) => void
  readonly onToggleRepo: (root: string, expanded: boolean) => void
  readonly onClosePane: () => void
  readonly onUnavailable: (label: string) => void
  readonly onSelectTab: (tab: 'changes' | 'events') => void
  readonly onLoadEarlier: () => void
}

/** Bind task screen state to the Changes pane. Ready observation required. */
export function TaskChangesHost({
  state,
  onSelectEntry,
  onSelectTurn,
  onToggleRepo,
  onClosePane,
  onUnavailable,
  onSelectTab,
  onLoadEarlier,
}: Props) {
  if (state.load.kind !== 'ready') return null
  return (
    <TaskChangesPane
      load={state.changesLoad}
      list={state.changesList}
      taskObservation={state.load.observation}
      selectedEntry={state.selectedChangeEntry}
      expandedRepos={state.expandedRepos}
      turns={state.changesTurns}
      textPanels={state.changesTextPanels}
      onSelectEntry={onSelectEntry}
      onSelectTurn={onSelectTurn}
      onToggleRepo={onToggleRepo}
      onClosePane={onClosePane}
      onUnavailable={onUnavailable}
      paneTab={state.paneTab}
      eventsLoad={state.eventsLoad}
      eventsList={state.eventsList}
      eventsEarlierLoaded={state.eventsEarlierLoaded}
      eventsEarlierError={state.eventsEarlierError}
      onSelectTab={onSelectTab}
      onLoadEarlier={onLoadEarlier}
    />
  )
}
