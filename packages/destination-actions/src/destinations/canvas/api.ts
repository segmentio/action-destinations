import { RequestFn } from '@segment/actions-core'
import { Settings } from './generated-types'

export type EventType = 'track' | 'identify' | 'group' | 'page' | 'screen'

export const getAuthUrl = (): string => `https://z17lngdoxi.execute-api.us-west-2.amazonaws.com/Prod/auth`
export const getEventUrl = (eventType: EventType): string =>
  `https://z17lngdoxi.execute-api.us-west-2.amazonaws.com/Prod/event/${eventType}`

export function perform<Payload>(eventType: EventType): RequestFn<Settings, Payload> {
  return (request, data) => {
    return request(getEventUrl(eventType), {
      method: 'post',
      json: [data.payload],
      headers: { Authorization: `Bearer ${data.settings.apiToken}` }
    })
  }
}

export function performBatch<Payload>(eventType: EventType): RequestFn<Settings, Payload[]> {
  return (request, data) => {
    return request(getEventUrl(eventType), {
      method: 'post',
      json: data.payload,
      headers: { Authorization: `Bearer ${data.settings.apiToken}` }
    })
  }
}
