// eslint-disable-next-line no-restricted-syntax
import { createHash } from 'crypto'

export function sha256hash(data: string) {
  const hash = createHash('sha256')
  hash.update(data)
  return hash.digest('hex')
}
