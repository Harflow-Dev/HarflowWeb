import { CORNER_RADIUS, type RoutePoint } from './workflowRouteTypes'

/**
 * Builds an orthogonal SVG path. Corner radius is clamped to half of each
 * adjoining segment so a short gap cannot reverse the bend.
 */
export function roundedOrthogonalPath(
  points: readonly RoutePoint[],
  radius = CORNER_RADIUS,
): string {
  const first = points[0]
  if (!first) return ''
  if (points.length === 1) return `M${format(first.x)} ${format(first.y)}`
  if (points.length === 2) {
    const last = points[1]
    return last ? `M${format(first.x)} ${format(first.y)} L${format(last.x)} ${format(last.y)}` : ''
  }
  let path = `M${format(first.x)} ${format(first.y)}`
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1]
    const corner = points[index]
    const next = points[index + 1]
    if (!previous || !corner || !next) continue
    path += cornerCommand(previous, corner, next, radius)
  }
  const last = points[points.length - 1]
  return last ? `${path} L${format(last.x)} ${format(last.y)}` : path
}

function cornerCommand(
  previous: RoutePoint,
  corner: RoutePoint,
  next: RoutePoint,
  radius: number,
): string {
  const incoming = Math.abs(corner.x - previous.x) + Math.abs(corner.y - previous.y)
  const outgoing = Math.abs(next.x - corner.x) + Math.abs(next.y - corner.y)
  const clamped = Math.min(radius, incoming / 2, outgoing / 2)
  if (clamped <= 0) return ` L${format(corner.x)} ${format(corner.y)}`
  const approach = stepToward(corner, previous, clamped)
  const leave = stepToward(corner, next, clamped)
  return ` L${format(approach.x)} ${format(approach.y)} Q${format(corner.x)} ${format(corner.y)} ${format(leave.x)} ${format(leave.y)}`
}

function stepToward(origin: RoutePoint, target: RoutePoint, distance: number): RoutePoint {
  const span = Math.abs(target.x - origin.x) + Math.abs(target.y - origin.y)
  if (span === 0) return origin
  const scale = distance / span
  return {
    x: origin.x + (target.x - origin.x) * scale,
    y: origin.y + (target.y - origin.y) * scale,
  }
}

function format(value: number): string {
  const rounded = Math.round(value * 100) / 100
  return String(rounded)
}
