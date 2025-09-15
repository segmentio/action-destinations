import { ActionDefinition, RequestClient, JSONLikeObject, MultiStatusResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { data, customData, userData } from './fields'
import { API_URL } from './constants'
import { BingCAPIRequestItem, MSMultiStatusResponse } from './types'
import { processHashing } from '../../../lib/hashing-utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send CAPI Event',
  description: 'Send a track or page event to Microsoft Bing CAPI.',
  defaultSubscription: 'type = "track" or type = "page"',
  fields: {
    data: data,
    userData: userData,
    customData: customData
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
      data: { eventType, eventTime, eventSourceUrl, ...restOfData },
      userData: { em, ph, ...restOfUserData } = {},
      customData,
    } = payload

    const jsonItem: BingCAPIRequestItem = {
      data: {
        ...restOfData,
        eventType: eventType as 'pageLoad' | 'custom',
        eventTime: Math.floor(new Date(eventTime ?? Date.now()).getTime() / 1000),
        eventSourceUrl,
        userData: {
          ...restOfUserData,
          em: em ? processHashing(em, 'sha256', 'hex', v => v.trim().toLowerCase()) : undefined,
          ph: ph ? processHashing(ph, 'sha256', 'hex', v => v.trim().replace(/\D/g, '')) : undefined,
        },
        customData: customData && {
          ...customData,
          items: customData.items
        }
      }
    }

    json.push(jsonItem)
  })

  const response = await request<MSMultiStatusResponse>(`${API_URL}${settings.UetTag}/events`, {
    method: 'post',
    throwHttpErrors: false,
    json
  })

  const details = response.data?.error?.details 

  payloads.forEach((payload, index) => {
    const error = details.find((detail) => detail.index === index)
    if(error){
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
