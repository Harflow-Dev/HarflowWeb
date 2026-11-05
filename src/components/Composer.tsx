import type { KeyboardEvent } from 'react'
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
import { Icon } from './Icon'
import { AccessMenu, HarnessMenu, RepositoryMenu } from './ComposerMenus'

type Props = {
  readonly prompt: string
  readonly canSubmit: boolean
  readonly pending: boolean
  readonly repositories: readonly RepositoryOption[]
  readonly harnesses: readonly HarnessOption[]
  readonly accessOptions: readonly AccessOption[]
  readonly selectedRepositoryId: RepositoryId | null
  readonly selectedHarnessId: HarnessId | null
  readonly selectedModelId: ModelId | null
  readonly selectedAccess: AccessLevel
  readonly openMenu: OpenMenu
  readonly harnessMenuPhase: 'harness' | 'model'
  readonly onPrompt: (value: string) => void
  readonly onOpenMenu: (menu: OpenMenu) => void
  readonly onSelectRepository: (id: RepositoryId) => void
  readonly onSelectHarness: (id: HarnessId) => void
  readonly onSelectModel: (id: ModelId) => void
  readonly onSelectAccess: (access: AccessLevel) => void
  readonly onSubmit: () => void
}

export function Composer(props: Props) {
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    // Do not submit while an IME composition is confirming (Enter / keyCode 229).
    if (event.nativeEvent.isComposing || event.keyCode === 229) {
      return
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      props.onSubmit()
    }
  }

  return (
    <form
      className="hd-composer"
      aria-label="New task"
      onSubmit={(event) => {
        event.preventDefault()
        props.onSubmit()
      }}
    >
      <label className="hd-sr" htmlFor="prompt">
        Task prompt
      </label>
      <textarea
        id="prompt"
        className="hd-composer__input"
        rows={3}
        placeholder="Describe the task. Use @ to mention files."
        value={props.prompt}
        disabled={props.pending}
        onChange={(event) => props.onPrompt(event.target.value)}
        onKeyDown={onKeyDown}
      />
      <div className="hd-composer__bar">
        <RepositoryMenu
          open={props.openMenu === 'repository'}
          repositories={props.repositories}
          selectedRepositoryId={props.selectedRepositoryId}
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
          harnessMenuPhase={props.harnessMenuPhase}
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
          onToggle={() =>
            props.onOpenMenu(props.openMenu === 'access' ? null : 'access')
          }
          onSelect={props.onSelectAccess}
        />
        <span className="hd-composer__spacer" />
        <button
          type="submit"
          className="hd-composer__send"
          aria-label="Start task"
          disabled={!props.canSubmit || props.pending}
        >
          <Icon name="arrow-up" />
        </button>
      </div>
    </form>
  )
}
