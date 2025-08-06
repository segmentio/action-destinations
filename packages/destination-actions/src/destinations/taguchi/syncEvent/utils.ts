import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { RequestClient, PayloadValidationError, MultiStatusResponse, JSONLikeObject } from '@segment/actions-core'
import { TaguchiEventJSON, EventItem, EventResponseJSON, EventData } from './types'

export function validate(payloads: Payload[]): Payload[] {
  for (const payload of payloads) {
    if (!payload.target || Object.keys(payload.target).length === 0) {
      throw new PayloadValidationError('At least one target identifier is required.')
    }
  }
  return payloads
}

export async function send(request: RequestClient, payloads: Payload[], settings: Settings, isBatch: boolean) {
  validate(payloads)

  const json: TaguchiEventJSON = payloads.map((payload) => buildEventJSON(payload))

  const response = await request<EventResponseJSON>(`${settings.integrationURL}/subscriber`, {
    method: 'POST',
    json,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`
    }
  })

  if (isBatch) {
    const multiStatusResponse = new MultiStatusResponse()
    response.data.forEach((res, index) => {
      if (res.code >= 200 && res.code < 300) {
        multiStatusResponse.setSuccessResponseAtIndex(index, {
          status: res.code,
          sent: json[index] as unknown as JSONLikeObject,
          body: res as unknown as JSONLikeObject
        })
      } else {
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status: res.code,
          sent: json[index] as unknown as JSONLikeObject,
          body: res as unknown as JSONLikeObject,
          errormessage: res.description
        })
      }
    })
    return multiStatusResponse
  }

  return response
}

function buildEventJSON(payload: Payload): EventItem {
  const eventItem: EventItem = {
    event: {
      target: payload.target,
      isTest: payload.isTest || false,
      data: (payload.eventData || {}) as EventData,
      type: payload.eventType || 'p'
    }
  }

  return eventItem
}
