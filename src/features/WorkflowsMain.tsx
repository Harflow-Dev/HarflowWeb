import { WorkflowsPage } from '../components'
import type { WorkflowsScreenState } from '../presentation'

type Props = {
  readonly state: WorkflowsScreenState
  readonly onUnavailable: (label: string) => void
}

/** Workflows main pane — definitions only; Run/Edit/create stay unavailable. */
export function WorkflowsMain({ state, onUnavailable }: Props) {
  return (
    <>
      <div className="hd-topbar">
        <span className="hd-topbar__spacer" />
      </div>
      <div className="hd-scroll">
        {state.load.kind === 'ready' ? (
          <WorkflowsPage
            workflows={state.load.workflows}
            onUnavailable={onUnavailable}
          />
        ) : (
          <div className="hd-page">
            <div className="hd-page__head">
              <h1 className="hd-page__title">Workflows</h1>
            </div>
            <p className="caption hd-faint" role="status">
              {state.load.kind === 'loading'
                ? 'Loading workflows… (proposal — not a design-approved specimen)'
                : state.load.message}
            </p>
          </div>
        )}
      </div>
    </>
  )
}
