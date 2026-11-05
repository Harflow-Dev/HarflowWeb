import type {
  InstalledResourceHarness,
  NotInstalledResourceHarness,
  ResourceHarnessCard,
  ResourcesObservation,
  ResourceWaitingTask,
} from '../model'
import { Icon } from './Icon'

type Props = {
  readonly observation: ResourcesObservation
  readonly onUnavailable: (label: string) => void
}

export function ResourcesPage({ observation, onUnavailable }: Props) {
  return (
    <div className="hd-page">
      <div className="hd-page__head">
        <h1 className="hd-page__title">Resources</h1>
      </div>
      <p
        className="hd-muted"
        style={{ margin: 'calc(-1 * var(--space-3)) 0 var(--space-5)' }}
      >
        Slots limit how many tasks each harness runs at once. A task waits for a
        free slot before it starts.
      </p>
      <div className="hd-grid hd-grid--2">
        {observation.harnesses.map((card) => (
          <HarnessCard
            key={card.harnessId}
            card={card}
            onUnavailable={onUnavailable}
          />
        ))}
      </div>
      <h2 className="heading" style={{ margin: 'var(--space-6) 0 var(--space-2)' }}>
        Waiting for a slot
      </h2>
      <div className="hd-list" role="list">
        {observation.waiting.map((row) => (
          <WaitingRow key={row.id} row={row} onUnavailable={onUnavailable} />
        ))}
      </div>
    </div>
  )
}

function HarnessCard({
  card,
  onUnavailable,
}: {
  card: ResourceHarnessCard
  onUnavailable: (label: string) => void
}) {
  if (card.kind === 'not_installed') {
    return <NotInstalledCard card={card} onUnavailable={onUnavailable} />
  }
  return <InstalledCard card={card} onUnavailable={onUnavailable} />
}

function InstalledCard({
  card,
  onUnavailable,
}: {
  card: InstalledResourceHarness
  onUnavailable: (label: string) => void
}) {
  const full = card.used >= card.capacity
  const value = `${card.used} of ${card.capacity} in use`
  return (
    <section
      className="hd-card"
      aria-label={card.label}
      data-testid={`resource-card-${card.harnessId}`}
    >
      <div className={full ? 'hd-meter hd-meter--full' : 'hd-meter'}>
        <div className="hd-meter__head">
          <span className="hd-meter__name">{card.label}</span>
          {card.waitingCount > 0 ? (
            <span className="hd-badge hd-badge--warning">
              {card.waitingCount} waiting
            </span>
          ) : null}
          <span className="hd-meter__value">{value}</span>
        </div>
        <MeterCells
          capacity={card.capacity}
          used={card.used}
          waitingCount={card.waitingCount}
          label={value}
        />
      </div>
      <div style={{ marginTop: 'var(--space-3)' }}>
        {card.holders.length === 0 ? (
          <div className="caption hd-faint" style={{ padding: '0 var(--space-2)' }}>
            No tasks holding a slot.
          </div>
        ) : (
          card.holders.map((holder) => (
            <button
              key={holder.id}
              type="button"
              className="hd-task-row"
              aria-label={`${holder.title} (unavailable in this slice)`}
              title="Unavailable in this slice"
              onClick={() => onUnavailable(holder.title)}
            >
              <span className="hd-glyph hd-glyph--running" aria-label="Running" />
              <span className="hd-task-row__title">{holder.title}</span>
              <span className="hd-task-row__meta">{holder.meta}</span>
            </button>
          ))
        )}
      </div>
    </section>
  )
}

function NotInstalledCard({
  card,
  onUnavailable,
}: {
  card: NotInstalledResourceHarness
  onUnavailable: (label: string) => void
}) {
  return (
    <section
      className="hd-card"
      aria-label={card.label}
      style={{ opacity: 0.75 }}
      data-testid={`resource-card-${card.harnessId}`}
    >
      <div className="hd-meter">
        <div className="hd-meter__head">
          <span className="hd-meter__name">{card.label}</span>
          <span className="hd-meter__value">Not installed</span>
        </div>
        <div className="hd-meter__cells" aria-hidden="true">
          <span className="hd-meter__cell" />
          <span className="hd-meter__cell" />
        </div>
      </div>
      <div style={{ marginTop: 'var(--space-3)', padding: '0 var(--space-2)' }}>
        <button
          type="button"
          className="hd-btn hd-btn--secondary hd-btn--sm"
          aria-label={`Install ${card.label} (unavailable in this slice)`}
          title="Install — unavailable in this slice"
          onClick={() => onUnavailable(`Install ${card.label}`)}
        >
          <Icon name="external" size="sm" />
          Install
        </button>
      </div>
    </section>
  )
}

function MeterCells({
  capacity,
  used,
  waitingCount,
  label,
}: {
  capacity: number
  used: number
  waitingCount: number
  label: string
}) {
  const free = Math.max(0, capacity - used)
  const cells: Array<'used' | 'free' | 'waiting'> = []
  for (let i = 0; i < used; i++) cells.push('used')
  for (let i = 0; i < free; i++) cells.push('free')
  for (let i = 0; i < waitingCount; i++) cells.push('waiting')
  return (
    <div className="hd-meter__cells" role="img" aria-label={label}>
      {cells.map((kind, index) => (
        <span
          key={`${kind}-${index}`}
          className={
            kind === 'used'
              ? 'hd-meter__cell is-used'
              : kind === 'waiting'
                ? 'hd-meter__cell is-waiting'
                : 'hd-meter__cell'
          }
        />
      ))}
    </div>
  )
}

function WaitingRow({
  row,
  onUnavailable,
}: {
  row: ResourceWaitingTask
  onUnavailable: (label: string) => void
}) {
  return (
    <div className="hd-list-row" role="listitem">
      <span className="hd-glyph hd-glyph--queued" aria-hidden="true" />
      <span className="hd-list-row__body">
        <span className="hd-list-row__title">{row.title}</span>
        <span className="hd-list-row__desc">{row.detail}</span>
      </span>
      <span className="hd-list-row__meta">{row.waitedMeta}</span>
      <span className="hd-list-row__actions">
        <button
          type="button"
          className="hd-btn hd-btn--ghost hd-btn--sm"
          aria-label={`Open task ${row.title} (unavailable in this slice)`}
          title="Open task — unavailable in this slice"
          onClick={() => onUnavailable(row.title)}
        >
          Open task
        </button>
      </span>
    </div>
  )
}
