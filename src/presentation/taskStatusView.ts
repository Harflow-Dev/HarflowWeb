import type { MessagingCapabilityLoad, TaskObservation } from '../model'
import { taskEngineStatus } from './taskObservation'
import { badgeForStatus } from './taskStatusBadgeMap'
import { bannerFor } from './taskStatusBannerMap'
import { composerFor } from './taskStatusComposerMap'
import {
  TASK_PENDING_BODY,
  TASK_RESOURCE_HELD,
  TASK_RESOURCE_WAIT,
} from './taskStatusCopy'
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
  if (isPending(observation) && observation.launchWait === 'resources') {
    return { ...TASK_RESOURCE_WAIT }
  }
  const resources = observation.resources
  if (resources?.state !== 'held' || resources.names.length === 0) {
    return null
  }
  const name = resources.names[0]!
  return {
    title: `Holding ${name}`,
    detail: TASK_RESOURCE_HELD.detail,
    note: heldSinceNote(resources.grantedAt, observation.observedAt),
    linkLabel: TASK_RESOURCE_HELD.linkLabel,
  }
}

/**
 * Design held card: “Since 4m ago”, the grant time against the time the
 * status was read. No line when either time is unknown or unreadable.
 */
function heldSinceNote(
  grantedAt: string | undefined,
  observedAt: string | undefined,
): string | null {
  if (grantedAt === undefined || observedAt === undefined) return null
  const elapsed = Date.parse(observedAt) - Date.parse(grantedAt)
  if (!Number.isFinite(elapsed) || elapsed < 0) return null
  return `Since ${Math.max(1, Math.floor(elapsed / 60000))}m ago`
}

/** Design `topbar()`: no meta while pending; turns follow the harness line. */
function metaFor(observation: TaskObservation): string | null {
  if (isPending(observation)) return null
  const turns = observation.turnCount
  return turns !== undefined && turns > 1
    ? `${observation.headerMeta} · ${turns} turns`
    : observation.headerMeta
}

/** Capability not observed (yet): no lock, no Send now. */
export const UNOBSERVED_MESSAGING: MessagingCapabilityLoad = { kind: 'loading' }

/** Map domain observation and session chrome to approved M05 task status UI. */
export function taskStatusView(
  observation: TaskObservation,
  commandChrome: TaskCommandChrome = null,
  messaging: MessagingCapabilityLoad = UNOBSERVED_MESSAGING,
): TaskStatusView {
  return {
    badge: badgeForStatus(observation, commandChrome),
    meta: metaFor(observation),
    body: bodyFor(observation),
    resourceCard: resourceCardFor(observation),
    notice: noticeFor(observation, commandChrome),
    banner: bannerFor(observation, commandChrome),
    composer: composerFor(observation, commandChrome, messaging),
  }
}
