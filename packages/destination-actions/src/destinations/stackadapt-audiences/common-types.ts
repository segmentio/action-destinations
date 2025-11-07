export interface AdvertiserScopesResponse {
  data: {
    tokenInfo: {
      scopesByAdvertiser: {
        nodes: {
          advertiser: {
            id: string
            name: string
          }
          scopes: string[]
        }[]
      }
    }
  }
}
