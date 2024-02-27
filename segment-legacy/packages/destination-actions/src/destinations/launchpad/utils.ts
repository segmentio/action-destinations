export enum ApiRegions {
  US = 'US 🇺🇸',
  EU = 'EU 🇪🇺'
}

// export enum StrictMode {
//   ON = '1',
//   OFF = '0'
// }

export function getConcatenatedName(firstName: unknown, lastName: unknown, name: unknown): unknown {
  return name ?? (firstName && lastName ? `${firstName} ${lastName}` : undefined)
}

export function getApiServerUrl(apiRegion: string | unknown) {
  if (apiRegion == ApiRegions.EU) {
    return 'https://data.launchpad.pm/'
  }
  return 'https://data.launchpad.pm/'
}
