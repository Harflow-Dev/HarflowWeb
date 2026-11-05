import { asTaskId, type SidebarData, type SidebarEntry } from '../../model'
import {
  EVENTS_READER_FAILED_TASK_ID,
  PRELOAD_TASK_ID,
  RETRY_BUDGET_DONE_TASK_ID,
  SLOT_RELEASE_TASK_ID,
} from './taskFixtures'

export const POPULATED_RUNNING: readonly SidebarEntry[] = [
  {
    id: 'run-1',
    title: 'Review preload bridge',
    meta: '1/3',
    glyph: 'parallel',
    mappedTaskId: PRELOAD_TASK_ID,
  },
  {
    id: 'run-2',
    title: 'Fix flaky slot release test',
    meta: '04:12',
    glyph: 'running',
    mappedTaskId: SLOT_RELEASE_TASK_ID,
  },
  {
    id: 'run-3',
    title: 'Nightly dependency audit',
    meta: '2/4',
    glyph: 'attention',
    mappedTaskId: null,
  },
]

export const POPULATED_RECENT: readonly SidebarEntry[] = [
  {
    id: 'rec-1',
    title: 'Add retry budget to delivery queue',
    meta: '12m',
    glyph: 'done',
    mappedTaskId: RETRY_BUDGET_DONE_TASK_ID,
  },
  {
    id: 'rec-2',
    title: 'Migrate events.jsonl reader',
    meta: '1h',
    glyph: 'failed',
    mappedTaskId: EVENTS_READER_FAILED_TASK_ID,
  },
  {
    id: 'rec-3',
    title: 'Review: Electron preload bridge',
    meta: '2h',
    glyph: 'done',
    mappedTaskId: null,
  },
  {
    id: 'rec-4',
    title: 'Release checklist v0.4.2',
    meta: '3h',
    glyph: 'workflow',
    mappedTaskId: null,
  },
  {
    id: 'rec-5',
    title: 'Rename legacy env variables',
    meta: '5h',
    glyph: 'done',
    mappedTaskId: null,
  },
  {
    id: 'rec-6',
    title: 'Profile sidebar re-renders',
    meta: '1d',
    glyph: 'cancelled',
    mappedTaskId: null,
  },
  {
    id: 'rec-7',
    title: 'Write contract fixtures for v1 tasks',
    meta: '1d',
    glyph: 'done',
    mappedTaskId: null,
  },
  {
    id: 'rec-8',
    title: 'Weekly backlog triage',
    meta: '2d',
    glyph: 'workflow',
    mappedTaskId: null,
  },
  {
    id: 'rec-9',
    title: 'Tidy CHANGELOG for 0.4.1',
    meta: '3d',
    glyph: 'done',
    mappedTaskId: null,
  },
]

/** Synthetic launch ids stay unmapped unless an explicit fixture exists. */
export const UNMAPPED_LAUNCH_TASK_ID = asTaskId('task-mock-accepted')

export function populatedSidebarData(): SidebarData {
  return {
    needsYouCount: 2,
    coverageIncomplete: false,
    coverageNote: null,
    running: POPULATED_RUNNING,
    recent: POPULATED_RECENT,
  }
}
