import type { SettingsGeneralLoad } from '../model'

export type SettingsGeneralScreenState = {
  readonly load: SettingsGeneralLoad
}

export function initialSettingsGeneralState(): SettingsGeneralScreenState {
  return { load: { kind: 'loading' } }
}
