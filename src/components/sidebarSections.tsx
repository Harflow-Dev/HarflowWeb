import type { SidebarData } from '../model'
import { Glyph } from './Glyph'

function glyphLabel(glyph: SidebarData['running'][number]['glyph']): string {
  switch (glyph) {
    case 'running':
      return 'Running'
    case 'parallel':
      return 'Parallel group, running'
    case 'attention':
      return 'Needs you'
    case 'done':
      return 'Done'
    case 'failed':
      return 'Failed'
    case 'cancelled':
      return 'Cancelled'
    case 'workflow':
      return 'Workflow'
    default:
      return 'Task'
  }
}

export function TaskSection({
  label,
  count,
  rows,
  done = false,
  fill = false,
  coverageIncomplete = false,
  onUnavailable,
}: {
  label: string
  count?: number
  rows: SidebarData['running']
  done?: boolean
  fill?: boolean
  coverageIncomplete?: boolean
  onUnavailable: (label: string) => void
}) {
  return (
    <section
      className={fill ? 'hd-section hd-section--fill' : 'hd-section'}
      aria-label={label}
    >
      <div className="hd-section__head">
        {label}{' '}
        {count !== undefined && count > 0 ? (
          <span className="hd-section__count">{count}</span>
        ) : null}
      </div>
      <div className="hd-section__list">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            className={done ? 'hd-task-row hd-task-row--done' : 'hd-task-row'}
            title="Unavailable in this slice"
            onClick={() => onUnavailable(row.title)}
          >
            <Glyph glyph={row.glyph} label={glyphLabel(row.glyph)} />
            <span className="hd-task-row__title">{row.title}</span>
            <span className="hd-task-row__meta">{row.meta}</span>
          </button>
        ))}
        {coverageIncomplete ? (
          <div className="hd-sidebar__more" role="status">
            Incomplete coverage
          </div>
        ) : null}
      </div>
    </section>
  )
}
