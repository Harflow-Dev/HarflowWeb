import type { ReactNode } from 'react'
import type { ChangesTag } from '../presentation/taskChangesTags'

type NoteTone = 'info' | 'warn'

export function ChangesPaneNote({
  tone,
  title,
  body,
  children,
}: {
  readonly tone: NoteTone
  readonly title: string
  readonly body?: string
  readonly children?: ReactNode
}) {
  return (
    <div className={`hd-m05-panenote hd-m05-panenote--${tone}`}>
      <strong>{title}</strong>
      {body ? <span>{body}</span> : null}
      {children}
    </div>
  )
}

export function ChangesAction({
  label,
  onUnavailable,
}: {
  readonly label: string
  readonly onUnavailable: (label: string) => void
}) {
  return (
    <button
      type="button"
      className="hd-btn hd-btn--secondary hd-btn--sm"
      onClick={() => onUnavailable(label)}
    >
      {label}
    </button>
  )
}

export function ChangesTagView({ tag }: { readonly tag: ChangesTag }) {
  return (
    <span className={`hd-m05-tag hd-m05-tag--${tag.tone}`}>{tag.label}</span>
  )
}

export function ChangesPaneSkelLines({ count }: { readonly count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="hd-m05-skel"
          style={{ width: `${88 - index * 11}%` }}
          aria-hidden="true"
        />
      ))}
    </>
  )
}
