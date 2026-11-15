import type {
  TaskChangesCapture as CaptureDoc,
  TaskChangesEntryRef,
  TaskChangesLoad,
  TaskChangesObservation,
  TaskId,
  TaskObservation,
} from '../model'
import { changesLifecycleFor } from '../presentation/taskChangesLifecycle'
import { TaskChangesCapture } from './TaskChangesCapture'
import {
  ChangesDocumentUnavailableBody,
  ChangesEngineUnavailableBody,
  ChangesLoadingBody,
  ChangesNoRepositoryBody,
  ChangesNotObservedBody,
  ChangesNotStartedBody,
  ChangesRunningBody,
  ChangesSettlingBody,
} from './TaskChangesNotes'

export type TaskChangesBodyProps = {
  readonly load: TaskChangesLoad
  readonly list: TaskChangesObservation | null
  readonly taskObservation: TaskObservation
  readonly selectedEntry: TaskChangesEntryRef | null
  readonly expandedRepos: readonly string[]
  readonly onSelectEntry: (entry: TaskChangesEntryRef) => void
  readonly onSelectTurn: (taskId: TaskId) => void
  readonly onToggleRepo: (repositoryRoot: string, expanded: boolean) => void
  readonly onUnavailable: (label: string) => void
}

export function TaskChangesBody(props: TaskChangesBodyProps) {
  const capture = captureOf(props.load, props.list)
  const life = changesLifecycleFor(props.taskObservation, capture)
  if (life === 'notStarted') return <ChangesNotStartedBody />
  if (life === 'unavailable') {
    return <ChangesEngineUnavailableBody onUnavailable={props.onUnavailable} />
  }
  if (life === 'running') return <ChangesRunningBody />
  if (life === 'notObserved') return <ChangesNotObservedBody />
  if (life === 'settling') return <ChangesSettlingBody />
  return <CaptureBody {...props} />
}

function CaptureBody(props: TaskChangesBodyProps) {
  const observation =
    props.load.kind === 'ready' ? props.load.observation : props.list
  if (observation === null) {
    if (props.load.kind === 'unavailable') {
      return (
        <ChangesEngineUnavailableBody onUnavailable={props.onUnavailable} />
      )
    }
    return <ChangesLoadingBody />
  }
  if (observation.capture.state === 'unavailable') {
    return (
      <ChangesDocumentUnavailableBody onUnavailable={props.onUnavailable} />
    )
  }
  if (
    observation.repositories.length === 0 &&
    observation.capture.reason === 'no_repository'
  ) {
    return <ChangesNoRepositoryBody />
  }
  return (
    <TaskChangesCapture
      observation={observation}
      loadingText={props.load.kind === 'loading'}
      selectedEntry={props.selectedEntry}
      expandedRepos={props.expandedRepos}
      onSelectEntry={props.onSelectEntry}
      onSelectTurn={props.onSelectTurn}
      onToggleRepo={props.onToggleRepo}
      onUnavailable={props.onUnavailable}
    />
  )
}

function captureOf(
  load: TaskChangesLoad,
  list: TaskChangesObservation | null,
): CaptureDoc | null {
  if (load.kind === 'ready') return load.observation.capture
  return list?.capture ?? null
}
