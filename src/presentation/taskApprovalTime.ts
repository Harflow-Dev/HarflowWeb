/**
 * Format a fixture Unix timestamp as Mac-style abbreviated date + shortened
 * time in UTC (Design: deterministic mock text, no viewer time zone).
 * Example: 1792000005 → "Oct 14, 2026, 5:46 PM"
 */
export function formatApprovalTimeUtc(unixSeconds: number): string {
  const date = new Date(unixSeconds * 1000)
  const month = date.toLocaleString('en-US', { timeZone: 'UTC', month: 'short' })
  const day = date.toLocaleString('en-US', { timeZone: 'UTC', day: 'numeric' })
  const year = date.toLocaleString('en-US', { timeZone: 'UTC', year: 'numeric' })
  const time = date.toLocaleString('en-US', {
    timeZone: 'UTC',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return `${month} ${day}, ${year}, ${time}`
}
