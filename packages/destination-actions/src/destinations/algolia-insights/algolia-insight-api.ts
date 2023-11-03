import type { Settings } from './generated-types'
export const BaseAlgoliaInsightsURL = 'https://insights.algolia.io'
export const AlgoliaBehaviourURL = BaseAlgoliaInsightsURL + '/1/events'
export const algoliaApiPermissionsUrl = (settings: Settings) =>
  `https://${settings.appId}.algolia.net/1/keys/${settings.apiKey}`

type EventCommon = {
  eventName: string
  index: string
  userToken: string
  timestamp?: number
  queryID?: string
}

export type AlgoliaProductViewedEvent = EventCommon & {
  eventType: 'view'
  objectIDs: string[]
}

export type AlgoliaProductClickedEvent = EventCommon & {
  eventType: 'click'
  positions?: number[]
  objectIDs: string[]
}

export type AlgoliaFilterClickedEvent = EventCommon & {
  eventType: 'click'
  filters: string[]
}

export type AlgoliaConversionEvent = EventCommon & {
  eventType: 'conversion'
  objectIDs: string[]
}

export type AlgoliaApiPermissions = {
  acl: string[]
}
