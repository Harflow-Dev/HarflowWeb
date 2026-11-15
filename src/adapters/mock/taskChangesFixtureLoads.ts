import type { TaskChangesLoad, TaskId } from '../../model'
import {
  contentAvailable,
  QUEUE_ENTRY,
} from './taskChangesFixtureBuilders'
import { singleDoc } from './taskChangesFixtureDocs'

/** Text helper: ready observation with an empty recorded diff body. */
export function emptyDiffChangesLoad(taskId: TaskId): TaskChangesLoad {
  const doc = singleDoc(taskId)
  return {
    kind: 'ready',
    observation: {
      ...doc,
      selectedEntry: QUEUE_ENTRY,
      text: {
        entry: QUEUE_ENTRY,
        status: 'modified',
        additions: 0,
        deletions: 0,
        content: contentAvailable(0),
        offset: 0,
        returnedBytes: 0,
        totalBytes: 0,
        hasMore: false,
        nextCursor: null,
        lines: [],
        refusal: null,
      },
    },
  }
}

/** Test helper: ready observation whose selected diff is unavailable. */
export function unavailableDiffChangesLoad(taskId: TaskId): TaskChangesLoad {
  const doc = singleDoc(taskId)
  return {
    kind: 'ready',
    observation: {
      ...doc,
      selectedEntry: QUEUE_ENTRY,
      text: {
        entry: QUEUE_ENTRY,
        status: 'modified',
        additions: 24,
        deletions: 3,
        content: contentAvailable(0),
        offset: 0,
        returnedBytes: 0,
        totalBytes: 0,
        hasMore: false,
        nextCursor: null,
        lines: [],
        refusal: {
          code: 'changes_entry_not_found',
          message: 'No recorded diff is mapped for this path.',
          reload: null,
        },
      },
    },
  }
}
