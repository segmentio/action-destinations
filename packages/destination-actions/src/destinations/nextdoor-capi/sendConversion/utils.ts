import { createHash } from 'crypto'

export function hashAndEncode(value: string) {
  return createHash('sha256').update(value).digest('hex')
}
