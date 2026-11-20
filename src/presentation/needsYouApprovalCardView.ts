/**
 * Needs you task-approval card: reuses taskApprovalCardView mode/result,
 * overlays Needs you head, src, meta, and Reject tone.
 */
import {
  needsYouContextText,
  type NeedsYouTaskApproval,
  type TaskId,
} from '../model'
import {
  approvalEntryFor,
  type TaskApprovalChrome,
  type TaskApprovalEntry,
} from './taskApprovalChrome'
import {
  taskApprovalCardView,
  type TaskApprovalCardView,
} from './taskApprovalCardView'

export type NeedsYouOpenLink =
  | { readonly kind: 'task'; readonly taskId: TaskId; readonly title: string }
  | { readonly kind: 'task_unavailable'; readonly title: string }

export type NeedsYouTaskApprovalCardView = TaskApprovalCardView & {
  readonly approveLabel: string
  readonly rejectLabel: string
  /** Needs you uses secondary Reject; the task screen uses ghost. */
  readonly rejectTone: 'secondary'
  readonly openLink: NeedsYouOpenLink
}

/**
 * Map one Needs you task approval item + chrome entry to the card view.
 */
export function needsYouTaskApprovalCardView(
  item: NeedsYouTaskApproval,
  entry: TaskApprovalEntry | null,
  submitting = false,
): NeedsYouTaskApprovalCardView {
  const base = taskApprovalCardView(item.request, entry, submitting)
  const ownAnswer = entry?.kind === 'answered'
  const taskId = item.context.taskId
  const openLink: NeedsYouOpenLink =
    taskId === null
      ? { kind: 'task_unavailable', title: item.context.title }
      : { kind: 'task', taskId, title: item.context.title }
  return {
    ...base,
    actionLabel: ownAnswer ? base.actionLabel : item.actionLabel,
    source: needsYouContextText(item.context),
    showSource: ownAnswer ? base.showSource : true,
    command: item.exactAction,
    cwdMeta: item.detail,
    reasonLine: null,
    approveLabel: item.approveLabel,
    rejectLabel: item.rejectLabel,
    rejectTone: 'secondary',
    openLink,
  }
}

export function needsYouTaskApprovalViewFor(
  item: NeedsYouTaskApproval,
  chrome: TaskApprovalChrome,
  submitting: boolean,
): NeedsYouTaskApprovalCardView {
  const taskId = item.context.taskId ?? ''
  const entry = approvalEntryFor(chrome, taskId, item.request)
  return needsYouTaskApprovalCardView(item, entry, submitting)
}
