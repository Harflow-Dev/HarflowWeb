/** Approved M05 overflow / dialog strings — HarflowDesign 6e31cd7. */

export const TASK_OVERFLOW_COPY = {
  moreActions: 'More actions',
  stopTask: 'Stop task…',
  takeover: 'Take over in terminal…',
  openTerminal: 'Open in terminal…',
  openParent: 'Open parent task',
  startedBy: (title: string) => `Started by ${title}`,
  copyResume: 'Copy resume command',
  copyTaskId: 'Copy task ID',
  openFinder: 'Open in Finder',
  copyPath: 'Copy path',
  stopDialogTitle: 'Stop this task?',
  stopDialogLead:
    'Harflow asks this run and the tasks it started through Harflow to stop. This is best effort.',
  stopDialogFileStay: 'Files already written stay in place.',
  stopDialogBackground:
    "Builds and other background processes the run started can keep running. Harflow can't list them.",
  keepRunning: 'Keep running',
  stopConfirm: 'Stop task',
  wontBeStoppedHeading: "Won't be stopped by this",
  wontBeStoppedLead:
    'Started in earlier turns and running when the task list was last read:',
  wontBeStoppedCaption:
    "From the task list, not from the engine's cancel result. May be out of date.",
  takeoverDialogTitle: 'Take over this task?',
  takeoverDialogBody: (accessLabel: string) =>
    `The headless run is stopped first (with any sub-tasks), then the same conversation opens in Terminal.app. It runs under your own default permissions, not this task's access level (${accessLabel}). While the terminal is open, harflow refuses resumes of this session from anywhere else.`,
  takeoverCancel: 'Cancel',
  takeoverConfirm: 'Take over in terminal',
  accessLabels: {
    read_only: 'Read-only',
    edit_repo: 'Can edit this repo',
    publish: 'Can publish',
    full: 'Full access',
  },
  provenanceLine: 'Sub-task started by another agent',
  copiedTaskId: 'Copied task ID.',
  copiedPath: 'Copied path.',
} as const

export const TASK_COPY_RESUME_UNAVAILABLE_ID = 'task-copy-resume-unavailable'
export const TASK_COPY_RESUME_UNAVAILABLE_EXPLANATION =
  'Unavailable. Copy resume command does not copy in this mock.'

export const TASK_OPEN_TERMINAL_UNAVAILABLE_ID = 'task-open-terminal-unavailable'
export const TASK_OPEN_TERMINAL_UNAVAILABLE_EXPLANATION =
  'Unavailable. Open in terminal does not launch a terminal in this mock.'

export const TASK_OPEN_FINDER_UNAVAILABLE_ID = 'task-open-finder-unavailable'
export const TASK_OPEN_FINDER_UNAVAILABLE_EXPLANATION =
  'Unavailable. Open in Finder does not open a folder in this mock.'

export const TASK_STOP_CONFIRM_UNAVAILABLE_ID = 'task-stop-confirm-unavailable'
export const TASK_STOP_CONFIRM_UNAVAILABLE_EXPLANATION =
  'Unavailable. Stop does not cancel the task in this mock.'

export const TASK_TAKEOVER_CONFIRM_UNAVAILABLE_ID =
  'task-takeover-confirm-unavailable'
export const TASK_TAKEOVER_CONFIRM_UNAVAILABLE_EXPLANATION =
  'Unavailable. Take over in terminal does not take over in this mock.'
