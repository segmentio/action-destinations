import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { RequestClient, PayloadValidationError, MultiStatusResponse, JSONLikeObject } from '@segment/actions-core'
import { TaguchiJSON, JSONItem, ResponseJSON } from './types'

export function validate(payloads: Payload[]): Payload[] {
  if (payloads.length === 1) {
    const p = payloads[0]
    if (!p.identifiers || Object.keys(p.identifiers).length === 0) {
      throw new PayloadValidationError('At least one identifier is required.')
    }
  }
  return payloads
}

export async function send(request: RequestClient, payloads: Payload[], settings: Settings, isBatch: boolean) {
  validate(payloads)

  const json: TaguchiJSON = payloads.map((payload) => buildJSON(payload, settings.organizationId))

  const response = await request<ResponseJSON>(`${settings.integrationURL}/subscriber`, {
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

function buildJSON(payload: Payload, organizationId: string): JSONItem {
  const {
    identifiers,
    traits: {
      title,
      firstname,
      lastname,
      dob,
      address,
      address2,
      address3,
      suburb,
      state,
      country,
      postcode,
      gender,
      ...customTraits
    } = {}
  } = payload

  const json: JSONItem = {
    profile: {
      organizationId: Number(organizationId),
      // Add identifiers
      ...identifiers,
      // Add standard traits
      ...(title && { title }),
      ...(firstname && { firstname }),
      ...(lastname && { lastname }),
      ...(dob && { dob }),
      ...(address && { address }),
      ...(address2 && { address2 }),
      ...(address3 && { address3 }),
      ...(suburb && { suburb }),
      ...(state && { state }),
      ...(country && { country }),
      ...(postcode && { postcode }),
      ...(gender && { gender }),
      // Add custom traits
      ...buildCustom(customTraits),
      // Add lists as proper array
      ...buildLists(payload)
    }
  }
  return json
}

function buildCustom(customTraits: Payload['traits']): { custom?: Record<string, unknown> } {
  if (customTraits && Object.keys(customTraits).length > 0) {
    return {
      custom: customTraits
    }
  }
  return {}
}

function buildLists(payload: Payload): { lists?: Array<{ listId: number; unsubscribedTimestamp?: string | null }> } {
  const lists = []

  if (payload.subscribeLists && payload.subscribeLists.length > 0) {
    lists.push(
      ...payload.subscribeLists.map((list) => ({
        listId: Number(list),
        unsubscribedTimestamp: null
      }))
    )
  }

  if (payload.unsubscribeLists && payload.unsubscribeLists.length > 0) {
    lists.push(
      ...payload.unsubscribeLists.map((list) => ({
        listId: Number(list),
        unsubscribedTimestamp: payload.timestamp
      }))
    )
  }

  return lists.length > 0 ? { lists } : {}
}
