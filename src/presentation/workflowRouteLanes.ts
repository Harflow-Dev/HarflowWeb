import {
  ROUTE_SPACING,
  type RoutePoint,
  type RouteRect,
} from './workflowRouteTypes'

export type GridState = { readonly x: number; readonly y: number; readonly direction: number }

export function lanes(
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

export function indexOf(
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
