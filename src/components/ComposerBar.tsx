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
import { ComposerBarPills } from './ComposerBarPills'
import { ComposerStartButton } from './ComposerStartButton'
import { ComposerTaskOptions } from './ComposerTaskOptions'

type Props = {
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
}

/** Composer bottom row: options +, pills, and Start. */
export function ComposerBar(props: Props) {
  function openMenu(menu: OpenMenu): void {
    if (menu !== null) props.onCloseOptions(false)
    props.onOpenMenu(menu)
  }

  return (
    <div className="hd-composer__bar">
      <ComposerTaskOptions
        open={props.optionsOpen}
        customized={props.optionsCustomized}
        locked={props.locked}
        effort={props.effort}
        turns={props.turns}
        approvals={props.approvals}
        effortOptions={props.effortOptions}
        permissionPreview={props.permissionPreview}
        onToggle={props.onToggleOptions}
        onClose={props.onCloseOptions}
        onEffort={props.onEffort}
        onTurns={props.onTurns}
        onApprovals={props.onApprovals}
      />
      <ComposerBarPills
        repositories={props.repositories}
        harnesses={props.harnesses}
        accessOptions={props.accessOptions}
        selectedRepositoryId={props.selectedRepositoryId}
        selectedHarnessId={props.selectedHarnessId}
        selectedModelId={props.selectedModelId}
        selectedAccess={props.selectedAccess}
        openMenu={props.openMenu}
        harnessMenuPhase={props.harnessMenuPhase}
        locked={props.locked}
        onOpenMenu={openMenu}
        onSelectRepository={props.onSelectRepository}
        onSelectHarness={props.onSelectHarness}
        onSelectModel={props.onSelectModel}
        onSelectAccess={props.onSelectAccess}
      />
      <span className="hd-composer__spacer" />
      <ComposerStartButton canSubmit={props.canSubmit} />
    </div>
  )
}
