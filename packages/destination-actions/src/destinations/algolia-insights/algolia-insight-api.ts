import type { Settings } from './generated-types'
export const BaseAlgoliaInsightsURL = 'https://insights.algolia.io'
export const AlgoliaBehaviourURL = BaseAlgoliaInsightsURL + '/1/events'
export const algoliaApiPermissionsUrl = (settings: Settings) =>
  `https://${settings.appId}.algolia.net/1/keys/${settings.apiKey}`

export type AlgoliaEventType = 'view' | 'click' | 'conversion'

export type AlgoliaEventSubtype = 'addToCart' | 'purchase'

type EventCommon = {
  eventName: string
  index: string
  userToken: string
  timestamp?: number
  queryID?: string
  eventType: AlgoliaEventType
}

export type AlgoliaProductViewedEvent = EventCommon & {
  objectIDs: string[]
}

export type AlgoliaProductClickedEvent = EventCommon & {
  positions?: number[]
  objectIDs: string[]
}

export type AlgoliaFilterClickedEvent = EventCommon & {
  filters: string[]
}

export type AlgoliaConversionEvent = EventCommon & {
  eventSubtype?: AlgoliaEventSubtype
  objectIDs: string[]
  objectData?: {
    queryID?: string
    price?: number | string
    discount?: number | string
    quantity?: number
  }[]
  value?: number
  currency?: string
}

export type AlgoliaApiPermissions = {
  acl: string[]
}
