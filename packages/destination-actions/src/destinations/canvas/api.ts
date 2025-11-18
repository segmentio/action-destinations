import { RequestFn } from '@segment/actions-core'
import { Settings } from './generated-types'
import { CANVAS_API_VERSION } from '../versioning-info'

export type EventType = 'track' | 'identify' | 'group' | 'page' | 'screen'

export const getAuthUrl = (): string => `https://events.canvasapp.com/${CANVAS_API_VERSION}/auth`
export const getEventUrl = (eventType: EventType): string =>
  `https://events.canvasapp.com/${CANVAS_API_VERSION}/event/${eventType}`

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
