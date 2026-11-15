import type { TaskChangesEntryRef, TaskChangesRow } from '../model'

type PathFacts = {
  readonly path: string | null
  readonly pathBytesB64: string | null
}

/**
 * Path as drawn: the UTF-8 path when the engine sent one, otherwise the raw
 * bytes decoded leniently with every byte that is not valid UTF-8 escaped as
 * `\xNN` (so `legacy/caf` + byte 0xE9 reads `legacy/caf\xe9.txt`).
 */
export function changesDisplayPath(facts: PathFacts): string {
  if (facts.path !== null) return facts.path
  if (facts.pathBytesB64 === null) return ''
  return escapeBytes(decodeBase64(facts.pathBytesB64))
}

export function changesEntryDisplayPath(entry: TaskChangesEntryRef): string {
  return changesDisplayPath(entry)
}

/** True when the engine could only give this path as raw bytes. */
export function changesPathIsBytes(row: Pick<TaskChangesRow, 'path' | 'pathBytesB64'>): boolean {
  return row.path === null && row.pathBytesB64 !== null
}

/** Stable React key for a listing row. */
export function changesRowKey(row: PathFacts): string {
  return row.path ?? `b64:${row.pathBytesB64 ?? ''}`
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function escapeBytes(bytes: Uint8Array): string {
  let out = ''
  let i = 0
  while (i < bytes.length) {
    const length = utf8SequenceLength(bytes, i)
    if (length === 0) {
      out += `\\x${bytes[i]!.toString(16).padStart(2, '0')}`
      i += 1
      continue
    }
    out += new TextDecoder().decode(bytes.subarray(i, i + length))
    i += length
  }
  return out
}

/** Length of the valid UTF-8 sequence starting at `at`, or 0 when invalid. */
function utf8SequenceLength(bytes: Uint8Array, at: number): number {
  const lead = bytes[at]!
  if (lead < 0x80) return 1
  const length = lead >= 0xf0 && lead <= 0xf4 ? 4 : lead >= 0xe0 ? 3 : lead >= 0xc2 ? 2 : 0
  if (length === 0 || lead > 0xf4 || at + length > bytes.length) return 0
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(
      bytes.subarray(at, at + length),
    )
  } catch {
    return 0
  }
  return length
}
