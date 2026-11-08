import { routeClear } from './workflowRouteClear'
import { occupancyCost } from './workflowRouteOccupancy'
import { RouteHeap } from './workflowRouteHeap'
import type { GridState } from './workflowRouteLanes'
import {
  ROUTE_EXPANSION_LIMIT,
  ROUTE_SPACING,
  routeDistance,
  type RoutePoint,
  type RouteRect,
} from './workflowRouteTypes'

const DIRECTIONS: readonly (readonly [number, number])[] = [
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, 0],
]

export function walk(
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
