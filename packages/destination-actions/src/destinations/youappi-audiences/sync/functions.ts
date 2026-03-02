import { RequestClient, MultiStatusResponse, JSONLikeObject, IntegrationError } from '@segment/actions-core'
import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { URL } from '../constants'
import { RequestJSON } from './types'

export async function send(
  request: RequestClient,
  payloads: Payload[],
  settings: Settings,
  isBatch: boolean
) {
  const msResponse = new MultiStatusResponse()
  const addMap = new Map<number, Payload>()
  const deleteMap = new Map<number, Payload>()

  payloads.forEach((payload, index) => {
    const { 
      traits_or_props, 
      audience_name 
    } = payload

    const isAudienceMember = traits_or_props && typeof audience_name === 'string' && traits_or_props[audience_name] === true

    if (isAudienceMember) {
      addMap.set(index, payload)
    } else {
      deleteMap.set(index, payload)
    }
  })

  const requests: Promise<void>[] = []

  if (addMap.size > 0) {
    requests.push(sendRequest(request, addMap, settings, msResponse, isBatch, 'add'))
  }

  if (deleteMap.size > 0) {
    requests.push(sendRequest(request, deleteMap, settings, msResponse, isBatch, 'remove'))
  }

  await Promise.all(requests)

  if (isBatch) {
    return msResponse
  }

}

export async function sendRequest(
  request: RequestClient,
  map: Map<number, Payload>,
  settings: Settings,
  msResponse: MultiStatusResponse,
  isBatch: boolean, 
  action: 'add' | 'remove'
): Promise<void> {
  const indices = Array.from(map.keys())
  const payloads = Array.from(map.values())
  const json = getJSON(payloads, settings, action)

  try {
    await request(`${URL}`, {
      method: 'post',
      json
    })

    for (let i = 0; i < indices.length; i++) {
      const originalIndex = indices[i]
      const { audience_name, audience_id } = payloads[i]
      msResponse.setSuccessResponseAtIndex(originalIndex, {
        status: 200,
        body: payloads[i] as unknown as JSONLikeObject,
        sent: { 
          device_identities: getIds(payloads[i]),
          audiences:getAudiences(audience_id, audience_name, action)
        }
      })
    }
  } 
  catch (error) {
    const { message, code, status } = error
    
    if (!isBatch) {
      throw new IntegrationError((message || 'Unknown error') as string, (code || "Error") as string, (status|| 400) as number)
    }

    for (let i = 0; i < indices.length; i++) {
      const originalIndex = indices[i]
      const { audience_name, audience_id } = payloads[i]
      msResponse.setErrorResponseAtIndex(originalIndex, {
        status,
        errortype: code,
        errormessage: message,
        body: payloads[i] as unknown as JSONLikeObject,
        sent: { 
          device_identities: getIds(payloads[i]),
          audiences:getAudiences(audience_id, audience_name, action)
        }
      })
    }
  }
}

export function getJSON(payloads: Payload[], settings: Settings, action: 'add' | 'remove'): RequestJSON {
  const { api_key } = settings
  const { audience_id, audience_name } = payloads[0]
  
  const json: RequestJSON = {
    api_key,
    device_identities: payloads.flatMap((payload) => {
      return getIds(payload)
    }),
    audiences: getAudiences(audience_id, audience_name, action)
  }
  return json
}

function getIds (payload: Payload): RequestJSON['device_identities'] {
  const { idfa, gaid } = payload
  const identities: Array<{ type: 'IDFA' | 'GAID', value: string }> = []
  if (idfa) identities.push({ type: 'IDFA', value: idfa })
  if (gaid) identities.push({ type: 'GAID', value: gaid })
  return identities
}

function getAudiences(audience_id: string, audience_name: string, action: 'add' | 'remove'): RequestJSON['audiences']{
  return [{
    audience_id: [...audience_id].reduce((h, c) => (h = (h << 5) - h + c.charCodeAt(0) | 0), 0),
    audience_name,
    action
  }]
}