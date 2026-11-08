import type {
  AccessLevel,
  Appearance,
  ContextLoad,
  HarnessId,
  ModelId,
  RepositoryId,
  TaskId,
} from '../model'
import {
  DEFAULT_APPROVALS,
  DEFAULT_EFFORT,
  DEFAULT_TURNS,
  type ApprovalsMode,
  type EffortLevel,
} from './taskOptions'

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
  readonly optionsOpen: boolean
  readonly effort: EffortLevel
  readonly turns: string
  readonly approvals: ApprovalsMode
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
    optionsOpen: false,
    effort: DEFAULT_EFFORT,
    turns: DEFAULT_TURNS,
    approvals: DEFAULT_APPROVALS,
    submission: { kind: 'idle' },
    canSubmit: false,
  }
}
