import type {
  AccessLevel,
  ComposerContext,
  HarnessId,
  HarnessOption,
  ModelId,
  RepositoryId,
} from '../model'

export type SelectionFields = {
  readonly selectedRepositoryId: RepositoryId | null
  readonly selectedHarnessId: HarnessId | null
  readonly selectedModelId: ModelId | null
  readonly selectedAccess: AccessLevel
}

/**
 * First ready load takes adapter defaults; later loads keep current choices
 * when still valid, otherwise fall back deterministically.
 */
export function reconcileSelections(
  composer: ComposerContext,
  current: SelectionFields,
): SelectionFields {
  const uninitialized =
    current.selectedRepositoryId === null &&
    current.selectedHarnessId === null &&
    current.selectedModelId === null

  const preferred: SelectionFields = uninitialized
    ? {
        selectedRepositoryId: composer.selectedRepositoryId,
        selectedHarnessId: composer.selectedHarnessId,
        selectedModelId: composer.selectedModelId,
        selectedAccess: composer.selectedAccess,
      }
    : current

  return coerceSelections(composer, preferred)
}

export function selectionsAreSubmittable(
  composer: ComposerContext,
  selections: SelectionFields,
): boolean {
  const { selectedRepositoryId, selectedHarnessId, selectedModelId, selectedAccess } =
    selections
  if (
    selectedRepositoryId === null ||
    selectedHarnessId === null ||
    selectedModelId === null
  ) {
    return false
  }
  if (!composer.repositories.some((r) => r.id === selectedRepositoryId)) {
    return false
  }
  const harness = findAvailableHarness(composer, selectedHarnessId)
  if (harness === null) return false
  if (!harness.models.some((m) => m.id === selectedModelId)) return false
  return accessAllowed(composer, harness, selectedAccess)
}

function coerceSelections(
  composer: ComposerContext,
  preferred: SelectionFields,
): SelectionFields {
  const selectedRepositoryId = pickRepository(composer, preferred.selectedRepositoryId)
  const selectedHarnessId = pickHarness(composer, preferred.selectedHarnessId)
  const harness =
    selectedHarnessId === null ? null : findHarness(composer, selectedHarnessId)
  const selectedModelId = pickModel(harness, preferred.selectedModelId)
  const selectedAccess = pickAccess(
    composer,
    harness?.available === true ? harness : null,
    preferred.selectedAccess,
  )
  return {
    selectedRepositoryId,
    selectedHarnessId,
    selectedModelId,
    selectedAccess,
  }
}

function pickRepository(
  composer: ComposerContext,
  preferred: RepositoryId | null,
): RepositoryId | null {
  if (preferred !== null && composer.repositories.some((r) => r.id === preferred)) {
    return preferred
  }
  const fallback = composer.selectedRepositoryId
  if (fallback !== null && composer.repositories.some((r) => r.id === fallback)) {
    return fallback
  }
  return composer.repositories[0]?.id ?? null
}

function pickHarness(
  composer: ComposerContext,
  preferred: HarnessId | null,
): HarnessId | null {
  if (preferred !== null) {
    const match = findHarness(composer, preferred)
    if (match?.available === true) return preferred
    // Keep an observation-selected unavailable harness for gated specimens.
    if (match !== null && composer.selectedHarnessId === preferred) {
      return preferred
    }
  }
  const fallback = composer.selectedHarnessId
  if (fallback !== null && findAvailableHarness(composer, fallback) !== null) {
    return fallback
  }
  return composer.harnesses.find((h) => h.available)?.id ?? null
}

function pickModel(
  harness: HarnessOption | null,
  preferred: ModelId | null,
): ModelId | null {
  if (harness === null) return null
  if (preferred !== null && harness.models.some((m) => m.id === preferred)) {
    return preferred
  }
  const fallback = harness.defaultModelId
  if (fallback !== null && harness.models.some((m) => m.id === fallback)) {
    return fallback
  }
  return harness.models[0]?.id ?? null
}

function pickAccess(
  composer: ComposerContext,
  harness: HarnessOption | null,
  preferred: AccessLevel,
): AccessLevel {
  if (harness !== null && accessAllowed(composer, harness, preferred)) {
    return preferred
  }
  if (
    harness !== null &&
    accessAllowed(composer, harness, composer.selectedAccess)
  ) {
    return composer.selectedAccess
  }
  const fromHarness = harness?.accessLevels.find((level) =>
    accessAllowed(composer, harness, level),
  )
  return fromHarness ?? 'read_only'
}

function findHarness(
  composer: ComposerContext,
  id: HarnessId,
): HarnessOption | null {
  return composer.harnesses.find((h) => h.id === id) ?? null
}

function findAvailableHarness(
  composer: ComposerContext,
  id: HarnessId,
): HarnessOption | null {
  const harness = findHarness(composer, id)
  if (harness === null || !harness.available) return null
  return harness
}

function accessAllowed(
  composer: ComposerContext,
  harness: HarnessOption,
  access: AccessLevel,
): boolean {
  if (!harness.accessLevels.includes(access)) return false
  const option = composer.accessOptions.find((a) => a.id === access)
  return option?.available === true
}
