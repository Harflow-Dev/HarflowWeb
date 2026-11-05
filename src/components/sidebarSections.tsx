import type { SidebarData, TaskId } from '../model'
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
  activeTaskId = null,
  onOpenTask,
  onUnavailable,
}: {
  label: string
  count?: number
  rows: SidebarData['running']
  done?: boolean
  fill?: boolean
  coverageIncomplete?: boolean
  activeTaskId?: TaskId | null
  onOpenTask: (taskId: TaskId) => void
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
        {rows.map((row) => {
          const mapped = row.mappedTaskId
          const active = mapped !== null && mapped === activeTaskId
          if (mapped) {
            return (
              <button
                key={row.id}
                type="button"
                className={
                  active
                    ? done
                      ? 'hd-task-row hd-task-row--done is-active'
                      : 'hd-task-row is-active'
                    : done
                      ? 'hd-task-row hd-task-row--done'
                      : 'hd-task-row'
                }
                aria-current={active ? 'page' : undefined}
                onClick={() => onOpenTask(mapped)}
              >
                <Glyph glyph={row.glyph} label={glyphLabel(row.glyph)} />
                <span className="hd-task-row__title">{row.title}</span>
                <span className="hd-task-row__meta">{row.meta}</span>
              </button>
            )
          }
          return (
            <button
              key={row.id}
              type="button"
              className={done ? 'hd-task-row hd-task-row--done' : 'hd-task-row'}
              title="Unavailable in this slice"
              aria-label={`${row.title} (unavailable in this slice)`}
              onClick={() => onUnavailable(row.title)}
            >
              <Glyph glyph={row.glyph} label={glyphLabel(row.glyph)} />
              <span className="hd-task-row__title" aria-hidden="true">
                {row.title}
              </span>
              <span className="hd-task-row__meta" aria-hidden="true">
                {row.meta}
              </span>
            </button>
          )
        })}
        {coverageIncomplete ? (
          <div className="hd-sidebar__more" role="status">
            Incomplete coverage
          </div>
        ) : null}
      </div>
    </section>
  )
}
