import type { RuntimeFact, TaskStoreFact } from '../model'
import { Icon } from './Icon'
import { SkelLine } from './skeletonPrimitives'

const SECTION_STYLE = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
  marginTop: 'var(--space-6)',
} as const

const LABEL_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
} as const

function DoneGlyph() {
  return (
    <span className="hd-glyph hd-glyph--done" aria-hidden="true">
      <Icon name="check" size="sm" />
    </span>
  )
}

function runtimeText(runtime: RuntimeFact | null): string | null {
  if (runtime === null) return null
  return runtime.kind === 'ready'
    ? `Harflow runtime ${runtime.version} is ready`
    : 'Harflow runtime status is unknown'
}

export function SettingsRuntimeSection({
  loading,
  runtime,
  onUnavailable,
}: {
  readonly loading: boolean
  readonly runtime: RuntimeFact | null
  readonly onUnavailable: (label: string) => void
}) {
  return (
    <section aria-label="Harflow runtime" style={SECTION_STYLE}>
      <h2 className="label hd-faint" style={{ margin: 0, fontWeight: 500 }}>
        Harflow runtime
      </h2>
      <div className="hd-form-row" style={{ minHeight: 40 }}>
        <div className="hd-form-row__label">
          {loading ? (
            <SkelLine width={200} height={12} />
          ) : (
            <span style={LABEL_STYLE}>
              {runtime?.kind === 'ready' ? <DoneGlyph /> : null}
              {runtimeText(runtime)}
            </span>
          )}
        </div>
        <button
          type="button"
          className="hd-btn hd-btn--secondary"
          disabled={loading}
          aria-disabled={loading ? 'true' : undefined}
          onClick={() => onUnavailable('Check for updates')}
        >
          Check for updates
        </button>
      </div>
    </section>
  )
}

export function SettingsStoreSection({
  loading,
  taskStore,
  onUnavailable,
}: {
  readonly loading: boolean
  readonly taskStore: TaskStoreFact | null
  readonly onUnavailable: (label: string) => void
}) {
  return (
    <section aria-label="Task store" style={SECTION_STYLE}>
      <h2 className="label hd-faint" style={{ margin: 0, fontWeight: 500 }}>
        Task store
      </h2>
      <div className="hd-form-row" style={{ minHeight: 40 }}>
        <div className="hd-form-row__label">
          {loading ? (
            <SkelLine width={170} height={12} />
          ) : (
            <span style={LABEL_STYLE}>
              {taskStore?.kind === 'compatible' ? <DoneGlyph /> : null}
              {taskStore?.kind === 'compatible'
                ? 'Task store is compatible'
                : 'Task store compatibility is unknown'}
            </span>
          )}
        </div>
        <span style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            type="button"
            className="hd-btn hd-btn--secondary"
            disabled={loading}
            aria-disabled={loading ? 'true' : undefined}
            onClick={() => onUnavailable('Inspect task store')}
          >
            Inspect task store
          </button>
          <button
            type="button"
            className="hd-btn hd-btn--ghost"
            disabled={loading}
            aria-disabled={loading ? 'true' : undefined}
            onClick={() => onUnavailable('Show backup in Finder')}
          >
            Show backup in Finder
          </button>
        </span>
      </div>
    </section>
  )
}
