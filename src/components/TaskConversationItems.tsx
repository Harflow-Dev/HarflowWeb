import { Fragment, type ReactNode } from 'react'
import type {
  ConversationItem,
  ConversationOutputLine,
  InlineRun,
} from '../model'
import type { QueuedMessageView } from '../presentation/queuedMessages'
import { Icon } from './Icon'
import { QueuedMessageBubbles } from './QueuedMessageBubbles'

function Runs({ runs }: { readonly runs: readonly InlineRun[] }) {
  return (
    <>
      {runs.map((run, index) =>
        run.kind === 'code' ? (
          <code key={index}>{run.value}</code>
        ) : (
          <Fragment key={index}>{run.value}</Fragment>
        ),
      )}
    </>
  )
}

function Output({ lines }: { readonly lines: readonly ConversationOutputLine[] }) {
  return (
    <div className="hd-tool__body">
      {lines.map((line, index) => (
        <Fragment key={index}>
          {index > 0 ? '\n' : null}
          {line.marker ? <b>{line.marker}</b> : null}
          {line.text}
        </Fragment>
      ))}
    </div>
  )
}

function ToolRow({
  item,
}: {
  readonly item: Extract<ConversationItem, { kind: 'tool' }>
}) {
  const summary = (
    <>
      <Icon name={item.tool} size="sm" />
      <span className="hd-tool__summary">
        <Runs runs={item.summary} />
      </span>
    </>
  )
  if (!item.output) {
    return (
      <div className="hd-tool">
        <div className="hd-tool__head hd-m05-tool__static">
          {summary}
          <Icon name="chevron-right" size="sm" />
        </div>
      </div>
    )
  }
  return (
    <details className="hd-tool hd-m05-tool" open>
      <summary className="hd-tool__head">
        {summary}
        <Icon name="chevron-down" size="sm" />
      </summary>
      <Output lines={item.output} />
    </details>
  )
}

function ConversationRow({ item }: { readonly item: ConversationItem }) {
  switch (item.kind) {
    case 'agent':
      return (
        <div className="hd-msg-agent">
          {item.paragraphs.map((runs, index) => (
            <p key={index}>
              <Runs runs={runs} />
            </p>
          ))}
        </div>
      )
    case 'tool':
      return <ToolRow item={item} />
    case 'working':
      return (
        <div className="hd-working">
          <span
            className="hd-glyph hd-glyph--running is-animated"
            aria-hidden="true"
          />
          <span>{item.label}</span>
        </div>
      )
    case 'separator':
      return <div className="hd-turn-sep">{item.label}</div>
    default: {
      const unreachable: never = item
      return unreachable
    }
  }
}

function BubbleList({
  messages,
  onCancel,
}: {
  readonly messages: readonly QueuedMessageView[]
  readonly onCancel: (messageId: string) => void
}) {
  if (messages.length === 0) return null
  return (
    <QueuedMessageBubbles
      tail={{
        messages,
        settled: messages.filter((m) => !m.pinned),
        pinned: messages.filter((m) => m.pinned),
        outcome: null,
      }}
      onCancel={onCancel}
    />
  )
}

type MessagingProps = {
  readonly settled: readonly QueuedMessageView[]
  readonly pinned: readonly QueuedMessageView[]
  readonly outcome: string | null
  readonly onCancel: (messageId: string) => void
  readonly focusOutcomeSeq: number
}

/** Agent rows and tool rows for the M05 column — no speaker labels. */
export function ConversationItems({
  items,
  messaging,
}: {
  readonly items: readonly ConversationItem[]
  readonly messaging?: MessagingProps
}) {
  // Settled bubbles sit before the last working row (design lastIndexOf);
  // pinned bubbles and the outcome follow the live activity. Without a
  // working row there is no placement here (the column draws the tail).
  const workingIndex = messaging
    ? items.map((item) => item.kind).lastIndexOf('working')
    : -1
  if (!messaging || workingIndex < 0) {
    return (
      <>
        {items.map((item, index) => (
          <ConversationRow key={index} item={item} />
        ))}
      </>
    )
  }
  const rows: ReactNode[] = []

  for (let i = 0; i < workingIndex; i++) {
    rows.push(<ConversationRow key={i} item={items[i]!} />)
  }
  rows.push(
    <BubbleList
      key="msgq-settled"
      messages={messaging.settled}
      onCancel={messaging.onCancel}
    />,
  )
  rows.push(<ConversationRow key={workingIndex} item={items[workingIndex]!} />)
  for (let i = workingIndex + 1; i < items.length; i++) {
    rows.push(<ConversationRow key={i} item={items[i]!} />)
  }
  rows.push(
    <QueuedMessageBubbles
      key="msgq-pinned"
      tail={{
        messages: messaging.pinned,
        settled: [],
        pinned: messaging.pinned,
        outcome: messaging.outcome,
      }}
      onCancel={messaging.onCancel}
      focusOutcomeSeq={messaging.focusOutcomeSeq}
    />,
  )
  return <>{rows}</>
}
