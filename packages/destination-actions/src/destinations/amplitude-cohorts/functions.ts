import { AMPLITUDE_API_VERSION } from './versioning-info'
import { Region } from './types'

export const endpoints = {
  usersearch: {
    north_america: `https://amplitude.com/api/${AMPLITUDE_API_VERSION}/usersearch`,
    europe: `https://analytics.eu.amplitude.com/api/${AMPLITUDE_API_VERSION}/usersearch`
  }
}

/**
 * Retrieves Amplitude API endpoints for a given region. If the region
 * provided does not exist, the region defaults to 'north_america'.
 *
 * @param endpoint name of the API endpoint
 * @param region data residency region
 * @returns regional API endpoint
 */
export function getEndpointByRegion(endpoint: keyof typeof endpoints, region?: string): string {
  return endpoints[endpoint][region as Region] ?? endpoints[endpoint]['north_america']
}

export default endpoints
