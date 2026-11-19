import { describe, expect, it } from 'vitest'
import {
  MESSAGE_QUEUED_TASK_ID,
  MSG_FIRST,
  MSG_SECOND,
  SEND_NOW_REFUSAL,
  messageCancelledObservation,
  messageDeliveredObservation,
  messageDeliveringObservation,
  messageQueuedObservation,
  messageSendNowRefusedObservation,
  messageUncertainObservation,
} from '../adapters/mock/taskMessageFixtures'
import { asTaskId, type TaskMessage, type TaskObservation } from '../model'
import { QUEUED_MESSAGE_COPY } from './queuedMessages'
import {
  EMPTY_TASK_MESSAGING,
  taskLedger,
  taskMessageDrawFacts,
  taskQueuedTailView,
  type TaskMessagingChrome,
} from './taskQueuedMessages'

const REFUSED: TaskMessagingChrome = {
  ...EMPTY_TASK_MESSAGING,
  refusals: [{ messageId: 'a', refusal: SEND_NOW_REFUSAL }],
}

function withLedger(
  observation: TaskObservation,
  messages: readonly TaskMessage[],
): TaskObservation {
  return { ...observation, messages }
}

function record(partial: Partial<TaskMessage> & Pick<TaskMessage, 'id' | 'seq' | 'status'>): TaskMessage {
  return { delivery: 'queue', text: MSG_FIRST, ...partial }
}

describe('taskMessageDrawFacts', () => {
  it('maps queued with Cancel and no note', () => {
    expect(
      taskMessageDrawFacts(record({ id: 'a', seq: 1, status: 'queued' })),
    ).toEqual({
      id: 'a',
      text: MSG_FIRST,
      kind: 'queued',
      interruptUnsupported: false,
    })
  })

  it('attaches the interrupt_unsupported note only for that refusal code', () => {
    const queued = record({ id: 'a', seq: 1, status: 'queued', delivery: 'now' })
    expect(
      taskMessageDrawFacts(queued, SEND_NOW_REFUSAL)?.interruptUnsupported,
    ).toBe(true)
    for (const code of [
      'workflow_checkpoint_required',
      'continuation_refused',
      'continuation_uncertain',
    ]) {
      expect(
        taskMessageDrawFacts(queued, { code, message: 'other' })
          ?.interruptUnsupported,
      ).toBe(false)
    }
  })

  it('maps delivering without a reason as delivering and with one as uncertain', () => {
    expect(
      taskMessageDrawFacts(record({ id: 'a', seq: 1, status: 'delivering' }))
        ?.kind,
    ).toBe('delivering')
    expect(
      taskMessageDrawFacts(
        record({ id: 'a', seq: 1, status: 'delivering', reason: 'uncertain' }),
      ),
    ).toMatchObject({ kind: 'uncertain' })
  })

  it('draws no bubble for delivered, cancelled or undeliverable records', () => {
    for (const status of ['delivered', 'cancelled', 'undeliverable'] as const) {
      expect(
        taskMessageDrawFacts(record({ id: 'a', seq: 1, status })),
      ).toBeNull()
    }
  })

  it('draws no bubble for a queued or delivering record without text', () => {
    for (const status of ['queued', 'delivering'] as const) {
      const { text: _text, ...noText } = record({ id: 'a', seq: 1, status })
      expect(taskMessageDrawFacts(noText)).toBeNull()
      expect(taskMessageDrawFacts({ ...noText, text: '' })).toBeNull()
    }
  })
})

describe('taskLedger', () => {
  it('orders records by seq and ignores records that target another task', () => {
    const observation = withLedger(messageQueuedObservation(), [
      record({ id: 'late', seq: 3, status: 'queued' }),
      record({
        id: 'foreign',
        seq: 2,
        status: 'queued',
        target: { kind: 'task', taskId: asTaskId('someone-else') },
      }),
      record({
        id: 'early',
        seq: 1,
        status: 'queued',
        target: { kind: 'task', taskId: MESSAGE_QUEUED_TASK_ID },
      }),
    ])
    expect(taskLedger(observation).map((m) => m.id)).toEqual(['early', 'late'])
  })
})

describe('taskQueuedTailView', () => {
  it('orders bubbles by seq within settled and pinned', () => {
    const view = taskQueuedTailView(
      withLedger(messageQueuedObservation(), [
        record({ id: 'q2', seq: 4, status: 'queued', text: MSG_SECOND }),
        record({ id: 'u2', seq: 3, status: 'delivering', reason: 'x' }),
        record({ id: 'q1', seq: 2, status: 'queued' }),
        record({ id: 'u1', seq: 1, status: 'delivering', reason: 'x' }),
      ]),
    )
    expect(view.settled.map((m) => m.id)).toEqual(['u1', 'u2'])
    expect(view.pinned.map((m) => m.id)).toEqual(['q1', 'q2'])
    expect(view.messages.map((m) => m.id)).toEqual(['u1', 'u2', 'q1', 'q2'])
  })

  it('derives captions for settled and pinned bubbles', () => {
    const view = taskQueuedTailView(
      withLedger(messageQueuedObservation(), [
        record({ id: 'u', seq: 1, status: 'delivering', reason: 'uncertain' }),
        record({ id: 'q', seq: 2, status: 'queued', text: MSG_SECOND }),
      ]),
    )
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

  it('does not draw undeliverable records', () => {
    const view = taskQueuedTailView(
      withLedger(messageQueuedObservation(), [
        record({ id: 'a', seq: 1, status: 'undeliverable' }),
      ]),
    )
    expect(view.messages).toEqual([])
    expect(view.outcome).toBeNull()
  })

  it('maps the ledger fixtures to bubbles', () => {
    const queued = taskQueuedTailView(messageQueuedObservation())
    expect(queued.messages.map((m) => m.id)).toEqual(['a', 'b'])
    expect(queued.messages.every((m) => m.showCancel)).toBe(true)
    expect(queued.outcome).toBeNull()

    const delivering = taskQueuedTailView(messageDeliveringObservation())
    expect(delivering.messages).toHaveLength(1)
    expect(delivering.messages[0]?.showCancel).toBe(false)

    const uncertain = taskQueuedTailView(messageUncertainObservation())
    expect(uncertain.settled).toHaveLength(1)
    expect(uncertain.pinned).toEqual([])
  })

  it('derives "Delivery is in progress." from a delivering record only', () => {
    expect(taskQueuedTailView(messageDeliveringObservation()).outcome).toBe(
      QUEUED_MESSAGE_COPY.deliveryInProgress,
    )
    expect(taskQueuedTailView(messageUncertainObservation()).outcome).toBeNull()
  })

  it('does not derive an outcome from retained delivered or cancelled history', () => {
    const delivered = taskQueuedTailView(messageDeliveredObservation())
    expect(delivered.messages).toEqual([])
    expect(delivered.outcome).toBeNull()
    expect(taskQueuedTailView(messageCancelledObservation()).outcome).toBeNull()
  })

  it('shows a transient outcome from session chrome', () => {
    const delivered = taskQueuedTailView(messageDeliveredObservation(), {
      ...EMPTY_TASK_MESSAGING,
      outcome: 'delivered',
    })
    expect(delivered.outcome).toBe(QUEUED_MESSAGE_COPY.messageDelivered)
    const cancelled = taskQueuedTailView(messageCancelledObservation(), {
      ...EMPTY_TASK_MESSAGING,
      outcome: 'cancelled',
    })
    expect(cancelled.messages.map((m) => m.id)).toEqual(['b'])
    expect(cancelled.outcome).toBe(QUEUED_MESSAGE_COPY.cancelledOutcome)
  })

  it('lets a command outcome win over the derived delivery line', () => {
    const view = taskQueuedTailView(messageDeliveringObservation(), {
      ...EMPTY_TASK_MESSAGING,
      outcome: 'cancelled',
    })
    expect(view.outcome).toBe(QUEUED_MESSAGE_COPY.cancelledOutcome)
  })

  it('removes cancelled ids from the drawn queue', () => {
    const view = taskQueuedTailView(messageQueuedObservation(), {
      ...EMPTY_TASK_MESSAGING,
      removedIds: ['a'],
      outcome: 'cancelled',
      focusSeq: 1,
    })
    expect(view.messages.map((m) => m.id)).toEqual(['b'])
    expect(view.outcome).toBe(QUEUED_MESSAGE_COPY.cancelledOutcome)
  })

  it('draws the refusal note from the command outcome, keeping Cancel', () => {
    const refused = taskQueuedTailView(messageSendNowRefusedObservation(), REFUSED)
    expect(refused.messages[0]?.note).toBe(QUEUED_MESSAGE_COPY.sendNowRefusedNote)
    expect(refused.messages[0]?.showCancel).toBe(true)
  })

  it('draws no refusal note without the command outcome or for another message', () => {
    expect(
      taskQueuedTailView(messageSendNowRefusedObservation()).messages[0]?.note,
    ).toBeNull()
    const other = taskQueuedTailView(messageQueuedObservation(), REFUSED)
    expect(other.messages.map((m) => m.note)).toEqual([
      QUEUED_MESSAGE_COPY.sendNowRefusedNote,
      null,
    ])
  })

  it('has no copy for refusal codes other than interrupt_unsupported', () => {
    const view = taskQueuedTailView(messageSendNowRefusedObservation(), {
      ...EMPTY_TASK_MESSAGING,
      refusals: [
        {
          messageId: 'a',
          refusal: { code: 'continuation_refused', message: 'other' },
        },
      ],
    })
    expect(view.messages[0]?.note).toBeNull()
  })
})
