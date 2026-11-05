import type { StatisticsObservation } from '../model'

const CHART_HEIGHT = 160

export function StatisticsChart({
  observation,
}: {
  readonly observation: StatisticsObservation
}) {
  const { daily, chartScaleMax, rangeLabel } = observation
  const aria = `Tasks per day for ${rangeLabel}, done and failed stacked, scale 0 to ${chartScaleMax}`
  return (
    <div className="hd-card" style={{ marginTop: 'var(--space-4)' }}>
      <div className="hd-row" style={{ marginBottom: 'var(--space-3)' }}>
        <h2 className="hd-card__title" style={{ margin: 0, flex: 1 }}>
          Tasks per day
        </h2>
        <span className="caption hd-muted hd-row" style={{ gap: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: 'var(--accent)',
              display: 'inline-block',
            }}
            aria-hidden="true"
          />
          Done
        </span>
        <span className="caption hd-muted hd-row" style={{ gap: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: 'var(--danger)',
              display: 'inline-block',
            }}
            aria-hidden="true"
          />
          Failed
        </span>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <ScaleLabels max={chartScaleMax} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            role="img"
            aria-label={aria}
            style={{ position: 'relative', height: CHART_HEIGHT + 16, paddingTop: 16 }}
          >
            <GridLine bottom={CHART_HEIGHT} />
            <GridLine bottom={CHART_HEIGHT / 2} />
            <GridLine bottom={0} />
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                height: CHART_HEIGHT,
              }}
            >
              {daily.map((bucket) => (
                <DayBar
                  key={bucket.dateLabel}
                  dateLabel={bucket.dateLabel}
                  done={bucket.done}
                  failed={bucket.failed}
                  scaleMax={chartScaleMax}
                />
              ))}
            </div>
          </div>
          <div
            className="caption hd-faint"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 6,
            }}
          >
            <span>{observation.chartAxisStart}</span>
            <span>{observation.chartAxisMid}</span>
            <span>{observation.chartAxisEnd}</span>
          </div>
        </div>
      </div>
      <table className="hd-sr">
        <caption>Tasks per day for {rangeLabel}</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Done</th>
            <th scope="col">Failed</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((bucket) => (
            <tr key={`a11y-${bucket.dateLabel}`}>
              <th scope="row">{bucket.dateLabel}</th>
              <td>{bucket.done}</td>
              <td>{bucket.failed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ScaleLabels({ max }: { readonly max: number }) {
  return (
    <div
      className="caption hd-faint hd-num"
      style={{ position: 'relative', width: 24, height: CHART_HEIGHT + 16, flex: 'none' }}
      aria-hidden="true"
    >
      <span style={{ position: 'absolute', right: 0, bottom: CHART_HEIGHT, transform: 'translateY(8px)' }}>
        {max}
      </span>
      <span style={{ position: 'absolute', right: 0, bottom: CHART_HEIGHT / 2, transform: 'translateY(8px)' }}>
        {max / 2}
      </span>
      <span style={{ position: 'absolute', right: 0, bottom: 0, transform: 'translateY(8px)' }}>
        0
      </span>
    </div>
  )
}

function GridLine({ bottom }: { readonly bottom: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom,
        borderTop: '1px solid var(--border)',
      }}
      aria-hidden="true"
    />
  )
}

function DayBar({
  dateLabel,
  done,
  failed,
  scaleMax,
}: {
  readonly dateLabel: string
  readonly done: number
  readonly failed: number
  readonly scaleMax: number
}) {
  const px = (count: number) => Math.round((count / scaleMax) * CHART_HEIGHT)
  const doneH = px(done)
  const failedH = px(failed)
  return (
    <div
      title={`${dateLabel}: ${done} done, ${failed} failed`}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        height: '100%',
        padding: '0 2px',
      }}
    >
      <div
        style={{
          height: failedH,
          background: 'var(--danger)',
          borderRadius: doneH === 0 ? '2px 2px 0 0' : undefined,
        }}
      />
      <div
        style={{
          height: doneH,
          background: 'var(--accent)',
          borderRadius: failedH === 0 ? '2px 2px 0 0' : undefined,
        }}
      />
    </div>
  )
}
