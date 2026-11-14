import { Fragment } from 'react'
import type {
  ConversationItem,
  ConversationOutputLine,
  InlineRun,
} from '../model'
import { Icon } from './Icon'

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
  // The design draws a tool with output open and one without as a plain row.
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

/** Agent rows and tool rows for the M05 column — no speaker labels. */
export function ConversationItems({
  items,
}: {
  readonly items: readonly ConversationItem[]
}) {
  return (
    <>
      {items.map((item, index) => (
        <ConversationRow key={index} item={item} />
      ))}
    </>
  )
}
