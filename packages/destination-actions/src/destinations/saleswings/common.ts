import { RequestFn } from '@segment/actions-core'
import { apiBaseUrl, Event, EventBatch } from './api'
import { Settings } from './generated-types'

export function perform<Payload>(convertEvent: (payload: Payload) => Event | undefined): RequestFn<Settings, Payload> {
  return (request, data) => {
    const event = convertEvent(data.payload)
    if (!event) return
    return request(`${apiBaseUrl}/events`, {
      method: 'post',
      json: event,
      headers: { Authorization: `Bearer ${data.settings.apiKey}` }
    })
  }
}

export function performBatch<Payload>(
  convertEvent: (payload: Payload) => Event | undefined
): RequestFn<Settings, Payload[]> {
  return (request, data) => {
    const batch = convertEventBatch(data.payload, convertEvent)
    if (!batch) return
    return request(`${apiBaseUrl}/events/batches`, {
      method: 'post',
      json: batch,
      headers: { Authorization: `Bearer ${data.settings.apiKey}` }
    })
  }
}

function convertEventBatch<Payload>(
  payloads: Payload[],
  convertEvent: (payload: Payload) => Event | undefined
): EventBatch | undefined {
  const events = payloads.map(convertEvent).filter((evt) => evt) as Event[]
  if (events.length == 0) return undefined
  return { events }
}
