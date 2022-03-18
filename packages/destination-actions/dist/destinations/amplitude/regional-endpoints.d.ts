export declare const endpoints: {
  batch: {
    north_america: string
    europe: string
  }
  deletions: {
    north_america: string
    europe: string
  }
  httpapi: {
    north_america: string
    europe: string
  }
  identify: {
    north_america: string
    europe: string
  }
  groupidentify: {
    north_america: string
    europe: string
  }
  usermap: {
    north_america: string
    europe: string
  }
  usersearch: {
    north_america: string
    europe: string
  }
}
export declare function getEndpointByRegion(endpoint: keyof typeof endpoints, region?: string): string
export default endpoints
