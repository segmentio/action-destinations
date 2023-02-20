import { RequestFn } from '@segment/actions-core'
import { submitEventUrl, submitEventBatchUrl, EventType } from './api'
import { Settings } from './generated-types'

export function perform<Payload>(eventType: EventType): RequestFn<Settings, Payload> {
  return (request, data) => {
    return request(submitEventUrl(data.settings.environment, eventType), {
      method: 'post',
      json: data.payload,
      headers: { Authorization: `Bearer ${data.settings.apiKey}` }
    })
  }
}

export function performBatch<Payload>(eventType: EventType): RequestFn<Settings, Payload[]> {
  return (request, data) => {
    return request(submitEventBatchUrl(data.settings.environment, eventType), {
      method: 'post',
      json: data.payload,
      headers: { Authorization: `Bearer ${data.settings.apiKey}` }
    })
  }
}
