/**
 * A FullStory data region.
 */
interface DataRegion {
  label: string
  value: string
  baseUrl: string
}

/**
 * Supported FullStory data regions.
 */
export const dataRegions: DataRegion[] = [
  {
    label: 'North America',
    value: 'north_america',
    baseUrl: 'https://api.fullstory.com'
  },
  {
    label: 'Europe',
    value: 'europe',
    baseUrl: 'https://api.eu1.fullstory.com'
  }
]
