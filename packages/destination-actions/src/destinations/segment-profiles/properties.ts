interface SegmentEndpoint {
  label: string
  url: string
  cdn: string
}

export const SEGMENT_ENDPOINTS: { [key: string]: SegmentEndpoint } = {
  north_america: {
    label: 'North America',
    url: 'https://api.segment.io/v1',
    cdn: 'https://cdn.segment.com/v1'
  },
  europe: {
    label: 'Europe',
    url: 'https://events.eu1.segmentapis.com/v1',
    cdn: 'https://cdn.segment.com/v1'
  }
  // Special scenario: The following lines enables Staging configuration in Settings
  // and should be un-commented while running a push in Production environment
  // stage: {
  //   label: 'Staging',
  //   url: 'https://api.segment.build/v1',
  //   cdn: 'https://cdn.segment.build/v1'
  // }
}

export const DEFAULT_SEGMENT_ENDPOINT = 'north_america'

export const PAGINATION_COUNT = 10
