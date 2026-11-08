import type { HarnessQualificationFact, SettingsHarnessFact } from '../model'
import { harnessQualificationLabel } from '../model'
import { Icon } from './Icon'

export function QualificationSection({
  harnesses,
}: {
  readonly harnesses: readonly SettingsHarnessFact[]
}) {
  return (
    <section
      aria-label="Harness qualification"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        marginTop: 'var(--space-4)',
      }}
    >
      <h2 className="label hd-faint" style={{ margin: 0, fontWeight: 500 }}>
        Harness qualification
      </h2>
      {harnesses.map((row) => (
        <div key={row.id} className="hd-form-row" style={{ minHeight: 28 }}>
          <span style={{ width: 180, flex: 'none', fontWeight: 500 }}>
            {row.label}
          </span>
          <QualificationFact fact={row.qualification} />
        </div>
      ))}
    </section>
  )
}

function QualificationFact({
  fact,
}: {
  readonly fact: HarnessQualificationFact
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        flex: 1,
        color: 'var(--text-secondary)',
      }}
    >
      <QualificationMark fact={fact} />
      {harnessQualificationLabel(fact)}
    </span>
  )
}

function QualificationMark({
  fact,
}: {
  readonly fact: HarnessQualificationFact
}) {
  if (fact.kind === 'ready') {
    return (
      <span className="hd-glyph hd-glyph--done" aria-hidden="true">
        <Icon name="check" size="sm" />
      </span>
    )
  }
  if (fact.kind === 'attention') {
    return (
      <span className="hd-glyph hd-glyph--attention" aria-hidden="true">
        <Icon name="alert" size="sm" />
      </span>
    )
  }
  if (fact.kind === 'not-qualified') {
    return (
      <span className="hd-glyph hd-glyph--cancelled" aria-hidden="true">
        <Icon name="x" size="sm" />
      </span>
    )
  }
  return null
}
