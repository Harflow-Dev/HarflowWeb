import type { WorkflowEditorDefinition, WorkflowEditorNode } from '../model'
import { routeConnection } from './workflowConnectionRouter'
import { roundedOrthogonalPath } from './workflowRoundedPath'
import { sharedDestinationRoutes } from './workflowSharedRoutes'
import { PORT_RADIUS, type RouteNode, type RoutePoint } from './workflowRouteTypes'

export type WorkflowRoute =
  | { readonly id: string; readonly loop: boolean; readonly d: string; readonly points: readonly RoutePoint[] }
  | { readonly id: string; readonly unavailable: string }

export type WorkflowScene = {
  readonly width: number
  readonly height: number
  readonly routes: readonly WorkflowRoute[]
}

const CONTENT_PADDING = 12

/** Route every explicit edge. Invalid ports stay unavailable and are not redrawn elsewhere. */
export function workflowScene(definition: WorkflowEditorDefinition): WorkflowScene {
  const pathNodes = definition.nodes.filter((node) => node.placement === 'path' && node.frame)
  const routed = pathNodes.flatMap((node) => {
    const routeNode = toRouteNode(node)
    return routeNode ? [routeNode] : []
  })
  const lookup = new Map(routed.map((node) => [node.id, node]))
  const edges = [...definition.edges].sort((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0))
  const routes = routeEdges(definition, edges, lookup, routed)
  return { width: contentSpan(definition, pathNodes, routes, true), height: contentSpan(definition, pathNodes, routes, false), routes }
}

function routeEdges(
  definition: WorkflowEditorDefinition,
  edges: WorkflowEditorDefinition['edges'],
  lookup: ReadonlyMap<string, RouteNode>,
  nodes: readonly RouteNode[],
): WorkflowRoute[] {
  const occupied: RoutePoint[][] = []
  const seenTargets = new Set<string>()
  for (const edge of edges) {
    const target = lookup.get(edge.to)
    if (!lookup.get(edge.from) || !target || seenTargets.has(target.id)) continue
    if (!ports(definition, edge.to).input) continue
    seenTargets.add(target.id)
    occupied.push([target.input])
  }
  const groups = new Map<string, { id: string; source: string; target: string }[]>()
  for (const edge of edges) {
    const group = groups.get(edge.to) ?? []
    group.push({ id: edge.id, source: edge.from, target: edge.to })
    groups.set(edge.to, group)
  }
  const planned = new Set<string>()
  const shared = new Map<string, readonly RoutePoint[]>()
  return edges.map((edge) => {
    const source = lookup.get(edge.from)
    const target = lookup.get(edge.to)
    const sourcePorts = ports(definition, edge.from)
    const targetPorts = ports(definition, edge.to)
    if (!sourcePorts.output || !source) {
      return { id: edge.id, unavailable: 'This node has no output port.' }
    }
    if (!targetPorts.input || !target) {
      return { id: edge.id, unavailable: 'This node has no input port.' }
    }
    if (planned.has(edge.to) === false) {
      planned.add(edge.to)
      for (const [id, points] of sharedDestinationRoutes(groups.get(edge.to) ?? [], nodes, occupied)) {
        shared.set(id, points)
      }
    }
    const points = shared.get(edge.id) ?? routeConnection(source, target, target.input, nodes, occupied)
    occupied.push([...points])
    return { id: edge.id, loop: edge.loop, d: roundedOrthogonalPath(points), points }
  })
}

function ports(definition: WorkflowEditorDefinition, id: string): { input: boolean; output: boolean } {
  const node = definition.nodes.find((entry) => entry.id === id)
  if (!node || node.locked || node.visual === 'orchestrator') return { input: false, output: false }
  return { input: node.icon !== 'play', output: node.icon !== 'flag' }
}

function toRouteNode(node: WorkflowEditorNode): RouteNode | null {
  if (!node.frame || node.locked || node.visual === 'orchestrator') return null
  const y = node.frame.y + node.frame.height / 2
  return {
    id: node.id,
    rectangle: node.frame,
    input: { x: node.frame.x - PORT_RADIUS, y },
    output: { x: node.frame.x + node.frame.width + PORT_RADIUS, y },
  }
}

function contentSpan(
  definition: WorkflowEditorDefinition,
  nodes: readonly WorkflowEditorNode[],
  routes: readonly WorkflowRoute[],
  horizontal: boolean,
): number {
  const board = horizontal ? definition.boardWidth : definition.boardHeight
  let extent = board
  for (const node of nodes) {
    if (!node.frame) continue
    extent = Math.max(extent, horizontal ? node.frame.x + node.frame.width : node.frame.y + node.frame.height)
  }
  for (const route of routes) {
    if (!('points' in route)) continue
    for (const point of route.points) {
      extent = Math.max(extent, horizontal ? point.x : point.y)
    }
  }
  return extent + CONTENT_PADDING
}
