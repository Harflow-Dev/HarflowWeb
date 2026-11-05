import type {
  AccessLevel,
  Appearance,
  ContextLoad,
  HarnessId,
  ModelId,
  RepositoryId,
  TaskId,
} from '../model'

export type OpenMenu = 'repository' | 'harness' | 'access' | null

export type SubmissionStatus =
  | { readonly kind: 'idle' }
  | { readonly kind: 'pending' }
  | { readonly kind: 'accepted'; readonly taskId: TaskId }
  | { readonly kind: 'refused'; readonly code: string; readonly reason: string }
  | { readonly kind: 'unknown'; readonly message: string }

export type NewTaskScreenState = {
  readonly appearance: Appearance
  readonly sidebarCollapsed: boolean
  readonly context: ContextLoad
  readonly prompt: string
  readonly selectedRepositoryId: RepositoryId | null
  readonly selectedHarnessId: HarnessId | null
  readonly selectedModelId: ModelId | null
  readonly selectedAccess: AccessLevel
  readonly openMenu: OpenMenu
  readonly harnessMenuPhase: 'harness' | 'model'
  readonly submission: SubmissionStatus
  readonly canSubmit: boolean
}

export function initialScreenState(
  appearance: Appearance = 'system',
): NewTaskScreenState {
  return {
    appearance,
    sidebarCollapsed: false,
    context: { kind: 'loading' },
    prompt: '',
    selectedRepositoryId: null,
    selectedHarnessId: null,
    selectedModelId: null,
    selectedAccess: 'edit_repo',
    openMenu: null,
    harnessMenuPhase: 'harness',
    submission: { kind: 'idle' },
    canSubmit: false,
  }
}
