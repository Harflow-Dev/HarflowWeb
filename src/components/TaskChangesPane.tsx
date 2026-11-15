import type {
  TaskChangesEntryRef,
  TaskChangesLoad,
  TaskChangesObservation,
  TaskId,
  TaskObservation,
} from '../model'
import type { TaskChangesTextPanel, TaskChangesTurnMember } from '../presentation/taskState'
import { changesTabCount } from '../presentation/taskChangesCounts'
import { changesLifecycleFor } from '../presentation/taskChangesLifecycle'
import { TaskChangesBody } from './TaskChangesBody'
import {
  TASK_PANE_CHANGES_TAB_ID,
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
}: TaskChangesPaneProps) {
  const observation = load.kind === 'ready' ? load.observation : list
  const lifecycle = changesLifecycleFor(
    taskObservation,
    observation?.capture ?? null,
  )
  const count = lifecycle === 'capture' ? changesTabCount(observation) : null
  return (
    <aside className="hd-pane hd-m05-pane" aria-label="Task details">
      <TaskPaneTabs
        changesCount={count}
        onClosePane={onClosePane}
        onUnavailable={onUnavailable}
      />
      <div
        className="hd-scroll hd-m05-panescroll"
        role="tabpanel"
        id={TASK_PANE_PANEL_ID}
        aria-labelledby={TASK_PANE_CHANGES_TAB_ID}
      >
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
      </div>
    </aside>
  )
}
