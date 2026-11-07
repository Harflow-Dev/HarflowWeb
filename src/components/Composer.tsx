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

type Props = {
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
  readonly optionsOpen: boolean
  readonly optionsCustomized: boolean
  readonly effort: EffortLevel
  readonly turns: string
  readonly approvals: ApprovalsMode
  readonly effortOptions: readonly EffortLevel[]
  readonly permissionPreview: string
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

export function Composer(props: Props) {
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
      <ComposerBar
        canSubmit={props.canSubmit}
        pending={props.pending}
        locked={props.locked}
        repositories={props.repositories}
        harnesses={props.harnesses}
        accessOptions={props.accessOptions}
        selectedRepositoryId={props.selectedRepositoryId}
        selectedHarnessId={props.selectedHarnessId}
        selectedModelId={props.selectedModelId}
        selectedAccess={props.selectedAccess}
        openMenu={props.openMenu}
        harnessMenuPhase={props.harnessMenuPhase}
        optionsOpen={props.optionsOpen}
        optionsCustomized={props.optionsCustomized}
        effort={props.effort}
        turns={props.turns}
        approvals={props.approvals}
        effortOptions={props.effortOptions}
        permissionPreview={props.permissionPreview}
        onOpenMenu={props.onOpenMenu}
        onSelectRepository={props.onSelectRepository}
        onSelectHarness={props.onSelectHarness}
        onSelectModel={props.onSelectModel}
        onSelectAccess={props.onSelectAccess}
        onToggleOptions={props.onToggleOptions}
        onCloseOptions={props.onCloseOptions}
        onEffort={props.onEffort}
        onTurns={props.onTurns}
        onApprovals={props.onApprovals}
      />
    </form>
  )
}
