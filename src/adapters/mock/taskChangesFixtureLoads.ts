import type { TaskChangesLoad, TaskId } from '../../model'
import {
  contentAvailable,
  QUEUE_ENTRY,
} from './taskChangesFixtureBuilders'
import {
  textObservation,
} from './taskChangesFixtureSamples'
import { singleDoc } from './taskChangesFixtureDocs'

/** Text helper: ready observation with an empty recorded diff body. */
export function emptyDiffChangesLoad(taskId: TaskId): TaskChangesLoad {
  return {
    kind: 'ready',
    observation: {
      ...singleDoc(taskId),
      text: textObservation({
        entry: QUEUE_ENTRY,
        status: 'modified',
        additions: 0,
        deletions: 0,
        content: contentAvailable(0),
        returnedBytes: 0,
        lines: [],
      }),
    },
  }
}

/** Test helper: ready observation whose selected diff is unavailable. */
export function unavailableDiffChangesLoad(taskId: TaskId): TaskChangesLoad {
  return {
    kind: 'ready',
    observation: {
      ...singleDoc(taskId),
      text: textObservation({
        entry: QUEUE_ENTRY,
        status: 'modified',
        additions: 24,
        deletions: 3,
        content: contentAvailable(0),
        returnedBytes: 0,
        lines: [],
        refusal: {
          code: 'changes_entry_not_found',
          message: 'No recorded diff is mapped for this path.',
          reload: null,
        },
      }),
    },
  }
}
