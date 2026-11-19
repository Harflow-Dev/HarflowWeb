import type { MessagingCapabilityLoad } from '../../model'
import type { ScenarioDefinition } from './scenarios'

export function messagingCapabilityFor(
  scenario: ScenarioDefinition,
): MessagingCapabilityLoad {
  if (scenario.messagingCapability === 'defer') return { kind: 'loading' }
  return { kind: 'ready', supported: scenario.messagingCapability }
}
