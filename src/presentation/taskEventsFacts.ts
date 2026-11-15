import type { TaskEnforcement, TaskObservation } from '../model'
import { badgeForStatus } from './taskStatusBadgeMap'
import {
  EVENTS_ALLOWED,
  EVENTS_CONTINUITY_CAPTION,
  EVENTS_CONTINUITY_TEXT,
  EVENTS_DENIED,
  EVENTS_ENFORCEMENT_CAPTION,
  EVENTS_ENFORCEMENT_LABELS,
  EVENTS_EXIT_DASH,
  EVENTS_EXIT_NOT_OBSERVED,
  EVENTS_FACTS_CONTINUITY,
  EVENTS_FACTS_ENFORCEMENT,
  EVENTS_FACTS_NOTICES,
  EVENTS_FACTS_TASK,
  EVENTS_NO,
  EVENTS_NO_NOTICES,
  EVENTS_NOT_ALLOWED,
  EVENTS_NOT_ENFORCED,
  EVENTS_YES,
} from './taskEventsCopy'

export type EventsFactPair = {
  readonly term: string
  readonly value: string
}

export type EventsFactsGroupView =
  | {
      readonly id: 'task' | 'enforcement'
      readonly title: string
      readonly pairs: readonly EventsFactPair[]
      readonly caption?: string
    }
  | {
      readonly id: 'notices'
      readonly title: string
      readonly count: string | null
      readonly items: readonly string[]
      readonly emptyCaption: string | null
    }
  | {
      readonly id: 'continuity'
      readonly title: string
      readonly paragraphs: readonly string[]
      readonly caption: string
    }

/** Header meta's first two ` · ` parts (harness · model). */
export function harnessFromMeta(headerMeta: string): string {
  return headerMeta.split(' · ').slice(0, 2).join(' · ')
}

export function exitFactValue(observation: TaskObservation): string {
  return observation.exitObserved === false
    ? EVENTS_EXIT_NOT_OBSERVED
    : EVENTS_EXIT_DASH
}

export function turnsFactValue(observation: TaskObservation): string {
  return observation.turnCount !== undefined
    ? String(observation.turnCount)
    : '1'
}

function yesNo(value: boolean): string {
  return value ? EVENTS_YES : EVENTS_NO
}

function commitLabel(
  value: TaskEnforcement['directCommitCommands'],
): string {
  if (value === 'denied') return EVENTS_DENIED
  if (value === 'allowed') return EVENTS_ALLOWED
  return EVENTS_NOT_ENFORCED
}

function networkLabel(value: string): string {
  const spaced = value.replaceAll('_', ' ')
  if (spaced.length === 0) return spaced
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export function enforcementPairs(
  enforcement: TaskEnforcement,
): readonly EventsFactPair[] {
  const labels = EVENTS_ENFORCEMENT_LABELS
  return [
    { term: labels.requested, value: enforcement.requested },
    { term: labels.mechanism, value: enforcement.mechanism },
    { term: labels.osSandbox, value: yesNo(enforcement.osSandbox) },
    { term: labels.writesConfined, value: yesNo(enforcement.writesConfined) },
    {
      term: labels.directCommitCommands,
      value: commitLabel(enforcement.directCommitCommands),
    },
    {
      term: labels.publishAttempts,
      value: enforcement.publishAttempts ? EVENTS_ALLOWED : EVENTS_NOT_ALLOWED,
    },
    { term: labels.network, value: networkLabel(enforcement.network) },
  ]
}

export function taskFactPairs(
  observation: TaskObservation,
): readonly EventsFactPair[] {
  return [
    { term: 'Status', value: badgeForStatus(observation, null).label },
    { term: 'Exit', value: exitFactValue(observation) },
    { term: 'Harness', value: harnessFromMeta(observation.headerMeta) },
    { term: 'Repository', value: observation.repository?.name ?? EVENTS_EXIT_DASH },
    { term: 'Turns', value: turnsFactValue(observation) },
    {
      term: 'Task ID',
      value: observation.publicTaskId ?? observation.taskId,
    },
  ]
}

/** Collapsed facts groups at the top of the Events tab (design factsGroups). */
export function eventsFactsGroups(
  observation: TaskObservation,
): readonly EventsFactsGroupView[] {
  const notices = observation.notices ?? []
  const groups: EventsFactsGroupView[] = [
    {
      id: 'task',
      title: EVENTS_FACTS_TASK,
      pairs: taskFactPairs(observation),
    },
  ]
  if (observation.enforcement) {
    groups.push({
      id: 'enforcement',
      title: EVENTS_FACTS_ENFORCEMENT,
      pairs: enforcementPairs(observation.enforcement),
      caption: EVENTS_ENFORCEMENT_CAPTION,
    })
  }
  groups.push({
    id: 'notices',
    title: EVENTS_FACTS_NOTICES,
    count: notices.length > 0 ? String(notices.length) : null,
    items: notices,
    emptyCaption: notices.length === 0 ? EVENTS_NO_NOTICES : null,
  })
  if (observation.continuity?.adoptedAfterRestart === true) {
    groups.push({
      id: 'continuity',
      title: EVENTS_FACTS_CONTINUITY,
      paragraphs: [EVENTS_CONTINUITY_TEXT],
      caption: EVENTS_CONTINUITY_CAPTION,
    })
  }
  return groups
}
