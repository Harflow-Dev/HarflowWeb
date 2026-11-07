import { asHarnessId, type AccessLevel, type HarnessId } from '../model'

/** Reasoning effort choices from the M04 task-options specimen. */
export type EffortLevel =
  | 'default'
  | 'low'
  | 'medium'
  | 'high'
  | 'xhigh'
  | 'unsupported'

/** Approvals mode from the M04 task-options specimen. */
export type ApprovalsMode = 'harness' | 'caller'

export const DEFAULT_EFFORT: EffortLevel = 'default'
export const DEFAULT_TURNS = '12'
export const DEFAULT_APPROVALS: ApprovalsMode = 'harness'

export const EFFORT_OPTIONS: readonly EffortLevel[] = [
  'default',
  'low',
  'medium',
  'high',
  'xhigh',
  'unsupported',
]

const SUPPORTED_EFFORT: ReadonlySet<string> = new Set([
  'default',
  'low',
  'medium',
  'high',
  'xhigh',
])

export function taskOptionsCustomized(
  effort: EffortLevel,
  turns: string,
  approvals: ApprovalsMode,
): boolean {
  return (
    effort !== DEFAULT_EFFORT ||
    turns !== DEFAULT_TURNS ||
    approvals !== DEFAULT_APPROVALS
  )
}

type OptionProblemInput = {
  readonly effort: EffortLevel
  readonly turns: string
  readonly approvals: ApprovalsMode
  readonly harnessId: HarnessId | null
  readonly access: AccessLevel
}

/**
 * Blocks Start for the same option rules as the M04 specimen. Empty prompt and
 * selection checks stay in the presenter.
 */
export function taskOptionsProblem(input: OptionProblemInput): string {
  const { effort, turns, approvals, harnessId, access } = input
  if (
    !SUPPORTED_EFFORT.has(effort) ||
    (harnessId === asHarnessId('vibe') && effort !== 'default')
  ) {
    return 'This harness does not support the requested effort. Review task options.'
  }
  if (turns !== '') {
    if (!/^\d+$/.test(turns) || Number(turns) < 1 || !Number.isSafeInteger(Number(turns))) {
      return 'Enter a whole number above 0, or leave it empty for the default.'
    }
    if (harnessId === asHarnessId('codex')) {
      return 'This harness does not support a turn limit. Clear it in task options.'
    }
  }
  if (
    approvals === 'caller' &&
    (harnessId !== asHarnessId('claude') ||
      turns !== '' ||
      (access !== 'edit_repo' && access !== 'publish'))
  ) {
    return 'Caller approvals require a supported harness, repository write access and an empty turn limit. Review task options.'
  }
  return ''
}

export function accessPermissionPreview(access: AccessLevel): string {
  switch (access) {
    case 'read_only':
      return 'Read only'
    case 'edit_repo':
      return 'Repository write'
    case 'publish':
      return 'Publish access'
    case 'full':
      return 'Broad access'
  }
}
