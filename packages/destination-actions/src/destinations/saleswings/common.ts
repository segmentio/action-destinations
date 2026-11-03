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

const unknownFailureMessage = 'SalesWings did not accept the event'

const isErrorStatus = (status: number): boolean => Number.isInteger(status) && status >= 400 && status <= 599

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

    // A 207 lists the events that SalesWings did not accept, by their index in the batch. Any other successful
    // response, such as the 202 of earlier SalesWings versions, means that every event was queued.
    const failures = new Map<number, BatchErrorResponse>()
    if (response.status === 207 && Array.isArray(response.data?.errorResponses)) {
      for (const failure of response.data.errorResponses) failures.set(failure.index, failure)
    }

    const multiStatusResponse = new MultiStatusResponse()
    data.payload.forEach((payload, index) => {
      const sent = payload as unknown as JSONLikeObject
      // Only the indexes of the events of the batch are looked up, so entries with any other index are ignored.
      const failure = failures.get(index)
      if (failure) {
        // A failure without a valid error status is reported as 500, which Segment retries, rather than as a
        // permanent failure.
        const status = isErrorStatus(failure.status) ? failure.status : 500
        const message = failure.message || unknownFailureMessage
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status,
          errormessage: message,
          sent,
          body: { status, message, index }
        })
      } else {
        // The event was queued for processing, as a single event answered with 202 would be.
        multiStatusResponse.setSuccessResponseAtIndex(index, { status: 202, sent, body: 'Accepted' })
      }
    })
    return multiStatusResponse
  }
}
