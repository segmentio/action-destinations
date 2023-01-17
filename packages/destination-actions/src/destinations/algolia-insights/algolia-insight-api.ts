type EventCommon = {
  eventName: string
  index: string
  userToken: string
  objectIDs: string[]
  timestamp?: number
}

export type ProductViewedEvent = EventCommon & {
  eventType: 'view'
}

export type ProductClickedEvent = EventCommon & {
  eventType: 'click'
  queryID: string
  positions: number[]
}

export type ConversionEvent = EventCommon & {
  eventType: 'conversion'
}
