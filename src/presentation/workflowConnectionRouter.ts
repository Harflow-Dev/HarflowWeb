import { routeClear, simplifyRoute } from './workflowRouteClear'
import { occupancyCost } from './workflowRouteOccupancy'
import { searchRoute } from './workflowRouteSearch'
import {
  ROUTE_SPACING,
  expandRect,
  routeLength,
  type RouteNode,
  type RoutePoint,
  type RouteRect,
} from './workflowRouteTypes'

/**
 * Orthogonal router transcribed from HarflowMac
 * WorkflowConnectionRouter.route at 705ceb7befcbf7a7e8fc013b95e7269bac5cf39b.
 * Those sources match ff3763762073d99e3caa51748baf51290d0319e7.
 * Task cancellation is omitted: this preview has no routing task to cancel.
 */
export function routeConnection(
  source: RouteNode,
  target: RouteNode | null,
  endpoint: RoutePoint,
  nodes: readonly RouteNode[],
  occupied: readonly (readonly RoutePoint[])[] = [],
): readonly RoutePoint[] {
  const start = source.output
  const finish = endpoint
  const directObstacles = others(nodes, source.id, target?.id).map((node) => expandRect(node.rectangle))
  const direct = start.y === finish.y && finish.x > start.x && routeClear([start, finish], directObstacles)
  if (direct && occupancyCost(start, finish, occupied) === 0) return [start, finish]
  const anchors = anchorsFor(source, finish, nodes, target)
  const prefix = [start, anchors.startGrid]
  const obstacles = nodes.map((node) => ({ id: node.id, rectangle: expandRect(node.rectangle) }))
  const rectangles = obstacles.map((entry) => entry.rectangle)
  const prefixClear = routeClear(prefix, obstacles.filter((entry) => entry.id !== source.id).map((entry) => entry.rectangle))
  const suffixClear = routeClear(
    [anchors.finishGrid, finish],
    obstacles.filter((entry) => entry.id !== target?.id).map((entry) => entry.rectangle),
  )
  if (prefixClear && suffixClear) {
    const middle = searchRoute(
      anchors.startGrid,
      anchors.finishGrid,
      rectangles,
      occupied,
      finish.x >= source.rectangle.x ? source.rectangle.x : null,
    )
    if (middle) {
      const routed = simplifyRoute([...prefix, ...middle, anchors.finishGrid, finish])
      if (direct && routeCost([start, finish], occupied) <= routeCost(routed, occupied)) {
        return [start, finish]
      }
      return routed
    }
  }
  return fallback(prefix, anchors, finish, rectangles, occupied, start)
}

function anchorsFor(
  source: RouteNode,
  finish: RoutePoint,
  nodes: readonly RouteNode[],
  target: RouteNode | null,
): { readonly startGrid: RoutePoint; readonly finishGrid: RoutePoint } {
  const start = source.output
  const startGrid = {
    x: Math.ceil((start.x + 10) / ROUTE_SPACING) * ROUTE_SPACING,
    y: start.y,
  }
  let finishX = Math.floor((finish.x - 20) / ROUTE_SPACING) * ROUTE_SPACING
  const sourceObstacle = expandRect(source.rectangle)
  const sourceExit = Math.max(startGrid.x, Math.ceil((sourceObstacle.x + sourceObstacle.width) / ROUTE_SPACING) * ROUTE_SPACING)
  if (
    finish.x > start.x &&
    finish.y > sourceObstacle.y &&
    finish.y < sourceObstacle.y + sourceObstacle.height &&
    finishX < sourceExit &&
    finish.x - sourceExit >= 17
  ) {
    finishX = sourceExit
  }
  finishX = Math.max(0, sharedCorridor(finish, finishX, nodes, target?.id))
  return {
    startGrid: { x: Math.max(0, startGrid.x), y: startGrid.y },
    finishGrid: { x: finishX, y: finish.y },
  }
}

function sharedCorridor(
  finish: RoutePoint,
  finishX: number,
  nodes: readonly RouteNode[],
  targetId: string | undefined,
): number {
  const blocking = nodes
    .filter((node) => node.id !== targetId)
    .map((node) => expandRect(node.rectangle))
    .filter((rectangle) => {
      const maxX = rectangle.x + rectangle.width
      const maxY = rectangle.y + rectangle.height
      return finish.y > rectangle.y && finish.y < maxY && rectangle.x < finish.x && maxX > finishX
    })
  const edge = blocking.reduce((highest, rectangle) => Math.max(highest, rectangle.x + rectangle.width), Number.NEGATIVE_INFINITY)
  if (!Number.isFinite(edge)) return finishX
  const safeAnchor = Math.ceil(edge / ROUTE_SPACING) * ROUTE_SPACING
  return finish.x - safeAnchor >= 17 ? Math.max(finishX, safeAnchor) : finishX
}

function fallback(
  prefix: readonly RoutePoint[],
  anchors: { readonly startGrid: RoutePoint; readonly finishGrid: RoutePoint },
  finish: RoutePoint,
  rectangles: readonly RouteRect[],
  occupied: readonly (readonly RoutePoint[])[],
  start: RoutePoint,
): readonly RoutePoint[] {
  const lowest = rectangles.reduce((value, rectangle) => Math.min(value, rectangle.y), Number.POSITIVE_INFINITY)
  const highest = rectangles.reduce(
    (value, rectangle) => Math.max(value, rectangle.y + rectangle.height),
    Number.NEGATIVE_INFINITY,
  )
  const rails = [
    Math.max(0, Math.floor(((Number.isFinite(lowest) ? lowest : 0) - 20) / ROUTE_SPACING) * ROUTE_SPACING),
    Math.ceil(((Number.isFinite(highest) ? highest : 0) + 20) / ROUTE_SPACING) * ROUTE_SPACING,
  ]
  const candidates = rails.map((y) =>
    simplifyRoute([
      ...prefix,
      { x: anchors.startGrid.x, y },
      { x: anchors.finishGrid.x, y },
      anchors.finishGrid,
      finish,
    ]),
  )
  const safe = candidates.filter((candidate) =>
    routeClear(candidate.slice(1, -1), rectangles),
  )
  const pool = safe.length > 0 ? safe : candidates
  return pool.reduce((best, candidate) =>
    routeCost(candidate, occupied) < routeCost(best, occupied) ? candidate : best,
  ) ?? [start, finish]
}

function others(nodes: readonly RouteNode[], sourceId: string, targetId: string | undefined): RouteNode[] {
  return nodes.filter((node) => node.id !== sourceId && node.id !== targetId)
}

function routeCost(points: readonly RoutePoint[], occupied: readonly (readonly RoutePoint[])[]): number {
  let occupiedCost = 0
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1]
    const finish = points[index]
    if (start && finish) occupiedCost += occupancyCost(start, finish, occupied)
  }
  return routeLength(points) + Math.max(0, points.length - 2) * 12 + occupiedCost
}
