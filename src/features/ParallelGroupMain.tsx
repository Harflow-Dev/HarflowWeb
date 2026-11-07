import { ParallelGroupView } from '../components/ParallelGroupView'
import type { ParallelGroupScreenState } from '../presentation'

type Props = {
  readonly state: ParallelGroupScreenState
}

/** Parallel group main pane for the open group id only. */
export function ParallelGroupMain({ state }: Props) {
  return <ParallelGroupView load={state.load} />
}
