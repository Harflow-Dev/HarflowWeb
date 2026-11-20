import type { SidebarData } from '../model'
import type { AppPresenter, TaskScreenState } from '../presentation'
import { TaskMain } from './TaskMain'
import { cancelTaskQueuedMessageAndAnnounce } from './taskQueuedCancel'

type Props = {
  readonly state: TaskScreenState
  readonly sidebar: SidebarData | null
  readonly mainElement: HTMLElement | null
  readonly presenter: AppPresenter
  readonly onUnavailable: (label: string) => void
  readonly onAnnounce: (message: string) => void
}

/** Wires TaskMain to the app presenter (keeps AppFeature under the size gate). */
export function TaskMainHost({
  state,
  sidebar,
  mainElement,
  presenter,
  onUnavailable,
  onAnnounce,
}: Props) {
  return (
    <TaskMain
      state={state}
      sidebar={sidebar}
      mainElement={mainElement}
      onUnavailable={onUnavailable}
      onAnnounce={onAnnounce}
      onToggleChangesPane={(open) => presenter.setTaskChangesPaneOpen(open)}
      onSelectChangedEntry={(entry) => presenter.selectTaskChangedEntry(entry)}
      onSelectChangesTurn={(taskId) => presenter.selectTaskChangesTurn(taskId)}
      onToggleChangesRepo={(root, expanded) =>
        presenter.setTaskRepositoryExpanded(root, expanded)
      }
      onSelectPaneTab={(tab) => presenter.setTaskPaneTab(tab)}
      onRevealEventsFacts={(group) => presenter.revealTaskEventsFacts(group)}
      onLoadEarlierEvents={() => presenter.loadTaskEarlierEvents()}
      onToggleOverflowMenu={() =>
        presenter.setTaskOverflowMenuOpen(!state.overflowMenuOpen)
      }
      onCloseOverflowMenu={() => presenter.setTaskOverflowMenuOpen(false)}
      onOpenDialog={(dialog, opener) =>
        presenter.openTaskDialog(dialog, opener)
      }
      onOpenParentTask={(taskId) => presenter.openTask(taskId)}
      onCancelQueuedMessage={(messageId) =>
        cancelTaskQueuedMessageAndAnnounce(presenter, messageId, (note) =>
          onAnnounce(note.text),
        )
      }
      onRespondApproval={(decision) => presenter.respondTaskApproval(decision)}
      onRefreshApproval={() => presenter.refreshTaskApproval()}
    />
  )
}
