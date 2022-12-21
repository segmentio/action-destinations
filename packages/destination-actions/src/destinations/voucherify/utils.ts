export const trackApiEndpoint = (accountRegion?: string) => {
  if (accountRegion === AccountRegion.US) {
    return 'https://us1.api.voucherify.io'
  }
  if (accountRegion === AccountRegion.AS) {
    return 'https://as1.api.voucherify.io'
  }
  return 'https://api.voucherify.io'
}

export enum AccountRegion {
  EU = 'EU',
  US = 'US',
  AS = 'AS'
}
