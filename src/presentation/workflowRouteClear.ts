import {
  routeDistance,
  type RoutePoint,
  type RouteRect,
} from './workflowRouteTypes'

/** Segment clearance. A horizontal or vertical stroke misses a box, or it does not. */
export function routeClear(
  points: readonly RoutePoint[],
  obstacles: readonly RouteRect[],
): boolean {
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1]
    const finish = points[index]
    if (!start || !finish) return false
    if (obstacles.some((rectangle) => hits(start, finish, rectangle))) return false
  }
  return true
}

function hits(start: RoutePoint, finish: RoutePoint, rectangle: RouteRect): boolean {
  const minX = rectangle.x
  const maxX = rectangle.x + rectangle.width
  const minY = rectangle.y
  const maxY = rectangle.y + rectangle.height
  if (start.y === finish.y) {
    const outsideY = start.y <= minY || start.y >= maxY
    const outsideX = Math.max(start.x, finish.x) <= minX || Math.min(start.x, finish.x) >= maxX
    return !outsideY && !outsideX
  }
  const outsideX = start.x <= minX || start.x >= maxX
  const outsideY = Math.max(start.y, finish.y) <= minY || Math.min(start.y, finish.y) >= maxY
  return !outsideX && !outsideY
}

/** Drop duplicate and collinear forward points. */
export function simplifyRoute(points: readonly RoutePoint[]): RoutePoint[] {
  const result: RoutePoint[] = []
  for (const point of points) {
    const last = result[result.length - 1]
    if (last && last.x === point.x && last.y === point.y) continue
    if (result.length >= 2) {
      const start = result[result.length - 2]
      const middle = result[result.length - 1]
      if (
        start &&
        middle &&
        collinearForward(start, middle, point)
      ) {
        result.pop()
      }
    }
    result.push(point)
  }
  return result
}

function collinearForward(start: RoutePoint, middle: RoutePoint, point: RoutePoint): boolean {
  const sameAxis =
    (start.x === middle.x && middle.x === point.x) ||
    (start.y === middle.y && middle.y === point.y)
  if (!sameAxis) return false
  const forward =
    (middle.x - start.x) * (point.x - middle.x) + (middle.y - start.y) * (point.y - middle.y)
  return forward >= 0
}

export function samePoint(left: RoutePoint, right: RoutePoint): boolean {
  return left.x === right.x && left.y === right.y
}

export function segmentSpan(start: RoutePoint, finish: RoutePoint): number {
  return routeDistance(start, finish)
}
