import { useSyncExternalStore } from 'react'
import { MockBadge, Sidebar, StatusRegion } from '../components'
import type { AppPresenter } from '../presentation'
import { NewTaskMain } from './NewTaskMain'
import { useEphemeralNote, usePresenter, usePresenterLifetime } from './usePresenter'
import { WorkflowsMain } from './WorkflowsMain'

type Props = {
  readonly presenter: AppPresenter
}

export function AppFeature({ presenter }: Props) {
  usePresenterLifetime(presenter)
  const state = usePresenter(presenter)
  const ephemeral = useEphemeralNote()
  const systemDark = useSystemPrefersDark()
  const newTask = state.newTask

  const resolvedTheme =
    newTask.appearance === 'system'
      ? systemDark
        ? 'dark'
        : 'light'
      : newTask.appearance

  const ready = newTask.context.kind === 'ready' ? newTask.context : null
  const contextNote =
    newTask.context.kind === 'unavailable'
      ? newTask.context.message
      : newTask.context.kind === 'loading'
        ? 'Loading composer context… (proposal — not a design-approved specimen)'
        : (ready?.sidebar.coverageNote ?? null)

  return (
    <div className="hw-root" data-theme={resolvedTheme}>
      <MockBadge />
      <div className="hd-app" data-theme={resolvedTheme}>
        <Sidebar
          collapsed={newTask.sidebarCollapsed}
          appearance={newTask.appearance}
          activeRoute={state.route}
          sidebar={ready?.sidebar ?? null}
          onCollapse={(collapsed) => presenter.setSidebarCollapsed(collapsed)}
          onAppearance={(appearance) => presenter.setAppearance(appearance)}
          onNavigate={(route) => presenter.navigate(route)}
          onUnavailable={(label) => ephemeral.show(label)}
        />
        <main className="hd-main">
          {state.route === 'new-task' ? (
            <NewTaskMain presenter={presenter} state={newTask} />
          ) : (
            <WorkflowsMain
              state={state.workflows}
              onUnavailable={(label) => ephemeral.show(label)}
            />
          )}
        </main>
      </div>
      <StatusRegion
        submission={newTask.submission}
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
