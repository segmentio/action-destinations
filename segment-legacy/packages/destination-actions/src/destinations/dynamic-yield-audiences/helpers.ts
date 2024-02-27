import { createHash } from 'crypto'
import { Settings } from './generated-types'
import { DOMAIN } from './constants'

export function hashAndEncode(property: string) {
  return createHash('sha256').update(property).digest('hex')
}

export function getValidationURL(settings: Settings): string {
  return settings.fullVerifyURL ?? `https://${DOMAIN}.${settings.dataCenter}/audiences/verify/`
}

export function getUpsertURL(settings: Settings): string {
  return settings.fullUpsertURL ?? `https://${DOMAIN}.${settings.dataCenter}/audiences/upsert/`
}
