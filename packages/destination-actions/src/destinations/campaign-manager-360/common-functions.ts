import { createHash } from 'crypto'

export const isHashedInformation = (information: string): boolean => new RegExp(/[0-9abcdef]{64}/gi).test(information)
export const hash = (value: string | undefined): string | undefined => {
  if (value === undefined) {
    return
  }

  const hash = createHash('sha256')
  hash.update(value)
  return hash.digest('hex')
}
