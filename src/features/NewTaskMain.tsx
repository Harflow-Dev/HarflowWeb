import { Composer } from '../components'
import type { AppPresenter } from '../presentation'
import type { NewTaskScreenState } from '../presentation'
import {
  newTaskOptionsAreCustomized,
  newTaskQualificationHint,
  newTaskStatusMessage,
} from '../presentation/newTaskStatus'
import {
  EFFORT_OPTIONS,
  accessPermissionPreview,
} from '../presentation/taskOptions'

type Props = {
  readonly presenter: AppPresenter
  readonly state: NewTaskScreenState
}

/** New-task main pane only — shell chrome lives in AppFeature. */
export function NewTaskMain({ presenter, state }: Props) {
  const ready = state.context.kind === 'ready' ? state.context : null
  const locked =
    state.submission.kind === 'pending' || state.submission.kind === 'unknown'
  const statusMessage = ready ? newTaskStatusMessage(state) : null
  const qualificationHint = newTaskQualificationHint(state)
  return (
    <>
      <div className="hd-topbar">
        <span className="hd-topbar__spacer" />
      </div>
      <div className="hd-scroll hw-compose-area">
        <div className="hw-compose-group">
          <h1 className="display" style={{ margin: 0, textAlign: 'center' }}>
            What should we work on?
          </h1>
          {ready ? (
            <Composer
              prompt={state.prompt}
              canSubmit={state.canSubmit}
              pending={state.submission.kind === 'pending'}
              locked={locked}
              repositories={ready.composer.repositories}
              harnesses={ready.composer.harnesses}
              accessOptions={ready.composer.accessOptions}
              selectedRepositoryId={state.selectedRepositoryId}
              selectedHarnessId={state.selectedHarnessId}
              selectedModelId={state.selectedModelId}
              selectedAccess={state.selectedAccess}
              openMenu={state.openMenu}
              qualificationHint={qualificationHint}
              optionsOpen={state.optionsOpen}
              optionsCustomized={newTaskOptionsAreCustomized(state)}
              effort={state.effort}
              turns={state.turns}
              approvals={state.approvals}
              effortOptions={EFFORT_OPTIONS}
              permissionPreview={accessPermissionPreview(state.selectedAccess)}
              startBlockedReason={state.canSubmit ? null : statusMessage}
              qualification={ready.composer.qualification}
              onPrompt={(value) => presenter.setPrompt(value)}
              onOpenMenu={(menu) => presenter.setOpenMenu(menu)}
              onSelectRepository={(id) => presenter.selectRepository(id)}
              onSelectHarness={(id) => presenter.selectHarness(id)}
              onSelectModel={(id) => presenter.selectModel(id)}
              onSelectAccess={(access) => presenter.selectAccess(access)}
              onToggleOptions={() =>
                presenter.setOptionsOpen(!state.optionsOpen)
              }
              onCloseOptions={() => presenter.setOptionsOpen(false)}
              onEffort={(value) => presenter.setEffort(value)}
              onTurns={(value) => presenter.setTurns(value)}
              onApprovals={(value) => presenter.setApprovals(value)}
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
          {/* Visual status only — StatusRegion is the sole live region. */}
          <div className="hw-compose-status">{statusMessage}</div>
          <p className="caption hd-faint hw-compose-help">
            Press <span className="hd-kbd">↵</span> to start. Choices are
            remembered per repository.
          </p>
        </div>
      </div>
    </>
  )
}
