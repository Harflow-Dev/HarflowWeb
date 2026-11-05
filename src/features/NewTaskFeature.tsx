import { useSyncExternalStore } from 'react'
import { Composer, MockBadge, Sidebar, StatusRegion } from '../components'
import type { NewTaskPresenter } from '../presentation'
import { useEphemeralNote, usePresenter, usePresenterLifetime } from './usePresenter'

type Props = {
  readonly presenter: NewTaskPresenter
}

export function NewTaskFeature({ presenter }: Props) {
  usePresenterLifetime(presenter)
  const state = usePresenter(presenter)
  const ephemeral = useEphemeralNote()
  const systemDark = useSystemPrefersDark()

  const resolvedTheme =
    state.appearance === 'system'
      ? systemDark
        ? 'dark'
        : 'light'
      : state.appearance

  const ready = state.context.kind === 'ready' ? state.context : null
  const contextNote =
    state.context.kind === 'unavailable'
      ? state.context.message
      : state.context.kind === 'loading'
        ? 'Loading composer context… (proposal — not a design-approved specimen)'
        : (ready?.sidebar.coverageNote ?? null)

  return (
    <div className="hw-root" data-theme={resolvedTheme}>
      <MockBadge />
      <div className="hd-app" data-theme={resolvedTheme}>
        <Sidebar
          collapsed={state.sidebarCollapsed}
          appearance={state.appearance}
          sidebar={ready?.sidebar ?? null}
          onCollapse={(collapsed) => presenter.setSidebarCollapsed(collapsed)}
          onAppearance={(appearance) => presenter.setAppearance(appearance)}
          onUnavailable={(label) => ephemeral.show(label)}
        />
        <main className="hd-main">
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
        </main>
      </div>
      <StatusRegion
        submission={state.submission}
        contextNote={contextNote}
        unavailableNav={ephemeral.note}
      />
    </div>
  )
}

function useSystemPrefersDark(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined') return () => undefined
      const media = window.matchMedia('(prefers-color-scheme: dark)')
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
    () => false,
  )
}
