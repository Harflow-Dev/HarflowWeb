import type { TaskObservation } from '../model'
import { badgeForStatus } from './taskStatusBadgeMap'
import { bannerFor } from './taskStatusBannerMap'
import { composerFor } from './taskStatusComposerMap'
import { noticeFor } from './taskStatusNoticeMap'

export type {
  TaskCommandChrome,
  TaskComposerStopMode,
  TaskStatusBadge,
  TaskStatusBadgeGlyph,
  TaskStatusBadgeTone,
  TaskStatusBanner,
  TaskStatusBannerAction,
  TaskStatusBannerActionKind,
  TaskStatusBannerBody,
  TaskStatusComposer,
  TaskStatusNotice,
  TaskStatusView,
} from './taskStatusTypes'

/** Map domain observation and session chrome to approved M05 task status UI. */
import type { TaskCommandChrome, TaskStatusView } from './taskStatusTypes'

export function taskStatusView(
  observation: TaskObservation,
  commandChrome: TaskCommandChrome = null,
): TaskStatusView {
  return {
    badge: badgeForStatus(observation, commandChrome),
    notice: noticeFor(observation, commandChrome),
    banner: bannerFor(observation, commandChrome),
    composer: composerFor(observation, commandChrome),
  }
}