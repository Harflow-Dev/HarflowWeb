import { ResourcesPage } from '../components'
import { ResourcesLoadingPage } from '../components/skeleton'
import type { ResourcesScreenState } from '../presentation'

type Props = {
  readonly state: ResourcesScreenState
  readonly onUnavailable: (label: string) => void
}

export function ResourcesMain({ state, onUnavailable }: Props) {
  return (
    <>
      <div className="hd-topbar">
        <span className="hd-topbar__spacer" />
      </div>
      <div className="hd-scroll">
        {state.load.kind === 'ready' ? (
          <ResourcesPage
            observation={state.load.observation}
            onUnavailable={onUnavailable}
          />
        ) : state.load.kind === 'loading' ? (
          <ResourcesLoadingPage />
        ) : (
          <div className="hd-page">
            <div className="hd-page__head">
              <h1 className="hd-page__title">Resources</h1>
            </div>
            <p className="caption hd-faint" role="status">
              {state.load.message}
            </p>
          </div>
        )}
      </div>
    </>
  )
}
