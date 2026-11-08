import { asHarnessId } from '../../model'
import type { DailyTaskBucket, HarnessStatisticsRow } from '../../model'

export function reportedSuccess(
  percent: number,
  failedCount: number,
  caption: string,
) {
  return { kind: 'reported' as const, percent, failedCount, caption }
}

function day(
  dateLabel: string,
  done: number,
  failed: number,
): DailyTaskBucket {
  return { dateLabel, done, failed }
}

/**
 * Build a harness row from explicit integer task/failure counts.
 * Success percent = Math.round(((tasks - failed) / tasks) * 100) when tasks > 0.
 * Zero-task rows suppress rate/median (valid zero ≠ unknown).
 */
function row(
  harnessId: string,
  label: string,
  tasks: number,
  failed: number,
  median: string,
  cost: HarnessStatisticsRow['cost'],
): HarnessStatisticsRow {
  if (tasks === 0) {
    return {
      harnessId: asHarnessId(harnessId),
      label,
      tasks: 0,
      successRate: {
        kind: 'suppressed',
        reason: 'No completed tasks in this range; rate not computed.',
      },
      medianDuration: {
        kind: 'suppressed',
        reason: 'No completed tasks in this range; median not computed.',
      },
      cost,
    }
  }
  const percent = Math.round(((tasks - failed) / tasks) * 100)
  return {
    harnessId: asHarnessId(harnessId),
    label,
    tasks,
    successRate: reportedSuccess(percent, failed, `${percent}%`),
    medianDuration: { kind: 'reported', display: median },
    cost,
  }
}

export function harnessRows30d(): readonly HarnessStatisticsRow[] {
  // Explicit task/failure integers; percents derived via Math.round.
  // Failures sum to the 30-day chart population (26).
  return [
    row('claude', 'Claude Code', 130, 8, '06:12', {
      kind: 'reported',
      amountUsd: 118.2,
    }),
    row('codex', 'Codex', 86, 10, '04:47', { kind: 'unavailable' }),
    row('opencode', 'Opencode', 38, 4, '05:30', {
      kind: 'reported',
      amountUsd: 64.2,
    }),
    row('vibe', 'Mistral Vibe', 18, 3, '03:58', { kind: 'unavailable' }),
    row('antigravity', 'Antigravity', 12, 1, '07:21', { kind: 'unavailable' }),
  ]
}

/** Harness task/failure counts sum to the 7-day chart population (76 / 7). */
export function harnessRows7d(): readonly HarnessStatisticsRow[] {
  return [
    row('claude', 'Claude Code', 37, 2, '05:40', {
      kind: 'reported',
      amountUsd: 42.1,
    }),
    row('codex', 'Codex', 22, 3, '04:10', { kind: 'unavailable' }),
    // Observed zero cost is intentional and distinct from unavailable.
    row('opencode', 'Opencode', 11, 1, '05:05', {
      kind: 'reported',
      amountUsd: 0,
    }),
    row('vibe', 'Mistral Vibe', 6, 1, '03:20', { kind: 'unavailable' }),
    // Valid zero task count for this range — not an unknown.
    row('antigravity', 'Antigravity', 0, 0, '—', { kind: 'unavailable' }),
  ]
}

export function daily30d(): readonly DailyTaskBucket[] {
  return [
    day('Oct 5', 6, 0),
    day('Oct 6', 8, 1),
    day('Oct 7', 10, 1),
    day('Oct 8', 10, 2),
    day('Oct 9', 4, 0),
    day('Oct 10', 3, 0),
    day('Oct 11', 9, 1),
    day('Oct 12', 12, 1),
    day('Oct 13', 12, 0),
    day('Oct 14', 8, 1),
    day('Oct 15', 12, 2),
    day('Oct 16', 7, 1),
    day('Oct 17', 5, 0),
    day('Oct 18', 4, 0),
    day('Oct 19', 10, 1),
    day('Oct 20', 10, 2),
    day('Oct 21', 14, 1),
    day('Oct 22', 9, 1),
    day('Oct 23', 11, 2),
    day('Oct 24', 6, 0),
    day('Oct 25', 4, 0),
    day('Oct 26', 6, 1),
    day('Oct 27', 9, 1),
    day('Oct 28', 10, 2),
    day('Oct 29', 13, 1),
    day('Oct 30', 11, 0),
    day('Oct 31', 8, 1),
    day('Nov 1', 14, 2),
    day('Nov 2', 7, 1),
    day('Nov 3', 6, 0),
  ]
}

export function daily7d(): readonly DailyTaskBucket[] {
  return daily30d().slice(-7)
}
