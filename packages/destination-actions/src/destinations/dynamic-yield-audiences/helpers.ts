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

function getDomain(dataCenter: string): string {
  let domain = 'dev-use1'
  switch (dataCenter) {
    case 'US':
      domain = 'use1'
      break
    case 'EU':
      domain = 'euc1'
      break
    case 'DEV':
      domain = 'dev-use1'
      break
  }
  return domain
}

export function getUpsertURL(dataCenter: string): string {
  return `https://cdp-extensions-api.${getDomain(dataCenter)}.dynamicyield.com/cdp/segment/audiences/membership-change`
}

export function getCreateAudienceURL(dataCenter: string): string {
  return `https://cdp-extensions-api.${getDomain(dataCenter)}.dynamicyield.com/cdp/segment/audiences/subscription`
}

export function getDataCenter(sectionId: string) {
  return sectionId.toLocaleLowerCase().startsWith('9')
    ? 'EU'
    : sectionId.toLocaleLowerCase().startsWith('8')
    ? 'US'
    : 'DEV'
}

export function getSectionId(sectionId: string) {
  return sectionId.toLocaleLowerCase().replace('dev', '')
}
