import { Composer } from '../components'
import type { AppPresenter } from '../presentation'
import type { NewTaskScreenState } from '../presentation'

type Props = {
  readonly presenter: AppPresenter
  readonly state: NewTaskScreenState
}

/** New-task main pane only — shell chrome lives in AppFeature. */
export function NewTaskMain({ presenter, state }: Props) {
  const ready = state.context.kind === 'ready' ? state.context : null
  return (
    <>
      <div className="hd-topbar">
        <span className="hd-topbar__spacer" />
      </div>
      <div
        className="hd-scroll"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '120px var(--space-6) var(--space-6)',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 720,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-5)',
          }}
        >
          <h1 className="display" style={{ margin: 0, textAlign: 'center' }}>
            What should we work on?
          </h1>
          {ready ? (
            <Composer
              prompt={state.prompt}
              canSubmit={state.canSubmit}
              pending={state.submission.kind === 'pending'}
              repositories={ready.composer.repositories}
              harnesses={ready.composer.harnesses}
              accessOptions={ready.composer.accessOptions}
              selectedRepositoryId={state.selectedRepositoryId}
              selectedHarnessId={state.selectedHarnessId}
              selectedModelId={state.selectedModelId}
              selectedAccess={state.selectedAccess}
              openMenu={state.openMenu}
              harnessMenuPhase={state.harnessMenuPhase}
              onPrompt={(value) => presenter.setPrompt(value)}
              onOpenMenu={(menu) => presenter.setOpenMenu(menu)}
              onSelectRepository={(id) => presenter.selectRepository(id)}
              onSelectHarness={(id) => presenter.selectHarness(id)}
              onSelectModel={(id) => presenter.selectModel(id)}
              onSelectAccess={(access) => presenter.selectAccess(access)}
              onSubmit={() => presenter.submit()}
            />
          ) : (
            <p className="caption hd-faint" style={{ textAlign: 'center' }}>
              {state.context.kind === 'loading'
                ? 'Connecting to mock engine…'
                : state.context.kind === 'unavailable'
                  ? state.context.message
                  : null}
            </p>
          )}
          <p
            className="caption hd-faint"
            style={{ margin: 0, textAlign: 'center' }}
          >
            Press <span className="hd-kbd">↵</span> to start. Choices are
            remembered per repository.
          </p>
        </div>
      </div>
    </>
  )
}
