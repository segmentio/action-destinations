import type { Settings } from './generated-types'

export const trackApiEndpoint = (accountRegion?: string) => {
  // Will be changed to proper URL
  if (accountRegion === AccountRegion.EU) {
    return 'http://localhost:3005'
  } else if (accountRegion === AccountRegion.US) {
    return 'http://localhost:3005'
  } else if (accountRegion === AccountRegion.AS) {
    return 'http://localhost:3005'
  }
  return 'http://localhost:3005'
}

export enum AccountRegion {
  EU = 'EU',
  US = 'US',
  AS = 'AS'
}

export const setVoucherifyRequestURL = (settings: Settings, eventType: string) => {
  let voucherifyRequestURL: string

  if (settings.customURL) {
    voucherifyRequestURL = `${settings.customURL}/segmentio/${eventType}-processing`
  } else if (settings.apiEndpoint) {
    voucherifyRequestURL = `${trackApiEndpoint(settings.apiEndpoint)}/segmentio/${eventType}-processing`
  } else {
    throw new Error('URL not provided.')
  }
  return voucherifyRequestURL
}
