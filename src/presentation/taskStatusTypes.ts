export type TaskCommandChrome =
  | null
  | 'stop-requested'
  | 'continue-starting'
  | 'continue-started'
  /** Continue answered with no reliable report; a successor may exist. */
  | 'continue-unknown'

export type TaskStatusBadgeTone =
  | 'running'
  | 'warning'
  | 'done'
  | 'failed'
  | 'neutral'

export type TaskStatusBadgeGlyph =
  | 'spin'
  | 'check'
  | 'x'
  | 'clock'
  | 'alert'
  | 'stop'
  | 'queued'
  | 'none'

export type TaskStatusBadge = {
  readonly tone: TaskStatusBadgeTone
  readonly glyph: TaskStatusBadgeGlyph
  readonly label: string
}

export type TaskStatusNotice = {
  readonly tone: 'info' | 'warning'
  readonly title: string
  readonly body: string
  readonly actionLabel?: string
}

export type TaskStatusBannerActionKind =
  | 'continue'
  | 'copyResume'
  | 'stop'
  | 'refresh'
  | 'openEvents'
  | 'checkNewTask'
  | 'starting'

/** Button emphasis as drawn: secondary is bordered, ghost is bare. */
export type TaskStatusActionVariant = 'secondary' | 'ghost' | 'danger'

export type TaskStatusBannerAction = {
  readonly kind: TaskStatusBannerActionKind
  readonly label: string
  readonly variant: TaskStatusActionVariant
  /** Drawn disabled (dimmed), as opposed to merely unavailable in the mock. */
  readonly disabled?: boolean
}

export type TaskStatusBannerBody =
  | { readonly kind: 'text'; readonly value: string }
  | {
      readonly kind: 'lastError'
      readonly intro: string
      readonly error: string
    }

export type TaskStatusBanner = {
  readonly tone: 'default' | 'warning'
  readonly title: string
  readonly body: readonly TaskStatusBannerBody[]
  readonly actions: readonly TaskStatusBannerAction[]
  readonly caption?: string
}

export type TaskComposerStopMode = 'hidden' | 'stop' | 'stopping'

export type TaskStatusComposer = {
  readonly placeholder: string
  readonly locked: boolean
  readonly hint: string
  readonly stopMode: TaskComposerStopMode
}

/** Which surface fills the task column below the top bar. */
export type TaskStatusBody =
  | { readonly kind: 'transcript' }
  | { readonly kind: 'conversation' }
  | {
      readonly kind: 'notStarted'
      readonly requestNote: string
      readonly emptyNote: string
    }

export type TaskStatusResourceCard = {
  readonly title: string
  readonly detail: string
  /** Null draws no note line (hold age unknown). */
  readonly note: string | null
  readonly linkLabel: string
}

export type TaskStatusView = {
  readonly badge: TaskStatusBadge
  /** Top-bar meta line; null when the design draws none (pending). */
  readonly meta: string | null
  readonly body: TaskStatusBody
  readonly resourceCard: TaskStatusResourceCard | null
  readonly notice: TaskStatusNotice | null
  readonly banner: TaskStatusBanner | null
  readonly composer: TaskStatusComposer
}