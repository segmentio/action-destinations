import { ROKT_API_VERSION } from './versioning-info'

export const CONSTANTS = {
  // rokt
  INCLUDE: 'include',
  EXCLUDE: 'exclude',
  ROKT_API_BASE_URL: `https://data.rokt.com/${ROKT_API_VERSION}`,
  ROKT_API_CUSTOM_AUDIENCE_ENDPOINT: '/import/suppression',
  ROKT_API_AUTH_ENDPOINT: '/auth-check',

  // segment
  SUPPORTED_SEGMENT_COMPUTATION_ACTION: 'audience'
}
