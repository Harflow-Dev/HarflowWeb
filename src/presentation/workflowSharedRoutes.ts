import { routeClear } from './workflowRouteClear'
import { routeConnection } from './workflowConnectionRouter'
import { ROUTE_SPACING, expandRect, type RouteNode, type RoutePoint } from './workflowRouteTypes'

type SharedEdge = { readonly id: string; readonly source: string; readonly target: string }

/**
 * Fan-in branches share one vertical trunk when the corridor stays clear.
 * Transcribed from WorkflowSharedDestinationRoutes at the same Mac commit.
 */
export function sharedDestinationRoutes(
  edges: readonly SharedEdge[],
  nodes: readonly RouteNode[],
  occupied: readonly (readonly RoutePoint[])[],
): ReadonlyMap<string, readonly RoutePoint[]> {
  const lookup = new Map(nodes.map((node) => [node.id, node]))
  const targetId = edges[0]?.target
  const target = targetId ? lookup.get(targetId) : undefined
  if (!target || edges.length < 2) return new Map()
  const busX = Math.floor((target.input.x - 20) / ROUTE_SPACING) * ROUTE_SPACING
  const eligible = edges.filter((edge) => {
    const source = lookup.get(edge.source)
    return source !== undefined && source.id !== target.id && busX - source.output.x >= 30
  })
  if (eligible.length < 2) return new Map()
  const bodies = nodes.filter((node) => node.id !== target.id).map((node) => expandRect(node.rectangle))
  const heads = occupied.flatMap((points) => {
    const tip = points[points.length - 1]
    if (!tip || (tip.x === target.input.x && tip.y === target.input.y)) return []
    return [{ x: tip.x - 9, y: tip.y - 7, width: 12, height: 14 }]
  })
  const candidates = new Map<string, readonly RoutePoint[]>()
  for (const edge of eligible) {
    const source = lookup.get(edge.source)
    if (!source) continue
    const attachment = { x: busX, y: source.output.y }
    const suffix = compact([attachment, { x: busX, y: target.input.y }, target.input])
    if (!routeClear(suffix, [...bodies, ...heads])) continue
    const prefix = routeConnection(source, null, attachment, nodes, occupied)
    const route = compact([...prefix, ...suffix.slice(1)])
    if (!accepts(route, source, target, nodes, heads)) continue
    candidates.set(edge.id, route)
  }
  return candidates.size >= 2 ? candidates : new Map()
}

function accepts(
  route: readonly RoutePoint[],
  source: RouteNode,
  target: RouteNode,
  nodes: readonly RouteNode[],
  heads: readonly { x: number; y: number; width: number; height: number }[],
): boolean {
  const first = route[0]
  const last = route[route.length - 1]
  if (!first || !last) return false
  if (first.x !== source.output.x || first.y !== source.output.y) return false
  if (last.x !== target.input.x || last.y !== target.input.y) return false
  const otherBodies = nodes
    .filter((node) => node.id !== source.id && node.id !== target.id)
    .map((node) => expandRect(node.rectangle))
  const ownBodies = [source.rectangle, target.rectangle]
  return routeClear(route, [...otherBodies, ...ownBodies, ...heads]) && hasCornerClearance(route)
}

function compact(points: readonly RoutePoint[]): RoutePoint[] {
  const result: RoutePoint[] = []
  for (const point of points) {
    const last = result[result.length - 1]
    if (last && last.x === point.x && last.y === point.y) continue
    if (result.length >= 2) {
      const previous = result[result.length - 2]
      if (previous && last && collinear(previous, last, point)) result.pop()
    }
    result.push(point)
  }
  return result
}

function collinear(previous: RoutePoint, last: RoutePoint, point: RoutePoint): boolean {
  if (previous.x === last.x && last.x === point.x) return (last.y - previous.y) * (point.y - last.y) >= 0
  if (previous.y === last.y && last.y === point.y) return (last.x - previous.x) * (point.x - last.x) >= 0
  return false
}

function hasCornerClearance(points: readonly RoutePoint[]): boolean {
  if (points.length <= 2) return true
  return points.every((point, index) => {
    const next = points[index + 1]
    if (!next) return true
    const length = Math.abs(point.x - next.x) + Math.abs(point.y - next.y)
    const minimum = index === 0 ? 10 : index === points.length - 2 ? 17 : 20
    return length >= minimum
  })
}
