import type { GridState } from './workflowRouteLanes'

type Entry = {
  readonly state: GridState
  readonly cost: number
  readonly score: number
  readonly serial: number
}

export class RouteHeap {
  private readonly values: Entry[] = []

  get size(): number {
    return this.values.length
  }

  push(entry: Entry): void {
    this.values.push(entry)
    let index = this.values.length - 1
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2)
      const current = this.values[index]
      const above = this.values[parent]
      if (!current || !above || !precedes(current, above)) break
      this.values[index] = above
      this.values[parent] = current
      index = parent
    }
  }

  pop(): Entry | null {
    if (this.values.length === 0) return null
    if (this.values.length === 1) return this.values.pop() ?? null
    const result = this.values[0]
    const last = this.values.pop()
    if (!result || !last) return result ?? null
    this.values[0] = last
    let index = 0
    while (index * 2 + 1 < this.values.length) {
      const left = index * 2 + 1
      const right = left + 1
      const leftEntry = this.values[left]
      const rightEntry = this.values[right]
      const child = rightEntry && leftEntry && precedes(rightEntry, leftEntry) ? right : left
      const childEntry = this.values[child]
      const parent = this.values[index]
      if (!childEntry || !parent || !precedes(childEntry, parent)) break
      this.values[index] = childEntry
      this.values[child] = parent
      index = child
    }
    return result
  }
}

function precedes(left: Entry, right: Entry): boolean {
  return left.score === right.score ? left.serial < right.serial : left.score < right.score
}
