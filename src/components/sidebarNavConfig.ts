import type { AppRoute } from '../presentation'
import type { IconName } from './Icon'

export type NavId = AppRoute | 'needs-you'

export const NAV: readonly {
  id: NavId
  label: string
  icon: IconName
  kbd?: string
}[] = [
  { id: 'new-task', label: 'New task', icon: 'plus', kbd: '⌘N' },
  { id: 'needs-you', label: 'Needs you', icon: 'hand' },
  { id: 'workflows', label: 'Workflows', icon: 'workflow' },
  { id: 'resources', label: 'Resources', icon: 'gauge' },
  { id: 'statistics', label: 'Statistics', icon: 'chart' },
]

export function isAppRoute(id: NavId): id is AppRoute {
  return (
    id === 'new-task' ||
    id === 'needs-you' ||
    id === 'workflows' ||
    id === 'resources' ||
    id === 'statistics' ||
    id === 'settings' ||
    id === 'task'
  )
}
