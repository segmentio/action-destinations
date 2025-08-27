import { processHashing } from '../../lib/hashing-utils'

export function hashAndEncode(property: string): string {
  return processHashing(property, 'sha256', 'hex')
}

export function hashAndEncodeToInt(property: string): number {
  const hash = processHashing(property, 'sha256', 'hex')
  const bigInt = BigInt('0x' + hash)
  let integerString = bigInt.toString()
  if (integerString.length > 16) {
    integerString = integerString.substring(0, 16)
  }
  return Number(integerString)
}

export function getUpsertURL(): string {
  return `https://cdp-extensions-api.use1.dev.pub.dydy.io/cdp/segment/audiences/membership-change`
}

export function getCreateAudienceURL(): string {
  return `https://cdp-extensions-api.use1.dev.pub.dydy.io/cdp/segment/audiences/subscription`
}

export function getSectionId(sectionId: string) {
  return sectionId.toLocaleLowerCase().replace('dev', '')
}
