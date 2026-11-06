import { describe, expect, it } from 'vitest'
import { asWorkflowId, asWorkflowNodeId, type WorkflowEditorDefinition } from '../model'
import { routeConnection } from './workflowConnectionRouter'
import { workflowScene } from './workflowGraphRoutes'
import { roundedOrthogonalPath } from './workflowRoundedPath'
import { occupancyCost } from './workflowRouteOccupancy'
import { routeClear } from './workflowRouteClear'
import {
  EDITOR_NIGHTLY_ID,
  EDITOR_RELEASE_ID,
  workflowEditorLoadFor,
} from '../adapters/mock/workflowEditorFixtures'
import type { RouteNode, RoutePoint, RouteRect } from './workflowRouteTypes'

function macNode(id: string, x: number, y: number, kind: 'agent' | 'compact' = 'agent'): RouteNode {
  const size = kind === 'agent' ? { width: 200, height: 92 } : { width: 72, height: 72 }
  const portY = y + size.height / 2
  return {
    id,
    rectangle: { x, y, width: size.width, height: size.height },
    input: { x: x - 5.25, y: portY },
    output: { x: x + size.width + 5.25, y: portY },
  }
}

function orthogonal(points: readonly RoutePoint[]): boolean {
  return points.every((point, index) => {
    const next = points[index + 1]
    return !next || point.x === next.x || point.y === next.y
  })
}

function body(node: RouteNode): RouteRect {
  return node.rectangle
}

describe('routeConnection', () => {
  it('uses the Mac straight port vector for aligned nodes', () => {
    const source = macNode('source', 60, 100)
    const target = macNode('target', 560, 100)
    const route = routeConnection(source, target, target.input, [source, target])
    expect(route).toEqual([
      { x: 265.25, y: 146 },
      { x: 554.75, y: 146 },
    ])
    expect(routeConnection(source, target, target.input, [source, target])).toEqual(route)
  })

  it('uses the Mac 39.5-point direct gap for a compact start', () => {
    const source = macNode('source', 68, 110, 'compact')
    const target = macNode('target', 190, 100)
    expect(source.output).toEqual({ x: 145.25, y: 146 })
    expect(target.input).toEqual({ x: 184.75, y: 146 })
    expect(routeConnection(source, target, target.input, [source, target])).toEqual([
      source.output,
      target.input,
    ])
  })

  it('scores opposing traffic and arrowhead crossings from the Mac weights', () => {
    const path = [{ x: 20, y: 40 }, { x: 220, y: 40 }]
    const same = occupancyCost({ x: 40, y: 40 }, { x: 180, y: 40 }, [path])
    const opposite = occupancyCost({ x: 180, y: 40 }, { x: 40, y: 40 }, [path])
    const ordinary = occupancyCost({ x: 100, y: 20 }, { x: 100, y: 60 }, [path])
    const tip = occupancyCost({ x: 215, y: 20 }, { x: 215, y: 60 }, [path])
    expect(same).toBe(70)
    expect(opposite).toBe(560)
    expect(ordinary).toBe(4)
    expect(tip).toBe(164)
  })

  it('routes around an intervening box on a finite orthogonal lane', () => {
    const source = macNode('source', 60, 100)
    const obstacle = macNode('middle', 360, 100)
    const target = macNode('target', 660, 100)
    const route = routeConnection(source, target, target.input, [source, obstacle, target])
    expect(route).toHaveLength(6)
    expect(route[0]).toEqual(source.output)
    expect(route[route.length - 1]).toEqual(target.input)
    expect(orthogonal(route)).toBe(true)
    expect(routeClear(route, [body(obstacle)])).toBe(true)
    expect(route.slice(1, -1).some((point) => point.y % 10 === 0)).toBe(true)
    expect(route.every((point) => point.x >= 0 && point.y >= 0)).toBe(true)
  })

  it('keeps a backward route attached, clear, and inside the non-negative plane', () => {
    const source = macNode('source', 660, 100)
    const target = macNode('target', 24, 40)
    const route = routeConnection(source, target, target.input, [source, target])
    const approach = route[route.length - 2]
    expect(route[1]?.x).toBeGreaterThan(route[0]?.x ?? 0)
    expect(approach?.x).toBeLessThan(route[route.length - 1]?.x ?? 0)
    expect(approach?.y).toBe(target.input.y)
    expect((target.input.x) - (approach?.x ?? 0)).toBeGreaterThanOrEqual(17)
    expect(routeClear(route, [body(source), body(target)])).toBe(true)
    expect(orthogonal(route)).toBe(true)
    expect(route.every((point) => Number.isFinite(point.x) && point.x >= 0 && point.y >= 0)).toBe(true)
    expect(route.length).toBeLessThan(12)
  })

  it('falls back to a finite orthogonal route when the boxes overlap', () => {
    const source = macNode('source', 60, 100)
    const target = macNode('target', 60, 100)
    const route = routeConnection(source, target, target.input, [source, target])
    expect(route.length).toBeLessThan(12)
    expect(route[route.length - 1]).toEqual(target.input)
    expect(orthogonal(route)).toBe(true)
    expect(route.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true)
  })

  it('uses two bends for an offset pair and leaves the arrowhead corridor clear', () => {
    const source = macNode('source', 60, 100)
    const target = macNode('target', 560, 240)
    const route = routeConnection(source, target, target.input, [source, target])
    expect(route).toHaveLength(4)
    expect(route[1]?.x).toBe(route[2]?.x)
    expect(route[1]?.y).toBe(route[0]?.y)
    expect(route[2]?.y).toBe(route[3]?.y)
    expect((route[1]?.x ?? 0) % 10).toBe(0)
    expect((target.input.x) - (route[2]?.x ?? 0)).toBeGreaterThanOrEqual(17)
    expect(orthogonal(route)).toBe(true)
  })

  it('leaves an occupied aligned lane', () => {
    const source = macNode('source', 60, 100)
    const target = macNode('target', 560, 100)
    const occupied = [[source.output, target.input]]
    const route = routeConnection(source, target, target.input, [source, target], occupied)
    expect(route.length).toBeGreaterThan(2)
    expect(route.some((point) => Math.abs(point.y - source.output.y) <= 20 && point.y !== source.output.y)).toBe(true)
    expect(route[0]).toEqual(source.output)
    expect(route[route.length - 1]).toEqual(target.input)
  })
})

describe('roundedOrthogonalPath', () => {
  it('clamps a short bend so the curve does not reverse', () => {
    const path = roundedOrthogonalPath([
      { x: 0, y: 0 },
      { x: 0, y: 8 },
      { x: 20, y: 8 },
    ])
    expect(path).toBe('M0 0 L0 4 Q0 8 4 8 L20 8')
  })
})

describe('workflowScene', () => {
  it('keeps Release reachable, orthogonal, and disconnected from the orchestrator', () => {
    const scene = readyScene(EDITOR_RELEASE_ID)
    const drawn = scene.routes.filter((route) => 'points' in route)
    expect(drawn).toHaveLength(8)
    expect(scene.routes.some((route) => 'unavailable' in route)).toBe(false)
    expect(scene.width).toBeGreaterThanOrEqual(1126)
    const definition = readyDefinition(EDITOR_RELEASE_ID)
    for (const route of drawn) {
      if (!('points' in route)) continue
      expect(orthogonal(route.points)).toBe(true)
      expect(route.points.every((point) => point.x >= 0 && point.y >= 0)).toBe(true)
      const edge = definition.edges.find((item) => item.id === route.id)
      const obstacles = definition.nodes.flatMap((node) =>
        node.frame && node.id !== edge?.from && node.id !== edge?.to ? [node.frame] : [],
      )
      expect(routeClear(route.points, obstacles)).toBe(true)
      const tip = route.points[route.points.length - 1]
      const approach = route.points[route.points.length - 2]
      if (tip && approach) {
        expect(Math.abs(tip.x - approach.x) + Math.abs(tip.y - approach.y)).toBeGreaterThanOrEqual(7)
      }
    }
  })

  it('routes the Nightly retry into Audit and stays on the non-negative canvas', () => {
    const scene = readyScene(EDITOR_NIGHTLY_ID)
    const loop = scene.routes.find((route) => 'loop' in route && route.loop)
    expect(loop && 'points' in loop).toBe(true)
    if (!loop || !('points' in loop)) return
    expect(loop.points[loop.points.length - 1]?.x).toBeGreaterThan(0)
    expect(loop.points.every((point) => point.x >= 0 && point.y >= 0)).toBe(true)
    expect(scene.routes.some((route) => route.id === 'n3' && 'unavailable' in route)).toBe(false)
  })

  it('refuses a loop into Start instead of inventing an input', () => {
    const scene = workflowScene(loopIntoStart())
    expect(scene.routes).toEqual([
      { id: 'bad', unavailable: 'This node has no input port.' },
    ])
  })
})

function readyDefinition(id: typeof EDITOR_RELEASE_ID) {
  const load = workflowEditorLoadFor(id)
  if (load.kind !== 'ready') throw new Error('fixture')
  return load.definition
}

function readyScene(id: typeof EDITOR_RELEASE_ID) {
  return workflowScene(readyDefinition(id))
}

function loopIntoStart(): WorkflowEditorDefinition {
  return {
    workflowId: asWorkflowId('wf-invalid'),
    title: 'Invalid',
    revisionLabel: 'Revision 0',
    boardWidth: 400,
    boardHeight: 200,
    defaultSelectedId: null,
    nodes: [
      {
        id: asWorkflowNodeId('start'),
        placement: 'path',
        visual: 'terminal',
        title: 'Start',
        kindLabel: 'Start',
        meta: null,
        locked: false,
        frame: { x: 8, y: 40, width: 70, height: 38 },
        icon: 'play',
        sections: [],
      },
      {
        id: asWorkflowNodeId('work'),
        placement: 'path',
        visual: 'agent',
        title: 'Work',
        kindLabel: 'Task',
        meta: null,
        locked: false,
        frame: { x: 160, y: 20, width: 160, height: 82 },
        icon: null,
        sections: [],
      },
    ],
    edges: [{ id: 'bad', from: asWorkflowNodeId('work'), to: asWorkflowNodeId('start'), loop: true }],
  }
}
