import { useEffect } from 'react'
import type { NewTaskScenarioSeed } from '../adapters/mock'
import type { AppPresenter } from '../presentation'
import { applyNewTaskSeed } from './applyNewTaskSeed'

/** Applies a scenario seed once the new-task context observation is ready. */
export function usePreviewSeed(
  presenter: AppPresenter,
  seed: NewTaskScenarioSeed | undefined,
): void {
  useEffect(() => {
    if (seed === undefined) return
    let cancelled = false
    const unsub = presenter.subscribe((state) => {
      if (cancelled) return
      if (state.newTask.context.kind !== 'ready') return
      cancelled = true
      unsub()
      applyNewTaskSeed(presenter, seed)
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [presenter, seed])
}
