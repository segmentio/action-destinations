/**
 * Checks if value is already hashed with sha256 to avoid double hashing
 */
import * as crypto from 'crypto'

const sha256HashedRegex = /^[a-f0-9]{64}$/i

export function sha256SmartHash(value: string): string {
  if (sha256HashedRegex.test(value)) {
    return value
  }
  return crypto.createHash('sha256').update(value).digest('hex')
}
