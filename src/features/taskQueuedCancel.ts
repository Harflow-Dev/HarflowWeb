import { QUEUED_MESSAGE_COPY, type AppPresenter } from '../presentation'

type Announce = (note: { readonly kind: 'announce'; readonly text: string }) => void

/** Cancel a queued task message and announce the outcome through StatusRegion. */
export function cancelTaskQueuedMessageAndAnnounce(
  presenter: AppPresenter,
  messageId: string,
  announce: Announce,
): void {
  if (!presenter.cancelTaskQueuedMessage(messageId)) return
  announce({ kind: 'announce', text: QUEUED_MESSAGE_COPY.cancelledOutcome })
}
