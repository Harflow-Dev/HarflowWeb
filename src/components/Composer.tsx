import type {
  AccessLevel,
  AccessOption,
  HarnessId,
  HarnessOption,
  ModelId,
  RepositoryId,
  RepositoryOption,
} from '../model'
import type { OpenMenu } from '../presentation'
import type { ApprovalsMode, EffortLevel } from '../presentation/taskOptions'
import { ComposerBar } from './ComposerBar'
import { ComposerPrompt } from './ComposerPrompt'

export type ComposerProps = {
  readonly prompt: string
  readonly canSubmit: boolean
  readonly pending: boolean
  readonly locked: boolean
  readonly repositories: readonly RepositoryOption[]
  readonly harnesses: readonly HarnessOption[]
  readonly accessOptions: readonly AccessOption[]
  readonly selectedRepositoryId: RepositoryId | null
  readonly selectedHarnessId: HarnessId | null
  readonly selectedModelId: ModelId | null
  readonly selectedAccess: AccessLevel
  readonly openMenu: OpenMenu
  readonly harnessMenuPhase: 'harness' | 'model'
  readonly qualificationHint: string | null
  readonly optionsOpen: boolean
  readonly optionsCustomized: boolean
  readonly effort: EffortLevel
  readonly turns: string
  readonly approvals: ApprovalsMode
  readonly effortOptions: readonly EffortLevel[]
  readonly permissionPreview: string
  readonly startBlockedReason: string | null
  readonly onPrompt: (value: string) => void
  readonly onOpenMenu: (menu: OpenMenu) => void
  readonly onSelectRepository: (id: RepositoryId) => void
  readonly onSelectHarness: (id: HarnessId) => void
  readonly onSelectModel: (id: ModelId) => void
  readonly onSelectAccess: (access: AccessLevel) => void
  readonly onToggleOptions: () => void
  readonly onCloseOptions: (focusTrigger: boolean) => void
  readonly onEffort: (value: EffortLevel) => void
  readonly onTurns: (value: string) => void
  readonly onApprovals: (value: ApprovalsMode) => void
  readonly onSubmit: () => void
}

function toBarProps(props: ComposerProps) {
  const {
    prompt: _prompt,
    onPrompt: _onPrompt,
    onSubmit: _onSubmit,
    ...bar
  } = props
  return bar
}

export function Composer(props: ComposerProps) {
  return (
    <form
      className="hd-composer hw-composer"
      aria-label="New task"
      onSubmit={(event) => {
        event.preventDefault()
        props.onSubmit()
      }}
    >
      <ComposerPrompt
        prompt={props.prompt}
        locked={props.locked}
        onPrompt={props.onPrompt}
        onSubmit={props.onSubmit}
      />
      <ComposerBar {...toBarProps(props)} />
    </form>
  )
}
