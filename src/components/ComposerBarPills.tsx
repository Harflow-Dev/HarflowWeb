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
import { AccessMenu, HarnessMenu, RepositoryMenu } from './ComposerMenus'

type Props = {
  readonly repositories: readonly RepositoryOption[]
  readonly harnesses: readonly HarnessOption[]
  readonly accessOptions: readonly AccessOption[]
  readonly selectedRepositoryId: RepositoryId | null
  readonly selectedHarnessId: HarnessId | null
  readonly selectedModelId: ModelId | null
  readonly selectedAccess: AccessLevel
  readonly openMenu: OpenMenu
  readonly qualificationHint: string | null
  readonly locked: boolean
  readonly onOpenMenu: (menu: OpenMenu) => void
  readonly onSelectRepository: (id: RepositoryId) => void
  readonly onSelectHarness: (id: HarnessId) => void
  readonly onSelectModel: (id: ModelId) => void
  readonly onSelectAccess: (access: AccessLevel) => void
}

/** Repository, harness, and access pills for the New task composer. */
export function ComposerBarPills(props: Props) {
  return (
    <>
      <RepositoryMenu
        open={props.openMenu === 'repository'}
        repositories={props.repositories}
        selectedRepositoryId={props.selectedRepositoryId}
        disabled={props.locked}
        onToggle={() =>
          props.onOpenMenu(props.openMenu === 'repository' ? null : 'repository')
        }
        onSelect={props.onSelectRepository}
      />
      <HarnessMenu
        open={props.openMenu === 'harness'}
        harnesses={props.harnesses}
        selectedHarnessId={props.selectedHarnessId}
        selectedModelId={props.selectedModelId}
        qualificationHint={props.qualificationHint}
        disabled={props.locked}
        onToggle={() =>
          props.onOpenMenu(props.openMenu === 'harness' ? null : 'harness')
        }
        onSelectHarness={props.onSelectHarness}
        onSelectModel={props.onSelectModel}
      />
      <AccessMenu
        open={props.openMenu === 'access'}
        accessOptions={props.accessOptions}
        selectedAccess={props.selectedAccess}
        selectedHarnessId={props.selectedHarnessId}
        harnesses={props.harnesses}
        disabled={props.locked}
        onToggle={() =>
          props.onOpenMenu(props.openMenu === 'access' ? null : 'access')
        }
        onSelect={props.onSelectAccess}
      />
    </>
  )
}
