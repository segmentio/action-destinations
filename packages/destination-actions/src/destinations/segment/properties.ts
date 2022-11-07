interface SegmentEndpoint {
  label: string
  url: string
}

export const SEGMENT_ENDPOINTS: { [key: string]: SegmentEndpoint } = {
  north_america: {
    label: 'North America',
    url: 'https://api.segment.io/v1'
  },
  europe: {
    label: 'Europe',
    url: 'https://events.eu1.segmentapis.com/v1'
  }
}

export const DEFAULT_SEGMENT_ENDPOINT = 'north_america'
