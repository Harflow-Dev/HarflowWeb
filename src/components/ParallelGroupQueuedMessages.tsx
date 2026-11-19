import type { QueuedLaneTailView } from '../presentation/parallelGroupQueuedMessages'
import { QueuedMessageBubbles } from './QueuedMessageBubbles'

type Props = {
  readonly tail: QueuedLaneTailView
}

/**
 * Queued follow-ups below live activity; Cancel stays unavailable in the mock.
 * Rendered as direct children of the lane body so its flex gap spaces them.
 */
export function ParallelGroupQueuedMessages({ tail }: Props) {
  return <QueuedMessageBubbles tail={tail} />
}
