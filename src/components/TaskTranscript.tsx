import { useState, type ReactNode } from 'react'
import type {
  AgentSegment,
  InlineRun,
  ToolBodyLine,
  ToolSummaryPart,
  TranscriptBlock,
} from '../model'
import { Icon, type IconName } from './Icon'

type Props = {
  readonly blocks: readonly TranscriptBlock[]
  readonly footer?: ReactNode
}

export function TaskTranscript({ blocks, footer }: Props) {
  return (
    <div className="hd-transcript">
      {blocks.map((block) => (
        <TranscriptItem key={block.id} block={block} />
      ))}
      {footer ?? null}
    </div>
  )
}

function TranscriptItem({ block }: { readonly block: TranscriptBlock }) {
  switch (block.kind) {
    case 'user':
      return <div className="hd-msg-user">{block.text}</div>
    case 'agent':
      return (
        <div className="hd-msg-agent">
          {block.segments.map((segment, index) => (
            <AgentSegmentView key={`${block.id}-${index}`} segment={segment} />
          ))}
        </div>
      )
    case 'tool':
      return <ToolBlock block={block} />
    case 'working':
      return (
        <div className="hd-working">
          <span
            className="hd-glyph hd-glyph--running is-animated"
            aria-hidden="true"
          />
          <span>{block.label}</span>
        </div>
      )
    default:
      return null
  }
}

function AgentSegmentView({ segment }: { readonly segment: AgentSegment }) {
  if (segment.kind === 'paragraph') {
    return <p>{segment.runs.map((run, i) => inlineNode(run, i))}</p>
  }
  return (
    <ul>
      {segment.items.map((item, index) => (
        <li key={index}>{item.map((run, i) => inlineNode(run, i))}</li>
      ))}
    </ul>
  )
}

function inlineNode(run: InlineRun, key: number) {
  if (run.kind === 'code') {
    return <code key={key}>{run.value}</code>
  }
  return <span key={key}>{run.value}</span>
}

function ToolBlock({
  block,
}: {
  readonly block: Extract<TranscriptBlock, { kind: 'tool' }>
}) {
  const [expanded, setExpanded] = useState(block.initiallyExpanded)
  const canExpand = block.bodyLines !== null
  const iconName: IconName = block.icon
  return (
    <div className="hd-tool">
      <button
        type="button"
        className="hd-tool__head"
        aria-expanded={canExpand ? expanded : undefined}
        aria-controls={canExpand ? `${block.id}-body` : undefined}
        onClick={() => {
          if (canExpand) setExpanded((value) => !value)
        }}
      >
        <Icon name={iconName} size="sm" />
        <span className="hd-tool__summary">
          {block.summary.map((part, i) => summaryNode(part, i))}
        </span>
        <span className="hd-tool__meta">{block.meta}</span>
        <Icon name={expanded && canExpand ? 'chevron-down' : 'chevron-right'} size="sm" />
      </button>
      {canExpand && expanded && block.bodyLines ? (
        <div className="hd-tool__body" id={`${block.id}-body`}>
          {block.bodyLines.map((line, index) => (
            <ToolBodyLineView key={index} line={line} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ToolBodyLineView({ line }: { readonly line: ToolBodyLine }) {
  const prefix = line.boldPrefix
  if (!prefix) {
    return (
      <>
        {line.text}
        {'\n'}
      </>
    )
  }
  if (line.text.startsWith(prefix)) {
    return (
      <>
        <b>{prefix}</b>
        {line.text.slice(prefix.length)}
        {'\n'}
      </>
    )
  }
  return (
    <>
      <b>{line.text}</b>
      {'\n'}
    </>
  )
}

function summaryNode(part: ToolSummaryPart, key: number) {
  switch (part.kind) {
    case 'code':
      return <code key={key}>{part.value}</code>
    case 'added':
      return (
        <span key={key} style={{ color: 'var(--success)' }}>
          {part.value}
        </span>
      )
    case 'removed':
      return (
        <span key={key} style={{ color: 'var(--danger)' }}>
          {part.value}
        </span>
      )
    default:
      return <span key={key}>{part.value}</span>
  }
}
