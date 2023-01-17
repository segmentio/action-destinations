export const BaseAlgoliaInsightsURL = 'https://insights.algolia.io'
export const AlgoliaBehaviourURL = BaseAlgoliaInsightsURL + '/1/events'

type EventCommon = {
  eventName: string
  index: string
  userToken: string
  objectIDs: string[]
  timestamp?: number
}

export type AlgoliaProductViewedEvent = EventCommon & {
  eventType: 'view'
}

export type AlgoliaProductClickedEvent = EventCommon & {
  eventType: 'click'
  queryID: string
  positions: number[]
}

export type AlgoliaConversionEvent = EventCommon & {
  eventType: 'conversion'
}
