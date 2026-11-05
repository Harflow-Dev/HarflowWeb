import type { ResourcesLoad } from '../model'

export type ResourcesScreenState = {
  readonly load: ResourcesLoad
}

export function initialResourcesState(): ResourcesScreenState {
  return { load: { kind: 'loading' } }
}
