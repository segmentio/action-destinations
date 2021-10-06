export const trackApiEndpoint = (accountRegion?: string) => {
  if (accountRegion === AccountRegion.EU) {
    return 'https://track-eu.customer.io'
  }

  return 'https://track.customer.io'
}

export enum AccountRegion {
  US = 'US 🇺🇸',
  EU = 'EU 🇪🇺'
}
