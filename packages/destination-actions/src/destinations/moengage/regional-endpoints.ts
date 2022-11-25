export const endpoints = {
  DC_01: 'https://api-01.moengage.com',
  DC_02: 'https://api-02.moengage.com',
  DC_03: 'https://api-03.moengage.com',
  DC_04: 'https://api-04.moengage.com'
}

type Region = 'DC_01' | 'DC_02'

/**
 * Retrieves Moengage API endpoints for a given region. If the region
 * provided does not exist, the region defaults to 'DC_01'.
 *
 * @param region data residency region
 * @returns regional API endpoint
 */
export function getEndpointByRegion(region?: string): string {
  return endpoints[region as Region] ?? endpoints['DC_01']
}

export default endpoints
