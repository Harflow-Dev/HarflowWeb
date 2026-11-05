import type { SidebarData, SidebarEntry } from '../../model'

const unavailable = false as const

export const POPULATED_RUNNING: readonly SidebarEntry[] = [
  {
    id: 'run-1',
    title: 'Review preload bridge',
    meta: '1/3',
    glyph: 'parallel',
    availableInSlice: unavailable,
  },
  {
    id: 'run-2',
    title: 'Fix flaky slot release test',
    meta: '04:12',
    glyph: 'running',
    availableInSlice: unavailable,
  },
  {
    id: 'run-3',
    title: 'Nightly dependency audit',
    meta: '2/4',
    glyph: 'attention',
    availableInSlice: unavailable,
  },
]

export const POPULATED_RECENT: readonly SidebarEntry[] = [
  {
    id: 'rec-1',
    title: 'Add retry budget to delivery queue',
    meta: '12m',
    glyph: 'done',
    availableInSlice: unavailable,
  },
  {
    id: 'rec-2',
    title: 'Migrate events.jsonl reader',
    meta: '1h',
    glyph: 'failed',
    availableInSlice: unavailable,
  },
  {
    id: 'rec-3',
    title: 'Review: Electron preload bridge',
    meta: '2h',
    glyph: 'done',
    availableInSlice: unavailable,
  },
  {
    id: 'rec-4',
    title: 'Release checklist v0.4.2',
    meta: '3h',
    glyph: 'workflow',
    availableInSlice: unavailable,
  },
  {
    id: 'rec-5',
    title: 'Rename legacy env variables',
    meta: '5h',
    glyph: 'done',
    availableInSlice: unavailable,
  },
  {
    id: 'rec-6',
    title: 'Profile sidebar re-renders',
    meta: '1d',
    glyph: 'cancelled',
    availableInSlice: unavailable,
  },
  {
    id: 'rec-7',
    title: 'Write contract fixtures for v1 tasks',
    meta: '1d',
    glyph: 'done',
    availableInSlice: unavailable,
  },
  {
    id: 'rec-8',
    title: 'Weekly backlog triage',
    meta: '2d',
    glyph: 'workflow',
    availableInSlice: unavailable,
  },
  {
    id: 'rec-9',
    title: 'Tidy CHANGELOG for 0.4.1',
    meta: '3d',
    glyph: 'done',
    availableInSlice: unavailable,
  },
]

export function populatedSidebarData(): SidebarData {
  return {
    needsYouCount: 2,
    coverageIncomplete: false,
    coverageNote: null,
    running: POPULATED_RUNNING,
    recent: POPULATED_RECENT,
  }
}
