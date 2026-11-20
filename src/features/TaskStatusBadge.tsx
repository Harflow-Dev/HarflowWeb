import { Icon } from '../components'
import type { TaskObservation } from '../model'
import {
  type TaskCommandChrome,
  type TaskStatusBadge as Badge,
  taskStatusView,
} from '../presentation'

export function TaskStatusBadge({
  observation,
  commandChrome,
}: {
  readonly observation: TaskObservation
  readonly commandChrome: TaskCommandChrome
}) {
  const { badge } = taskStatusView(observation, commandChrome)
  return (
    <span className={badgeClassName(badge)}>
      <BadgeGlyph glyph={badge.glyph} />
      {badge.label}
    </span>
  )
}

function badgeClassName(badge: Badge): string {
  if (badge.tone === 'neutral') return 'hd-badge hd-m05-badge--neutral'
  if (badge.tone === 'warning') return 'hd-badge hd-badge--warning'
  return `hd-badge hd-badge--${badge.tone}`
}

function BadgeGlyph({ glyph }: { readonly glyph: Badge['glyph'] }) {
  if (glyph === 'spin') {
    return <span className="hd-badge__spin" aria-hidden="true" />
  }
  if (glyph === 'queued') {
    return (
      <span className="hd-glyph hd-glyph--queued" aria-hidden="true" />
    )
  }
  if (glyph === 'none') return null
  return <Icon name={glyph} />
}
