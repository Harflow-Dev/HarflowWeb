import type { RoutePoint } from './workflowRouteTypes'

type Segment = { readonly low: number; readonly high: number; readonly forward: boolean }

type Occupancy = {
  readonly horizontal: ReadonlyMap<number, readonly Segment[]>
  readonly vertical: ReadonlyMap<number, readonly Segment[]>
  readonly rows: readonly number[]
  readonly columns: readonly number[]
  readonly tipsByRow: ReadonlyMap<number, readonly RoutePoint[]>
  readonly tipsByColumn: ReadonlyMap<number, readonly RoutePoint[]>
  readonly tipRows: readonly number[]
  readonly tipColumns: readonly number[]
}

/** Same-direction sharing is cheap. Opposing traffic and arrowhead crossings are not. */
export function occupancyCost(
  start: RoutePoint,
  finish: RoutePoint,
  occupied: readonly (readonly RoutePoint[])[],
): number {
  return costAgainst(start, finish, buildOccupancy(occupied))
}

export function buildOccupancy(paths: readonly (readonly RoutePoint[])[]): Occupancy {
  const horizontal = new Map<number, Segment[]>()
  const vertical = new Map<number, Segment[]>()
  const tipsByRow = new Map<number, RoutePoint[]>()
  const tipsByColumn = new Map<number, RoutePoint[]>()
  for (const path of paths) {
    for (let index = 1; index < path.length; index += 1) {
      const startPoint = path[index - 1]
      const endPoint = path[index]
      if (!startPoint || !endPoint) continue
      pushSegment(startPoint, endPoint, horizontal, vertical)
    }
    const tip = path[path.length - 1]
    if (tip) {
      tipsByRow.set(tip.y, [...(tipsByRow.get(tip.y) ?? []), tip])
      tipsByColumn.set(tip.x, [...(tipsByColumn.get(tip.x) ?? []), tip])
    }
  }
  return {
    horizontal,
    vertical,
    rows: [...horizontal.keys()].sort((left, right) => left - right),
    columns: [...vertical.keys()].sort((left, right) => left - right),
    tipsByRow,
    tipsByColumn,
    tipRows: [...tipsByRow.keys()].sort((left, right) => left - right),
    tipColumns: [...tipsByColumn.keys()].sort((left, right) => left - right),
  }
}

function pushSegment(
  start: RoutePoint,
  finish: RoutePoint,
  horizontal: Map<number, Segment[]>,
  vertical: Map<number, Segment[]>,
): void {
  if (start.y === finish.y) {
    const list = horizontal.get(start.y) ?? []
    list.push({
      low: Math.min(start.x, finish.x),
      high: Math.max(start.x, finish.x),
      forward: finish.x > start.x,
    })
    horizontal.set(start.y, list)
    return
  }
  const list = vertical.get(start.x) ?? []
  list.push({
    low: Math.min(start.y, finish.y),
    high: Math.max(start.y, finish.y),
    forward: finish.y > start.y,
  })
  vertical.set(start.x, list)
}

function costAgainst(start: RoutePoint, finish: RoutePoint, occupancy: Occupancy): number {
  const horizontal = start.y === finish.y
  const low = Math.min(horizontal ? start.x : start.y, horizontal ? finish.x : finish.y)
  const high = Math.max(horizontal ? start.x : start.y, horizontal ? finish.x : finish.y)
  const parallel = horizontal ? occupancy.horizontal.get(start.y) : occupancy.vertical.get(start.x)
  let cost = overlapCost(parallel ?? [], low, high, horizontal ? finish.x > start.x : finish.y > start.y)
  const crossed = selected(horizontal ? occupancy.columns : occupancy.rows, low, high)
  const perpendicular = horizontal ? occupancy.vertical : occupancy.horizontal
  const fixed = horizontal ? start.y : start.x
  for (const coordinate of crossed) {
    for (const segment of perpendicular.get(coordinate) ?? []) {
      if (fixed >= segment.low && fixed <= segment.high) cost += 4
    }
  }
  cost += tipCost(start, finish, horizontal, low, high, occupancy)
  return cost
}

function overlapCost(
  segments: readonly Segment[],
  low: number,
  high: number,
  forward: boolean,
): number {
  let cost = 0
  for (const segment of segments) {
    const overlap = Math.max(0, Math.min(high, segment.high) - Math.max(low, segment.low))
    cost += overlap * (forward === segment.forward ? 0.5 : 4)
  }
  return cost
}

function tipCost(
  start: RoutePoint,
  finish: RoutePoint,
  horizontal: boolean,
  low: number,
  high: number,
  occupancy: Occupancy,
): number {
  const coordinates = selected(
    horizontal ? occupancy.tipRows : occupancy.tipColumns,
    horizontal ? start.y - 7 : start.x - 3,
    horizontal ? start.y + 7 : start.x + 9,
  )
  const tips = horizontal ? occupancy.tipsByRow : occupancy.tipsByColumn
  let cost = 0
  for (const coordinate of coordinates) {
    for (const tip of tips.get(coordinate) ?? []) {
      if (horizontal && finish.x > start.x && start.y === tip.y && finish.x <= tip.x) continue
      const intersects = horizontal
        ? start.y > tip.y - 7 && start.y < tip.y + 7 && high > tip.x - 9 && low < tip.x + 3
        : start.x > tip.x - 9 && start.x < tip.x + 3 && high > tip.y - 7 && low < tip.y + 7
      if (intersects) cost += 160
    }
  }
  return cost
}

function selected(coordinates: readonly number[], low: number, high: number): number[] {
  let lower = 0
  let upper = coordinates.length
  while (lower < upper) {
    const middle = Math.floor((lower + upper) / 2)
    if ((coordinates[middle] ?? 0) < low) lower = middle + 1
    else upper = middle
  }
  const start = lower
  upper = coordinates.length
  while (lower < upper) {
    const middle = Math.floor((lower + upper) / 2)
    if ((coordinates[middle] ?? 0) <= high) lower = middle + 1
    else upper = middle
  }
  return coordinates.slice(start, lower)
}
