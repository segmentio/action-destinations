export const endpoints = {
  north_america: 'https://api.intercom.io',
  europe: 'https://api.eu.intercom.io',
  australia: 'https://api.au.intercom.io'
}

type Region = 'north_america' | 'europe' | 'australia'

/**
 * Retrieves Intercom API endpoints for a given region. If the region
 * provided does not exist, the region defaults to 'north_america'.
 *
 * @param region data residency region
 * @returns regional API endpoint
 */
export function getEndpointByRegion(region?: string): string {
  return endpoints[region as Region] ?? endpoints['north_america']
}
