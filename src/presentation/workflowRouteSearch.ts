import { routeClear } from './workflowRouteClear'
import { occupancyCost } from './workflowRouteOccupancy'
import {
  ROUTE_EXPANSION_LIMIT,
  ROUTE_SPACING,
  routeDistance,
  type RoutePoint,
  type RouteRect,
} from './workflowRouteTypes'

type GridState = { readonly x: number; readonly y: number; readonly direction: number }

const DIRECTIONS: readonly (readonly [number, number])[] = [
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, 0],
]

/** Bounded orthogonal search. Returns null when no corridor exists within the expansion limit. */
export function searchRoute(
  start: RoutePoint,
  finish: RoutePoint,
  obstacles: readonly RouteRect[],
  occupied: readonly (readonly RoutePoint[])[],
  sourceBoundary: number | null,
): RoutePoint[] | null {
  const samples = [start.x, start.y, finish.x, finish.y]
  for (const rectangle of obstacles) {
    samples.push(rectangle.x, rectangle.x + rectangle.width, rectangle.y, rectangle.y + rectangle.height)
  }
  if (samples.some((value) => !Number.isFinite(value) || Math.abs(value) > 1_000_000)) return null
  const minX = Math.min(0, start.x, finish.x)
  const minY = Math.min(0, start.y, finish.y)
  const xCoordinates = lanes(start.x, finish.x, minX, obstacles, occupied, true)
  const yCoordinates = lanes(start.y, finish.y, minY, obstacles, occupied, false)
  const origin = indexOf(xCoordinates, start.x, yCoordinates, start.y)
  const goal = indexOf(xCoordinates, finish.x, yCoordinates, finish.y)
  if (!origin || !goal) return null
  return walk(origin, goal, xCoordinates, yCoordinates, obstacles, occupied, sourceBoundary)
}

function lanes(
  start: number,
  finish: number,
  minimum: number,
  obstacles: readonly RouteRect[],
  occupied: readonly (readonly RoutePoint[])[],
  horizontal: boolean,
): number[] {
  const values = new Set<number>([start, finish, minimum])
  for (const rectangle of obstacles) {
    const low = horizontal ? rectangle.x : rectangle.y
    const high = low + (horizontal ? rectangle.width : rectangle.height)
    values.add(Math.floor(low / ROUTE_SPACING) * ROUTE_SPACING)
    values.add(Math.ceil(high / ROUTE_SPACING) * ROUTE_SPACING)
  }
  for (const path of occupied) {
    for (const point of path) {
      const coordinate = horizontal ? point.x : point.y
      values.add(Math.floor(coordinate / ROUTE_SPACING) * ROUTE_SPACING - ROUTE_SPACING)
      values.add(Math.ceil(coordinate / ROUTE_SPACING) * ROUTE_SPACING + ROUTE_SPACING)
    }
  }
  return [...values].filter((value) => value >= minimum).sort((left, right) => left - right)
}

function indexOf(
  xCoordinates: readonly number[],
  x: number,
  yCoordinates: readonly number[],
  y: number,
): GridState | null {
  const xIndex = xCoordinates.indexOf(x)
  const yIndex = yCoordinates.indexOf(y)
  if (xIndex < 0 || yIndex < 0) return null
  return { x: xIndex, y: yIndex, direction: 0 }
}

function walk(
  origin: GridState,
  goal: { readonly x: number; readonly y: number },
  xCoordinates: readonly number[],
  yCoordinates: readonly number[],
  obstacles: readonly RouteRect[],
  occupied: readonly (readonly RoutePoint[])[],
  sourceBoundary: number | null,
): RoutePoint[] | null {
  const point = (state: GridState): RoutePoint => ({
    x: xCoordinates[state.x] ?? 0,
    y: yCoordinates[state.y] ?? 0,
  })
  const blocked = new Map<string, boolean>()
  const inside = (state: GridState): boolean => {
    const key = `${state.x}:${state.y}`
    const known = blocked.get(key)
    if (known !== undefined) return known
    const position = point(state)
    const value = obstacles.some((rectangle) => contains(position, rectangle))
    blocked.set(key, value)
    return value
  }
  if (inside(origin) || inside({ x: goal.x, y: goal.y, direction: 0 })) return null
  return explore(
    origin,
    goal,
    point,
    inside,
    xCoordinates.length,
    yCoordinates.length,
    obstacles,
    occupied,
    sourceBoundary,
  )
}

function explore(
  origin: GridState,
  goal: { readonly x: number; readonly y: number },
  point: (state: GridState) => RoutePoint,
  inside: (state: GridState) => boolean,
  xCount: number,
  yCount: number,
  obstacles: readonly RouteRect[],
  occupied: readonly (readonly RoutePoint[])[],
  sourceBoundary: number | null,
): RoutePoint[] | null {
  const finish = point({ x: goal.x, y: goal.y, direction: 0 })
  const costs = new Map<string, number>([[key(origin), 0]])
  const parents = new Map<string, GridState>()
  const transitions = new Map<string, number>()
  const frontier = new RouteHeap()
  let serial = 0
  frontier.push({ state: origin, cost: 0, score: routeDistance(point(origin), finish), serial })
  let best: { state: GridState; cost: number } | null = null
  let expansions = 0
  while (frontier.size > 0 && expansions < ROUTE_EXPANSION_LIMIT) {
    const entry = frontier.pop()
    if (!entry || costs.get(key(entry.state)) !== entry.cost) continue
    if (best && entry.score >= best.cost) break
    expansions += 1
    if (entry.state.x === goal.x && entry.state.y === goal.y && entry.state.direction !== 3) {
      const cost = entry.cost + (entry.state.direction === 0 ? 0 : 12)
      if (!best || cost < best.cost) best = { state: entry.state, cost }
      continue
    }
    serial = expand({
      entry,
      serial,
      costs,
      parents,
      transitions,
      frontier,
      point,
      inside,
      xCount,
      yCount,
      obstacles,
      occupied,
      sourceBoundary,
      finish,
    })
  }
  if (!best) return null
  return reconstruct(best.state, parents).map(point)
}

function expand(input: {
  readonly entry: { readonly state: GridState; readonly cost: number }
  readonly serial: number
  readonly costs: Map<string, number>
  readonly parents: Map<string, GridState>
  readonly transitions: Map<string, number>
  readonly frontier: RouteHeap
  readonly point: (state: GridState) => RoutePoint
  readonly inside: (state: GridState) => boolean
  readonly xCount: number
  readonly yCount: number
  readonly obstacles: readonly RouteRect[]
  readonly occupied: readonly (readonly RoutePoint[])[]
  readonly sourceBoundary: number | null
  readonly finish: RoutePoint
}): number {
  let nextSerial = input.serial
  const entry = input.entry
  DIRECTIONS.forEach((offset, direction) => {
    const next = {
      x: entry.state.x + (offset[0] ?? 0),
      y: entry.state.y + (offset[1] ?? 0),
      direction,
    }
    if (next.x < 0 || next.y < 0 || next.x >= input.xCount || next.y >= input.yCount) return
    if (input.inside(next)) return
    const movement = movementCost(
      entry.state,
      next,
      input.point,
      input.obstacles,
      input.occupied,
      input.sourceBoundary,
      input.transitions,
    )
    if (movement < 0) return
    const cost = entry.cost + (entry.state.direction === direction ? 0 : 12) + movement
    const known = input.costs.get(key(next))
    if (known !== undefined && cost >= known) return
    input.costs.set(key(next), cost)
    input.parents.set(key(next), entry.state)
    nextSerial += 1
    input.frontier.push({
      state: next,
      cost,
      score: cost + routeDistance(input.point(next), input.finish),
      serial: nextSerial,
    })
  })
  return nextSerial
}

function movementCost(
  start: GridState,
  finish: GridState,
  point: (state: GridState) => RoutePoint,
  obstacles: readonly RouteRect[],
  occupied: readonly (readonly RoutePoint[])[],
  sourceBoundary: number | null,
  cache: Map<string, number>,
): number {
  const segment = `${start.x}:${start.y}>${finish.x}:${finish.y}`
  const cached = cache.get(segment)
  if (cached !== undefined) return cached
  const startPoint = point(start)
  const endPoint = point(finish)
  const movement = routeClear([startPoint, endPoint], obstacles)
    ? routeDistance(startPoint, endPoint) +
      occupancyCost(startPoint, endPoint, occupied) +
      loopCost(startPoint, endPoint, sourceBoundary)
    : -1
  cache.set(segment, movement)
  return movement
}

function loopCost(start: RoutePoint, finish: RoutePoint, sourceBoundary: number | null): number {
  if (sourceBoundary === null) return 0
  const crosses = start.x < sourceBoundary !== finish.x < sourceBoundary
  return crosses ? ROUTE_SPACING * 4 : 0
}

function contains(point: RoutePoint, rectangle: RouteRect): boolean {
  return (
    point.x > rectangle.x &&
    point.x < rectangle.x + rectangle.width &&
    point.y > rectangle.y &&
    point.y < rectangle.y + rectangle.height
  )
}

function reconstruct(goal: GridState, parents: ReadonlyMap<string, GridState>): GridState[] {
  const path = [goal]
  let cursor = goal
  while (parents.has(key(cursor))) {
    const parent = parents.get(key(cursor))
    if (!parent) break
    path.push(parent)
    cursor = parent
  }
  return path.reverse()
}

function key(state: GridState): string {
  return `${state.x}:${state.y}:${state.direction}`
}

type Entry = { readonly state: GridState; readonly cost: number; readonly score: number; readonly serial: number }

class RouteHeap {
  private readonly values: Entry[] = []

  get size(): number {
    return this.values.length
  }

  push(entry: Entry): void {
    this.values.push(entry)
    let index = this.values.length - 1
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2)
      const current = this.values[index]
      const above = this.values[parent]
      if (!current || !above || !precedes(current, above)) break
      this.values[index] = above
      this.values[parent] = current
      index = parent
    }
  }

  pop(): Entry | null {
    if (this.values.length === 0) return null
    if (this.values.length === 1) return this.values.pop() ?? null
    const result = this.values[0]
    const last = this.values.pop()
    if (!result || !last) return result ?? null
    this.values[0] = last
    let index = 0
    while (index * 2 + 1 < this.values.length) {
      const left = index * 2 + 1
      const right = left + 1
      const leftEntry = this.values[left]
      const rightEntry = this.values[right]
      const child =
        rightEntry && leftEntry && precedes(rightEntry, leftEntry) ? right : left
      const childEntry = this.values[child]
      const parent = this.values[index]
      if (!childEntry || !parent || !precedes(childEntry, parent)) break
      this.values[index] = childEntry
      this.values[child] = parent
      index = child
    }
    return result
  }
}

function precedes(left: Entry, right: Entry): boolean {
  return left.score === right.score ? left.serial < right.serial : left.score < right.score
}
