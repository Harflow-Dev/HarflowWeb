/**
 * Routing numbers taken from HarflowMac
 * 705ceb7befcbf7a7e8fc013b95e7269bac5cf39b.
 * WorkflowConnectionRouter.swift and WorkflowCanvasGeometry.swift match
 * ff3763762073d99e3caa51748baf51290d0319e7 and are unmodified in the working
 * tree. Snap spacing, clearance, expansion limit, and port radius are
 * HfRadius.Metrics values read from that commit.
 */

export type RoutePoint = { readonly x: number; readonly y: number }

export type RouteRect = {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export type RouteNode = {
  readonly id: string
  readonly rectangle: RouteRect
  readonly input: RoutePoint
  readonly output: RoutePoint
}

export const ROUTE_SPACING = 10
export const ROUTE_CLEARANCE = 10
export const ROUTE_EXPANSION_LIMIT = 5000
export const PORT_RADIUS = 5.25
export const CORNER_RADIUS = 10

export function expandRect(rectangle: RouteRect, amount = ROUTE_CLEARANCE): RouteRect {
  return {
    x: rectangle.x - amount,
    y: rectangle.y - amount,
    width: rectangle.width + amount * 2,
    height: rectangle.height + amount * 2,
  }
}

export function routeDistance(start: RoutePoint, finish: RoutePoint): number {
  return Math.abs(start.x - finish.x) + Math.abs(start.y - finish.y)
}

export function routeLength(points: readonly RoutePoint[]): number {
  let total = 0
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]
    const point = points[index]
    if (previous && point) total += routeDistance(previous, point)
  }
  return total
}
