import { describe, expect, it } from 'vitest'
import { asTaskId } from '../model'
import { titledParallelGroup } from '../adapters/mock/parallelGroupFixtures'
import { PRELOAD_TASK_ID } from '../adapters/mock/taskFixtures'
import {
  QUEUED_MESSAGE_COPY,
  QUEUED_MESSAGE_FIRST,
  fencedQueuedMessages,
  queuedLaneTailView,
} from './parallelGroupQueuedMessages'

const TASK = PRELOAD_TASK_ID

function laneWith(
  messages: Parameters<typeof queuedLaneTailView>[0]['queuedMessages'],
) {
  const group = titledParallelGroup()
  const lane = group.lanes[0]!
  return { ...lane, queuedMessages: messages }
}

describe('queuedLaneTailView presentation mapping', () => {
  it('maps queued delivery to Queued caption with Cancel', () => {
    const lane = laneWith([
      {
        id: 'm1',
        taskId: TASK,
        text: QUEUED_MESSAGE_FIRST,
        delivery: 'queued',
        note: null,
      },
    ])
    const view = queuedLaneTailView(lane, null)
    expect(view.messages).toHaveLength(1)
    expect(view.messages[0]).toMatchObject({
      caption: QUEUED_MESSAGE_COPY.captionQueued,
      showCancel: true,
      cancelLabel: `Cancel queued message: ${QUEUED_MESSAGE_FIRST}`,
      pinned: true,
    })
    expect(view.outcome).toBeNull()
  })

  it('maps delivering to Queued caption without Cancel and with delivery outcome', () => {
    const lane = laneWith([
      {
        id: 'm1',
        taskId: TASK,
        text: QUEUED_MESSAGE_FIRST,
        delivery: 'delivering',
        note: null,
      },
    ])
    const view = queuedLaneTailView(lane, null)
    expect(view.messages[0]).toMatchObject({
      caption: QUEUED_MESSAGE_COPY.captionQueued,
      showCancel: false,
    })
    expect(view.outcome).toBe(QUEUED_MESSAGE_COPY.deliveryInProgress)
  })

  it('maps uncertain to Delivery uncertain without Cancel and with note', () => {
    const lane = laneWith([
      {
        id: 'm1',
        taskId: TASK,
        text: QUEUED_MESSAGE_FIRST,
        delivery: 'uncertain',
        note: QUEUED_MESSAGE_COPY.uncertainNote,
      },
    ])
    const view = queuedLaneTailView(lane, null)
    expect(view.messages[0]).toMatchObject({
      caption: QUEUED_MESSAGE_COPY.captionUncertain,
      showCancel: false,
      note: QUEUED_MESSAGE_COPY.uncertainNote,
      pinned: false,
    })
    expect(view.outcome).toBeNull()
  })

  it('surfaces a seeded cancelled outcome without inventing observation fields', () => {
    const lane = laneWith([
      {
        id: 'm2',
        taskId: TASK,
        text: 'Then summarise what changed in two sentences.',
        delivery: 'queued',
        note: null,
      },
    ])
    const view = queuedLaneTailView(lane, QUEUED_MESSAGE_COPY.cancelledOutcome)
    expect(view.outcome).toBe(QUEUED_MESSAGE_COPY.cancelledOutcome)
    expect(view.messages[0]?.showCancel).toBe(true)
  })
})

describe('fencedQueuedMessages', () => {
  it('keeps messages whose taskId matches the lane and rejects mismatches', () => {
    const lane = laneWith([
      {
        id: 'ok',
        taskId: TASK,
        text: 'mine',
        delivery: 'queued',
        note: null,
      },
      {
        id: 'foreign',
        taskId: asTaskId('other-task'),
        text: 'theirs',
        delivery: 'queued',
        note: null,
      },
    ])
    expect(fencedQueuedMessages(lane).map((m) => m.id)).toEqual(['ok'])
    expect(queuedLaneTailView(lane, null).messages.map((m) => m.id)).toEqual([
      'ok',
    ])
  })

  it('rejects every message when the lane has no taskId', () => {
    const lane = {
      ...laneWith([
        {
          id: 'ok',
          taskId: TASK,
          text: 'mine',
          delivery: 'queued' as const,
          note: null,
        },
      ]),
      taskId: null,
    }
    expect(fencedQueuedMessages(lane)).toEqual([])
  })
})
