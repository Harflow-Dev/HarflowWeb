import type { TaskObservation } from '../model'
import { taskEngineStatus } from './taskObservation'
import { badgeForStatus } from './taskStatusBadgeMap'
import { bannerFor } from './taskStatusBannerMap'
import { composerFor } from './taskStatusComposerMap'
import { TASK_PENDING_BODY, TASK_RESOURCE_WAIT } from './taskStatusCopy'
import { noticeFor } from './taskStatusNoticeMap'
import type {
  TaskCommandChrome,
  TaskStatusBody,
  TaskStatusResourceCard,
  TaskStatusView,
} from './taskStatusTypes'

export type {
  TaskCommandChrome,
  TaskComposerStopMode,
  TaskStatusBadge,
  TaskStatusBadgeGlyph,
  TaskStatusBadgeTone,
  TaskStatusBanner,
  TaskStatusActionVariant,
  TaskStatusBannerAction,
  TaskStatusBannerActionKind,
  TaskStatusBannerBody,
  TaskStatusBody,
  TaskStatusComposer,
  TaskStatusNotice,
  TaskStatusResourceCard,
  TaskStatusView,
} from './taskStatusTypes'

function isPending(observation: TaskObservation): boolean {
  return taskEngineStatus(observation) === 'pending'
}

function bodyFor(observation: TaskObservation): TaskStatusBody {
  if (isPending(observation)) {
    return {
      kind: 'notStarted',
      requestNote: TASK_PENDING_BODY.requestDeferred,
      emptyNote: TASK_PENDING_BODY.emptyActivity,
    }
  }
  return observation.conversation
    ? { kind: 'conversation' }
    : { kind: 'transcript' }
}

function resourceCardFor(
  observation: TaskObservation,
): TaskStatusResourceCard | null {
  if (!isPending(observation) || observation.launchWait !== 'resources') {
    return null
  }
  return { ...TASK_RESOURCE_WAIT }
}

/** Design `topbar()`: no meta while pending; turns follow the harness line. */
function metaFor(observation: TaskObservation): string | null {
  if (isPending(observation)) return null
  const turns = observation.turnCount
  return turns !== undefined && turns > 1
    ? `${observation.headerMeta} · ${turns} turns`
    : observation.headerMeta
}

/** Map domain observation and session chrome to approved M05 task status UI. */
export function taskStatusView(
  observation: TaskObservation,
  commandChrome: TaskCommandChrome = null,
): TaskStatusView {
  return {
    badge: badgeForStatus(observation, commandChrome),
    meta: metaFor(observation),
    body: bodyFor(observation),
    resourceCard: resourceCardFor(observation),
    notice: noticeFor(observation, commandChrome),
    banner: bannerFor(observation, commandChrome),
    composer: composerFor(observation, commandChrome),
  }
}
