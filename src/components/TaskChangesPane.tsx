import type {
  TaskChangesEntryRef,
  TaskChangesLoad,
  TaskChangesObservation,
  TaskEventsLoad,
  TaskEventsObservation,
  TaskId,
  TaskObservation,
} from '../model'
import type { TaskChangesTextPanel, TaskChangesTurnMember } from '../presentation/taskState'
import { changesTabCount } from '../presentation/taskChangesCounts'
import { changesLifecycleFor } from '../presentation/taskChangesLifecycle'
import { TaskChangesBody } from './TaskChangesBody'
import { TaskEventsM05Body } from './TaskEventsM05Body'
import {
  TASK_PANE_CHANGES_TAB_ID,
  TASK_PANE_EVENTS_TAB_ID,
  TASK_PANE_PANEL_ID,
  TaskPaneTabs,
} from './TaskPaneTabs'

export type TaskChangesPaneProps = {
  readonly load: TaskChangesLoad
  readonly list: TaskChangesObservation | null
  readonly taskObservation: TaskObservation
  readonly selectedEntry: TaskChangesEntryRef | null
  readonly expandedRepos: readonly string[]
  readonly turns: readonly TaskChangesTurnMember[] | null
  readonly textPanels: readonly TaskChangesTextPanel[] | null
  readonly onSelectEntry: (entry: TaskChangesEntryRef) => void
  readonly onSelectTurn: (taskId: TaskId) => void
  readonly onToggleRepo: (repositoryRoot: string, expanded: boolean) => void
  readonly onClosePane: () => void
  readonly onUnavailable: (label: string) => void
  readonly paneTab?: 'changes' | 'events'
  readonly eventsLoad?: TaskEventsLoad
  readonly eventsList?: TaskEventsObservation | null
  readonly eventsEarlierLoaded?: boolean
  readonly eventsEarlierError?: boolean
  readonly onSelectTab?: (tab: 'changes' | 'events') => void
  readonly onLoadEarlier?: () => void
}

/**
 * Read-only Changes side pane. Recorded repository observations only —
 * not Git, downloads, edits, or authorship proof.
 * The last `list` document stays mounted while a selected text loads.
 */
export function TaskChangesPane({
  load,
  list,
  taskObservation,
  selectedEntry,
  expandedRepos,
  turns,
  textPanels,
  onSelectEntry,
  onSelectTurn,
  onToggleRepo,
  onClosePane,
  onUnavailable,
  paneTab = 'changes',
  eventsLoad = { kind: 'loading' },
  eventsList = null,
  eventsEarlierLoaded = false,
  eventsEarlierError = false,
  onSelectTab,
  onLoadEarlier,
}: TaskChangesPaneProps) {
  const observation = load.kind === 'ready' ? load.observation : list
  const lifecycle = changesLifecycleFor(
    taskObservation,
    observation?.capture ?? null,
  )
  const count = lifecycle === 'capture' ? changesTabCount(observation) : null
  const eventsOpen = paneTab === 'events'
  return (
    <aside className="hd-pane hd-m05-pane" aria-label="Task details">
      <TaskPaneTabs
        changesCount={count}
        activeTab={paneTab}
        onClosePane={onClosePane}
        onUnavailable={onUnavailable}
        {...(onSelectTab !== undefined ? { onSelectTab } : {})}
      />
      <div
        className="hd-scroll hd-m05-panescroll"
        role="tabpanel"
        id={TASK_PANE_PANEL_ID}
        aria-labelledby={
          eventsOpen ? TASK_PANE_EVENTS_TAB_ID : TASK_PANE_CHANGES_TAB_ID
        }
      >
        {eventsOpen ? (
          <TaskEventsM05Body
            taskObservation={taskObservation}
            load={eventsLoad}
            list={eventsList}
            earlierLoaded={eventsEarlierLoaded}
            earlierError={eventsEarlierError}
            onLoadEarlier={onLoadEarlier ?? (() => undefined)}
            onUnavailable={onUnavailable}
          />
        ) : (
          <TaskChangesBody
            load={load}
            list={list}
            taskObservation={taskObservation}
            selectedEntry={selectedEntry}
            expandedRepos={expandedRepos}
            turns={turns}
            textPanels={textPanels}
            onSelectEntry={onSelectEntry}
            onSelectTurn={onSelectTurn}
            onToggleRepo={onToggleRepo}
            onUnavailable={onUnavailable}
          />
        )}
      </div>
    </aside>
  )
}
