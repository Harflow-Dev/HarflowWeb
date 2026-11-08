/** Visible-row scroll anchor — mirrors Design 854caae d2bTranscript controller. */

export type VisibleAnchor = {
  readonly id: string
  readonly offset: number
}

export function captureVisibleAnchor(
  history: HTMLElement | null,
): VisibleAnchor | null {
  if (!history) return null
  const bounds = history.getBoundingClientRect()
  const visible = Array.from(
    history.querySelectorAll<HTMLElement>('[data-row]'),
  ).find((row) => {
    const rect = row.getBoundingClientRect()
    return rect.bottom > bounds.top && rect.top < bounds.bottom
  })
  if (!visible) return null
  return {
    id: visible.dataset.row ?? '',
    offset: visible.getBoundingClientRect().top - bounds.top,
  }
}

export function restoreVisibleAnchor(
  history: HTMLElement | null,
  anchor: VisibleAnchor | null,
  onMiss?: (message: string) => void,
  onClamped?: (message: string) => void,
  baseMessage = '',
): void {
  if (!history) return
  const row =
    anchor &&
    Array.from(history.querySelectorAll<HTMLElement>('[data-row]')).find(
      (candidate) => candidate.dataset.row === anchor.id,
    )
  if (!row) {
    history.scrollTop = 0
    onMiss?.(
      `${baseMessage} The retained row is outside this view; showing the history boundary.`.trim(),
    )
    return
  }
  const target =
    history.scrollTop +
    row.getBoundingClientRect().top -
    history.getBoundingClientRect().top -
    anchor.offset
  history.scrollTop = target
  if (Math.abs(history.scrollTop - target) > 1) {
    onClamped?.(
      `${baseMessage} The view edge limited the retained offset.`.trim(),
    )
  }
}

export type FocusAfterAction =
  | { readonly kind: 'action'; readonly action: string }
  | { readonly kind: 'boundary' }
  | { readonly kind: 'row'; readonly anchorId: string }
  | { readonly kind: 'request' }
  | { readonly kind: 'scroll-end-new' }

export function focusTargetFor(
  action: string,
): FocusAfterAction {
  switch (action) {
    case 'earlier':
      return { kind: 'action', action: 'earlier' }
    case 'new':
      return { kind: 'scroll-end-new' }
    case 'rebase':
      return { kind: 'boundary' }
    case 'read-more':
    case 'retry-request':
      return { kind: 'request' }
    default:
      return { kind: 'action', action }
  }
}

export function applyFocusAfterAction(
  host: ParentNode,
  history: HTMLElement | null,
  target: FocusAfterAction,
): void {
  const focusOpts = { preventScroll: true } as const
  if (target.kind === 'scroll-end-new' && history) {
    history.scrollTop = history.scrollHeight
    const row = host.querySelector<HTMLElement>('[data-row="new"]')
    row?.setAttribute('tabindex', '-1')
    row?.focus(focusOpts)
    return
  }
  if (target.kind === 'boundary') {
    if (history) history.scrollTop = 0
    host.querySelector<HTMLElement>('[data-d2b-boundary]')?.focus(focusOpts)
    return
  }
  if (target.kind === 'request') {
    const requestTarget =
      host.querySelector<HTMLElement>('[data-copy-text]') ??
      host.querySelector<HTMLElement>('[data-disclosure="request"] summary')
    requestTarget?.focus(focusOpts)
    return
  }
  if (target.kind === 'row') {
    host
      .querySelector<HTMLElement>(`[data-row="${target.anchorId}"]`)
      ?.focus(focusOpts)
    return
  }
  if (target.kind === 'action') {
    const same = host.querySelector<HTMLElement>(
      `[data-action="${target.action}"]`,
    )
    if (same) {
      same.focus(focusOpts)
      return
    }
  }
  host.querySelector<HTMLElement>('[data-d2b-boundary]')?.focus(focusOpts)
}
