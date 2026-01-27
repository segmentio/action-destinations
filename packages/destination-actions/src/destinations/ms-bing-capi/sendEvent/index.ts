import { ActionDefinition, RequestClient, JSONLikeObject, MultiStatusResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { data, customData, userData, items, hotelData, timestamp, enable_batching, batch_size } from './fields'
import { API_URL } from './constants'
import { BingCAPIRequestItem, MSMultiStatusResponse } from './types'
import { processHashing } from '../../../lib/hashing-utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send CAPI Event',
  description: 'Send a track or page event to Microsoft Bing CAPI.',
  defaultSubscription: 'type = "track" or type = "page"',
  fields: {
    data,
    userData,
    customData,
    items,
    hotelData,
    timestamp,
    enable_batching,
    batch_size
  },
  perform: async (request, { payload, settings }) => {
    return await send(request, [payload], settings, false)
  },
  performBatch: async (request, { payload, settings }) => {
    return await send(request, payload, settings, true)
  }
}

async function send(request: RequestClient, payloads: Payload[], settings: Settings, isBatch: boolean) {
  const json: BingCAPIRequestItem[] = []
  const multiStatusResponse = new MultiStatusResponse()

  payloads.forEach((payload) => {
    const {
      timestamp,
      data: { eventTime, eventType, adStorageConsent, eventSourceUrl, eventName } = {},
      userData: { em, ph, ...restOfUserData } = {},
      customData,
      items,
      hotelData
    } = payload
    const jsonItem: BingCAPIRequestItem = {
      ...data,
      eventType: eventType as 'pageLoad' | 'custom',
      eventTime: Math.floor(new Date(eventTime ?? timestamp).getTime() / 1000),
      adStorageConsent: adStorageConsent ?? settings.adStorageConsent,
      eventSourceUrl: eventSourceUrl,
      eventName: eventName,
      userData: {
        ...restOfUserData,
        em: em ? processHashing(em, 'sha256', 'hex', (v) => v.trim().toLowerCase()) : null,
        ph: ph ? processHashing(ph, 'sha256', 'hex', (v) => v.trim().replace(/\D/g, '')) : null
      },
      customData: customData && {
        ...customData,
        hotelData,
        items: items ?? []
      },
      continueOnValidationError: true
    }

    json.push(jsonItem)
  })

  const response = await request<MSMultiStatusResponse>(`${API_URL}${settings.UetTag}/events`, {
    method: 'post',
    json: {
      data: json
    }
  })

  const details = response.data?.error?.details ?? []

  payloads.forEach((payload, index) => {
    const error = details.find((detail) => detail.index === index)
    if (error) {
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: 400,
        errormessage: error.errorMessage,
        sent: payload as object as JSONLikeObject,
        body: String(json[index])
      })
    } else {
      multiStatusResponse.setSuccessResponseAtIndex(index, {
        status: 200,
        sent: payload as object as JSONLikeObject,
        body: String(json[index])
      })
    }
  })

  return isBatch ? multiStatusResponse : response
}

export default action
