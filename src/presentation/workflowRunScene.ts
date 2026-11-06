import type { WorkflowRunObservation } from '../model'
import { routeConnection } from './workflowConnectionRouter'
import type { WorkflowRoute, WorkflowScene } from './workflowGraphRoutes'
import { roundedOrthogonalPath } from './workflowRoundedPath'
import { PORT_RADIUS, type RouteNode, type RoutePoint } from './workflowRouteTypes'

const PADDING = 0

/** Route the run graph with the same orthogonal router as the editor. */
export function workflowRunScene(run: WorkflowRunObservation): WorkflowScene {
  const routed = run.nodes.flatMap((node) => {
    if (node.placement !== 'path' || !node.frame) return []
    const y = node.frame.y + node.frame.height / 2
    const routeNode: RouteNode = {
      id: node.id,
      rectangle: node.frame,
      input: { x: node.frame.x - PORT_RADIUS, y },
      output: { x: node.frame.x + node.frame.width + PORT_RADIUS, y },
    }
    return [routeNode]
  })
  const lookup = new Map(routed.map((node) => [node.id, node]))
  const occupied: RoutePoint[][] = []
  const routes = run.edges.map((edge) => connect(edge, lookup, routed, occupied))
  return {
    width: span(run.boardWidth, routed, routes, true),
    height: span(run.boardHeight, routed, routes, false),
    routes,
  }
}

function connect(
  edge: WorkflowRunObservation['edges'][number],
  lookup: ReadonlyMap<string, RouteNode>,
  nodes: readonly RouteNode[],
  occupied: RoutePoint[][],
): WorkflowRoute {
  const source = lookup.get(edge.from)
  const target = lookup.get(edge.to)
  if (!source || !target) {
    return { id: edge.id, unavailable: 'This node has no input port.' }
  }
  const points = routeConnection(source, target, target.input, nodes, occupied)
  occupied.push([...points])
  return { id: edge.id, loop: false, d: roundedOrthogonalPath(points), points }
}

function span(
  board: number,
  nodes: readonly RouteNode[],
  routes: readonly WorkflowRoute[],
  horizontal: boolean,
): number {
  let extent = board
  for (const node of nodes) {
    const edge = horizontal
      ? node.rectangle.x + node.rectangle.width
      : node.rectangle.y + node.rectangle.height
    extent = Math.max(extent, edge)
  }
  for (const route of routes) {
    if (!('points' in route)) continue
    for (const point of route.points) {
      extent = Math.max(extent, horizontal ? point.x : point.y)
    }
  }
  return extent + PADDING
}
