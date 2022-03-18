export declare const endpoints: {
  track: {
    north_america: string
    europe: string
    us2: string
  }
  batch: {
    north_america: string
    europe: string
    us2: string
  }
}
export declare function getEndpointByRegion(endpoint: keyof typeof endpoints, region?: string): string
export default endpoints
