export type TaskCommandChrome =
  | null
  | 'stop-requested'
  | 'continue-starting'
  | 'continue-started'

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
  | 'newTask'
  | 'starting'

export type TaskStatusBannerAction = {
  readonly kind: TaskStatusBannerActionKind
  readonly label: string
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

export type TaskStatusView = {
  readonly badge: TaskStatusBadge
  readonly notice: TaskStatusNotice | null
  readonly banner: TaskStatusBanner | null
  readonly composer: TaskStatusComposer
}