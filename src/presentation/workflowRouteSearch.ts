import { walk } from './workflowRouteExplore'
import { indexOf, lanes } from './workflowRouteLanes'
import type { RoutePoint, RouteRect } from './workflowRouteTypes'

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
