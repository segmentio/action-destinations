import { JSONLikeObject, MultiStatusResponse, RequestFn } from '@segment/actions-core'
import { submitEventUrl, submitEventBatchUrl, EventType } from './api'
import { Settings } from './generated-types'

// An event of a batch that SalesWings did not accept, by its index in the batch.
interface BatchErrorResponse {
  status: number
  message: string
  index: number
}

// Body of the 207 response to a batch. It lists only the events that failed.
interface BatchResponse {
  itemsProcessed: number
  success: number
  error: number
  errorResponses: BatchErrorResponse[]
}

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
  return async (request, data) => {
    const response = await request<BatchResponse>(submitEventBatchUrl(data.settings.environment, eventType), {
      method: 'post',
      json: data.payload,
      headers: { Authorization: `Bearer ${data.settings.apiKey}` }
    })

    // Every event that SalesWings did not list as failed was queued for processing, as a single event answered with 202
    // would be. A response without that list, such as the 202 of earlier SalesWings versions, means that every event
    // was queued.
    const errorResponses = response.status === 207 ? response.data?.errorResponses : undefined
    const multiStatusResponse = new MultiStatusResponse()
    data.payload.forEach((payload, index) => {
      multiStatusResponse.setSuccessResponseAtIndex(index, {
        status: 202,
        sent: payload as unknown as JSONLikeObject,
        body: 'Accepted'
      })
    })
    if (Array.isArray(errorResponses)) {
      for (const { status, message, index } of errorResponses) {
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status,
          errormessage: message,
          sent: data.payload[index] as unknown as JSONLikeObject,
          body: { status, message, index }
        })
      }
    }
    return multiStatusResponse
  }
}
