import type { Settings } from './generated-types'
export const BaseAlgoliaInsightsURL = 'https://insights.algolia.io'
export const AlgoliaBehaviourURL = BaseAlgoliaInsightsURL + '/1/events'
export const algoliaApiPermissionsUrl = (settings: Settings) =>
  `https://${settings.appId}.algolia.net/1/keys/${settings.apiKey}`

type EventCommon = {
  eventName: string
  index: string
  userToken: string
  objectIDs: string[]
  timestamp?: number
  queryID?: string
}

export type AlgoliaProductViewedEvent = EventCommon & {
  eventType: 'view'
}

export type AlgoliaProductClickedEvent = EventCommon & {
  eventType: 'click'
  positions?: number[]
}

export type AlgoliaConversionEvent = EventCommon & {
  eventType: 'conversion'
}

export type AlgoliaApiPermissions = { acl: string[] }
