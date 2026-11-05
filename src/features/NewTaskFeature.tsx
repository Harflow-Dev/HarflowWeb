import type { AppPresenter } from '../presentation'
import { AppFeature } from './AppFeature'

type Props = {
  readonly presenter: AppPresenter
}

/**
 * Compatibility export: the shell now hosts New task and Workflows.
 * Prefer AppFeature for new call sites.
 */
export function NewTaskFeature({ presenter }: Props) {
  return <AppFeature presenter={presenter} />
}
