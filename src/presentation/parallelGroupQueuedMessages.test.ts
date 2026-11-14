import { describe, expect, it } from 'vitest'
import { asTaskId } from '../model'
import {
  QUEUE_FIRST as QUEUED_MESSAGE_FIRST,
  QUEUE_SECOND as QUEUED_MESSAGE_SECOND,
  TITLED_RUNNING_LANE_ID,
  titledParallelGroup,
} from '../adapters/mock/parallelGroupFixtures'
import { PRELOAD_TASK_ID } from '../adapters/mock/taskFixtures'
import {
  QUEUED_MESSAGE_COPY,
  fencedQueuedMessages,
  queuedLaneTailView,
} from './parallelGroupQueuedMessages'

const TASK = PRELOAD_TASK_ID
const CANCELLED_HERE = { laneId: TITLED_RUNNING_LANE_ID, kind: 'cancelled' } as const

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

  it('maps a cancelled outcome seeded for this lane to the cancelled copy', () => {
    const lane = laneWith([
      {
        id: 'm2',
        taskId: TASK,
        text: QUEUED_MESSAGE_SECOND,
        delivery: 'queued',
      },
    ])
    const view = queuedLaneTailView(lane, CANCELLED_HERE)
    expect(view.outcome).toBe(QUEUED_MESSAGE_COPY.cancelledOutcome)
    expect(view.messages[0]?.showCancel).toBe(true)
  })
})

describe('queued outcome lane scoping', () => {
  const queued = [
    {
      id: 'm1',
      taskId: TASK,
      text: QUEUED_MESSAGE_FIRST,
      delivery: 'queued' as const,
    },
  ]

  it('yields no outcome when the seeded lane id does not match', () => {
    const view = queuedLaneTailView(laneWith(queued), {
      laneId: 'another-lane',
      kind: 'cancelled',
    })
    expect(view.outcome).toBeNull()
  })

  it('shows the outcome for the matching lane after its last message was cancelled', () => {
    const view = queuedLaneTailView(laneWith([]), CANCELLED_HERE)
    expect(view.messages).toEqual([])
    expect(view.outcome).toBe(QUEUED_MESSAGE_COPY.cancelledOutcome)
  })

  it('yields no outcome for a mismatched lane with an empty queue', () => {
    const view = queuedLaneTailView(laneWith([]), {
      laneId: 'another-lane',
      kind: 'cancelled',
    })
    expect(view.outcome).toBeNull()
  })

  it('yields no outcome for a lane without a task', () => {
    const lane = { ...laneWith(queued), taskId: null }
    expect(queuedLaneTailView(lane, CANCELLED_HERE).outcome).toBeNull()
  })

  it('derives the uncertain note from delivery, not from the observation', () => {
    const view = queuedLaneTailView(
      laneWith([{ ...queued[0]!, delivery: 'uncertain' }]),
      null,
    )
    expect(view.messages[0]?.note).toBe(QUEUED_MESSAGE_COPY.uncertainNote)
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
      },
      {
        id: 'foreign',
        taskId: asTaskId('other-task'),
        text: 'theirs',
        delivery: 'queued',
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
        },
      ]),
      taskId: null,
    }
    expect(fencedQueuedMessages(lane)).toEqual([])
  })
})
