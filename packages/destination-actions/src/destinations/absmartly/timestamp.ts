import { JSONPrimitive } from '@segment/actions-core'

export function isValidTimestamp(timestamp: JSONPrimitive): boolean {
  if (typeof timestamp === 'number') {
    return timestamp >= 1262304000000 && timestamp <= 2524608000000
  } else if (typeof timestamp === 'string') {
    return !isNaN(Date.parse(timestamp))
  }
  return false
}

export function unixTimestampOf(timestamp: JSONPrimitive): number {
  if (typeof timestamp === 'number') return timestamp
  return Date.parse(timestamp as string)
}
