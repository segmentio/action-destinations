import { SEGMENT_PROFILES_API_VERSION } from '../versioning-info'

interface SegmentEndpoint {
  label: string
  url: string
  cdn: string
  papi: string
}
const SEG_ENDPOINT: { [key: string]: SegmentEndpoint } = {
  north_america: {
    label: 'North America',
    url: `https://api.segment.io/${SEGMENT_PROFILES_API_VERSION}`,
    cdn: `https://cdn.segment.com/${SEGMENT_PROFILES_API_VERSION}`,
    papi: 'https://api.segmentapis.com'
  },
  europe: {
    label: 'Europe',
    url: `https://events.eu1.segmentapis.com/${SEGMENT_PROFILES_API_VERSION}`,
    cdn: `https://cdn.segment.com/${SEGMENT_PROFILES_API_VERSION}`,
    papi: 'https://eu1.api.segmentapis.com'
  }
}
if (process.env.NODE_ENV != 'production') {
  SEG_ENDPOINT.stage = {
    label: 'Staging',
    url: `https://api.segment.build/${SEGMENT_PROFILES_API_VERSION}`,
    cdn: `https://cdn.segment.build/${SEGMENT_PROFILES_API_VERSION}`,
    papi: 'https://api.segmentapis.build'
  }
}
export const SEGMENT_ENDPOINTS = SEG_ENDPOINT
export const DEFAULT_SEGMENT_ENDPOINT = 'north_america'

export const PAGINATION_COUNT = 10
