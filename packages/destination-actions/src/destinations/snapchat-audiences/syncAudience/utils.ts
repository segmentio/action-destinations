import { createHash } from 'crypto'

export const hash = (value: string | undefined): string | undefined => {
  if (value === undefined) return

  const hash = createHash('sha256')
  hash.update(value)
  return hash.digest('hex')
}

const isHashedEmail = (email: string): boolean => new RegExp(/[0-9abcdef]{64}/gi).test(email)

export const hashEmailSafe = (email: string | undefined): string | undefined =>
  isHashedEmail(String(email)) ? email : hash(email)

