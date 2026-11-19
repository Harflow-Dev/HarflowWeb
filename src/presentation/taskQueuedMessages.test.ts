import { describe, expect, it } from 'vitest'
import {
  MESSAGE_CANCELLED_TASK_ID,
  MESSAGE_DELIVERED_TASK_ID,
  MESSAGE_DELIVERING_TASK_ID,
  MESSAGE_QUEUED_TASK_ID,
  MESSAGE_SEND_NOW_REFUSED_TASK_ID,
  MESSAGE_UNCERTAIN_TASK_ID,
  MSG_FIRST,
  MSG_SECOND,
  messageCancelledObservation,
  messageDeliveredObservation,
  messageDeliveringObservation,
  messageQueuedObservation,
  messageSendNowRefusedObservation,
  messageUncertainObservation,
} from '../adapters/mock/taskMessageFixtures'
import { asTaskId, type TaskMessage } from '../model'
import { QUEUED_MESSAGE_COPY } from './queuedMessages'
import {
  EMPTY_MESSAGING_CANCEL,
  taskMessageDrawFacts,
  taskQueuedTailView,
} from './taskQueuedMessages'

function ledgerMessage(partial: TaskMessage): TaskMessage {
  return partial
}

describe('taskMessageDrawFacts', () => {
  it('maps queued with Cancel and no note', () => {
    expect(
      taskMessageDrawFacts(
        ledgerMessage({
          id: 'a',
          seq: 1,
          status: 'queued',
          delivery: 'queue',
          text: MSG_FIRST,
        }),
      ),
    ).toEqual({
      id: 'a',
      text: MSG_FIRST,
      kind: 'queued',
      interruptUnsupported: false,
    })
  })

  it('maps interrupt_unsupported refusal on a queued record', () => {
    expect(
      taskMessageDrawFacts(
        ledgerMessage({
          id: 'a',
          seq: 1,
          status: 'queued',
          delivery: 'now',
          text: MSG_FIRST,
          refusal: {
            code: 'interrupt_unsupported',
            message: 'Message stays queued: safe interruption is unsupported.',
          },
        }),
      )?.interruptUnsupported,
    ).toBe(true)
  })

  it('ignores other refusal codes for presentation copy', () => {
    expect(
      taskMessageDrawFacts(
        ledgerMessage({
          id: 'a',
          seq: 1,
          status: 'queued',
          delivery: 'now',
          text: MSG_FIRST,
          refusal: {
            code: 'continuation_refused',
            message: 'other',
          },
        }),
      )?.interruptUnsupported,
    ).toBe(false)
  })

  it('maps delivering without reason as delivering', () => {
    expect(
      taskMessageDrawFacts(
        ledgerMessage({
          id: 'a',
          seq: 1,
          status: 'delivering',
          delivery: 'queue',
          text: MSG_FIRST,
        }),
      )?.kind,
    ).toBe('delivering')
  })

  it('maps delivering with reason as uncertain', () => {
    expect(
      taskMessageDrawFacts(
        ledgerMessage({
          id: 'a',
          seq: 1,
          status: 'delivering',
          delivery: 'queue',
          text: MSG_FIRST,
          reason: 'Delivery is uncertain',
        }),
      ),
    ).toMatchObject({ kind: 'uncertain' })
  })

  it('draws no bubble for delivered or cancelled records', () => {
    expect(
      taskMessageDrawFacts(
        ledgerMessage({
          id: 'a',
          seq: 1,
          status: 'delivered',
          delivery: 'queue',
        }),
      ),
    ).toBeNull()
    expect(
      taskMessageDrawFacts(
        ledgerMessage({
          id: 'b',
          seq: 2,
          status: 'cancelled',
          delivery: 'queue',
        }),
      ),
    ).toBeNull()
  })
})

describe('taskQueuedTailView', () => {
  it('orders settled before pinned and derives captions', () => {
    const mixed = {
      ...messageQueuedObservation(),
      messages: [
        ledgerMessage({
          id: 'u',
          seq: 1,
          status: 'delivering',
          delivery: 'queue',
          text: MSG_FIRST,
          reason: 'uncertain',
        }),
        ledgerMessage({
          id: 'q',
          seq: 2,
          status: 'queued',
          delivery: 'queue',
          text: MSG_SECOND,
        }),
      ],
    }
    const view = taskQueuedTailView(mixed)
    expect(view.settled.map((m) => m.id)).toEqual(['u'])
    expect(view.pinned.map((m) => m.id)).toEqual(['q'])
    expect(view.settled[0]).toMatchObject({
      caption: QUEUED_MESSAGE_COPY.captionUncertain,
      pinned: false,
      showCancel: false,
      note: QUEUED_MESSAGE_COPY.uncertainNote,
    })
    expect(view.pinned[0]).toMatchObject({
      caption: QUEUED_MESSAGE_COPY.captionQueued,
      pinned: true,
      showCancel: true,
      cancelLabel: `Cancel queued message: ${MSG_SECOND}`,
    })
  })

  it('maps the eight fixture ledgers to expected bubbles and outcomes', () => {
    const queued = taskQueuedTailView(messageQueuedObservation())
    expect(queued.messages.map((m) => m.id)).toEqual(['a', 'b'])
    expect(queued.outcome).toBeNull()
    expect(queued.messages.every((m) => m.showCancel)).toBe(true)

    const delivering = taskQueuedTailView(messageDeliveringObservation())
    expect(delivering.messages).toHaveLength(1)
    expect(delivering.messages[0]?.showCancel).toBe(false)
    expect(delivering.outcome).toBe(QUEUED_MESSAGE_COPY.deliveryInProgress)

    const delivered = taskQueuedTailView(messageDeliveredObservation())
    expect(delivered.messages).toEqual([])
    expect(delivered.outcome).toBe(QUEUED_MESSAGE_COPY.messageDelivered)

    const cancelled = taskQueuedTailView(messageCancelledObservation())
    expect(cancelled.messages.map((m) => m.id)).toEqual(['b'])
    expect(cancelled.outcome).toBe(QUEUED_MESSAGE_COPY.cancelledOutcome)

    const refused = taskQueuedTailView(messageSendNowRefusedObservation())
    expect(refused.messages[0]?.note).toBe(QUEUED_MESSAGE_COPY.sendNowRefusedNote)
    expect(refused.messages[0]?.showCancel).toBe(true)

    const uncertain = taskQueuedTailView(messageUncertainObservation())
    expect(uncertain.settled).toHaveLength(1)
    expect(uncertain.pinned).toEqual([])
    expect(uncertain.outcome).toBeNull()
  })

  it('removes cancelled ids from the mock and prefers cancel chrome outcome', () => {
    const view = taskQueuedTailView(messageQueuedObservation(), {
      removedIds: ['a'],
      cancelled: true,
      focusSeq: 1,
    })
    expect(view.messages.map((m) => m.id)).toEqual(['b'])
    expect(view.outcome).toBe(QUEUED_MESSAGE_COPY.cancelledOutcome)
  })

  it('keeps fixture task ids distinct', () => {
    expect(MESSAGE_QUEUED_TASK_ID).not.toBe(MESSAGE_DELIVERING_TASK_ID)
    expect(MESSAGE_DELIVERED_TASK_ID).not.toBe(MESSAGE_CANCELLED_TASK_ID)
    expect(MESSAGE_SEND_NOW_REFUSED_TASK_ID).not.toBe(MESSAGE_UNCERTAIN_TASK_ID)
    expect(asTaskId('task-message-queued')).toBe(MESSAGE_QUEUED_TASK_ID)
  })

  it('starts from empty cancel chrome', () => {
    expect(EMPTY_MESSAGING_CANCEL).toEqual({
      removedIds: [],
      cancelled: false,
      focusSeq: 0,
    })
  })
})
