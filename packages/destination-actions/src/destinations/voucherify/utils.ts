export const trackApiEndpoint = (accountRegion?: string) => {
  if (accountRegion === AccountRegion.US) {
    return 'http://localhost:3005'
  }
  if (accountRegion === AccountRegion.AS) {
    return 'http://localhost:3005'
  }
  return 'http://localhost:3005'
}

export enum AccountRegion {
  EU = 'EU',
  US = 'US',
  AS = 'AS'
}
