import type { Settings } from './generated-types'
import { ALGOLIA_INSIGHTS_API_VERSION } from './versioning-info'

export const BaseAlgoliaInsightsURL = 'https://insights.algolia.io'
export const AlgoliaBehaviourURL = BaseAlgoliaInsightsURL + `/${ALGOLIA_INSIGHTS_API_VERSION}/events`
export const algoliaApiPermissionsUrl = (settings: Settings) =>
  `https://${settings.appId}.algolia.net/${ALGOLIA_INSIGHTS_API_VERSION}/keys/${settings.apiKey}`

export type AlgoliaEventType = 'view' | 'click' | 'conversion'

export type AlgoliaEventSubtype = 'addToCart' | 'purchase'

type EventCommon = {
  eventName: string
  index: string
  userToken: string
  authenticatedUserToken?: string
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
