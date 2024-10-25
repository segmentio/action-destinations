import { RequestFn } from '@segment/actions-core'
import { Settings } from './generated-types'

export type EventType = 'track' | 'identify' | 'group' | 'page' | 'screen'

export const getAuthUrl = (): string => `https://events.canvasapp.com/v1/auth`
export const getEventUrl = (eventType: EventType): string => `https://events.canvasapp.com/v1/event/${eventType}`

export function perform<Payload>(eventType: EventType): RequestFn<Settings, Payload> {
  return (request, data) => {
    return request(getEventUrl(eventType), {
      method: 'post',
      json: [data.payload],
      headers: { 'X-Auth-Token': data.settings.apiToken }
    })
  }
}

export function performBatch<Payload>(eventType: EventType): RequestFn<Settings, Payload[]> {
  return (request, data) => {
    return request(getEventUrl(eventType), {
      method: 'post',
      json: data.payload,
      headers: { 'X-Auth-Token': data.settings.apiToken }
    })
  }
}
