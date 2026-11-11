import type {
  SettingsGeneralLoad,
  SettingsGeneralObservation,
} from '../../model'

/**
 * Facts shown by the approved settings/general specimen: the runtime is
 * ready at 0.9.3 and the task store is compatible. Fixture copy, not a probe.
 */
export function populatedSettingsGeneralObservation(): SettingsGeneralObservation {
  return {
    runtime: { kind: 'ready', version: '0.9.3' },
    taskStore: { kind: 'compatible' },
  }
}

export function populatedSettingsGeneralLoad(): SettingsGeneralLoad {
  return {
    kind: 'ready',
    observation: populatedSettingsGeneralObservation(),
  }
}

export function unavailableSettingsGeneralLoad(): SettingsGeneralLoad {
  return {
    kind: 'unavailable',
    message: 'Settings facts are unavailable in this fixture.',
  }
}
