import { MarketingStatus } from './constants'

export interface ProfileFieldConfig {
  key: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'date'
  description: string
  isPii?: boolean
}

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

export interface Advertiser {
  id: string
  name: string
}

export interface TokenInfoResponse {
  data: {
    tokenInfo: {
      scopesByAdvertiser: {
        nodes: {
          advertiser: Advertiser
          scopes: string[]
        }[]
        pageInfo: {
          hasNextPage: boolean
          endCursor: string
        }
      }
    }
  }
}

export interface Mapping {
  incomingKey: string
  destinationKey: string
  label: string
  type: string
  isPii: boolean  
  value?: string
}

export type MarketingStatus = typeof MarketingStatus[keyof typeof MarketingStatus]