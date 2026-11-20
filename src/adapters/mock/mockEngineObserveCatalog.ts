import type {
  ContextLoad,
  HarnessesLoad,
  NeedsYouLoad,
  ResourcesLoad,
  SettingsGeneralLoad,
  WorkflowsLoad,
} from '../../model'
import { createObservation } from './mockObservation'
import { messagingCapabilityFor } from './messagingCapabilityFixtures'
import type { MockEngineObserveOptions } from './mockEngineObserve'

export function mockObserveShellSurfaces(options: MockEngineObserveOptions) {
  const { getScenario, listeners } = options
  return {
    observeContext(onUpdate: (load: ContextLoad) => void) {
      return createObservation(listeners.context, onUpdate, () => {
        const scenario = getScenario()
        return scenario.context === 'defer'
          ? { kind: 'loading' as const }
          : scenario.context
      })
    },
    observeWorkflows(onUpdate: (load: WorkflowsLoad) => void) {
      return createObservation(listeners.workflows, onUpdate, () => {
        const scenario = getScenario()
        return scenario.workflows === 'defer'
          ? { kind: 'loading' as const }
          : scenario.workflows
      })
    },
    observeResources(onUpdate: (load: ResourcesLoad) => void) {
      return createObservation(listeners.resources, onUpdate, () => {
        const scenario = getScenario()
        return scenario.resources === 'defer'
          ? { kind: 'loading' as const }
          : scenario.resources
      })
    },
  }
}

export function mockObserveAuxSurfaces(options: MockEngineObserveOptions) {
  const { getScenario, listeners } = options
  return {
    observeHarnesses(onUpdate: (load: HarnessesLoad) => void) {
      return createObservation(listeners.harnesses, onUpdate, () => {
        const scenario = getScenario()
        return scenario.harnesses === 'defer'
          ? { kind: 'loading' as const }
          : scenario.harnesses
      })
    },
    observeSettingsGeneral(onUpdate: (load: SettingsGeneralLoad) => void) {
      return createObservation(listeners.settingsGeneral, onUpdate, () => {
        const scenario = getScenario()
        return scenario.settingsGeneral === 'defer'
          ? { kind: 'loading' as const }
          : scenario.settingsGeneral
      })
    },
    observeNeedsYou(onUpdate: (load: NeedsYouLoad) => void) {
      return createObservation(listeners.needsYou, onUpdate, () => {
        const scenario = getScenario()
        return scenario.needsYou === 'defer'
          ? { kind: 'loading' as const }
          : scenario.needsYou
      })
    },
    observeMessagingCapability(
      onUpdate: (load: import('../../model').MessagingCapabilityLoad) => void,
    ) {
      return createObservation(listeners.messagingCapability, onUpdate, () =>
        messagingCapabilityFor(getScenario()),
      )
    },
  }
}