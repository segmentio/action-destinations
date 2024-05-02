import { createHash } from 'crypto'

export function hashAndEncode(property: string) {
  return createHash('sha256').update(property).digest('hex')
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

