/**
 * Settings harness facts. Installation, MCP registration, and qualification
 * are independent. None is derived from another.
 * Labels are fixture copy, not a probe of this computer.
 */

export type HarnessInstallFact =
  | { readonly kind: 'installed' }
  | { readonly kind: 'update-available' }
  | { readonly kind: 'not-found'; readonly label: string }
  | { readonly kind: 'unknown' }

export type HarnessRegistrationFact =
  | { readonly kind: 'registered' }
  | { readonly kind: 'not-registered' }
  | { readonly kind: 'unknown' }

export type HarnessQualificationFact =
  | { readonly kind: 'ready'; readonly label: string }
  | { readonly kind: 'attention'; readonly label: string }
  | { readonly kind: 'not-qualified'; readonly label: string }
  | { readonly kind: 'unknown' }

export type HarnessUnavailableAction = 'mcp-approvals' | 'remove' | 'update'

export type SettingsHarnessFact = {
  readonly id: string
  readonly label: string
  readonly hint: string | null
  readonly install: HarnessInstallFact
  readonly registration: HarnessRegistrationFact
  readonly qualification: HarnessQualificationFact
  readonly actions: readonly HarnessUnavailableAction[]
}

/** Where the fixture says the MCP server binary is registered. */
export type McpServerFact =
  | { readonly kind: 'registered'; readonly serverLabel: string }
  | { readonly kind: 'not-registered' }
  | { readonly kind: 'unknown' }

export type HarnessesObservation = {
  readonly server: McpServerFact
  readonly harnesses: readonly SettingsHarnessFact[]
}

export type HarnessesLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable'; readonly message: string }
  | { readonly kind: 'ready'; readonly observation: HarnessesObservation }

export function harnessInstallLabel(install: HarnessInstallFact): string {
  switch (install.kind) {
    case 'installed':
      return 'Installed'
    case 'update-available':
      return 'Update available'
    case 'not-found':
      return install.label
    case 'unknown':
      return 'Unknown'
  }
}

export function harnessRegistrationLabel(
  registration: HarnessRegistrationFact,
): string {
  switch (registration.kind) {
    case 'registered':
      return 'MCP registered'
    case 'not-registered':
      return 'Not registered'
    case 'unknown':
      return 'Registration unknown'
  }
}

export function harnessQualificationLabel(
  qualification: HarnessQualificationFact,
): string {
  switch (qualification.kind) {
    case 'ready':
    case 'attention':
    case 'not-qualified':
      return qualification.label
    case 'unknown':
      return 'Unknown'
  }
}
