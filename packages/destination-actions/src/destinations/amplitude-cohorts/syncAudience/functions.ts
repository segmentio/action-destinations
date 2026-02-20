import { RequestClient, MultiStatusResponse, JSONLikeObject, PayloadValidationError, ErrorCodes } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { UploadToCohortJSON, UploadToCohortResponse, ResponseError } from './types'
import { ID_TYPES, OPERATIONS } from '../constants'
import { getEndpointByRegion } from '../functions'

export async function send(
  request: RequestClient,
  payloads: Payload[],
  settings: Settings,
  isBatch: boolean
) {
  const { 
    engage_fields: { 
      segment_external_audience_id: audienceId,
      segment_audience_key: audience_key
    },
    id_type
  } = payloads[0]

  const msResponse = new MultiStatusResponse()

  if(payloads.some(p => p.id_type !== id_type)) {
    return returnErrorResponse(msResponse, payloads, isBatch, 'All payloads must have the same id_type')
  }

  const {
    endpoint
  } = settings 

  const addMap = new Map<number, Payload>()
  const deleteMap = new Map<number, Payload>()

  payloads.forEach((payload, index) => {
    const { 
      engage_fields: { 
        traits_or_properties
      }
    } = payload

    const isAudienceMember = traits_or_properties && typeof audience_key === 'string' && traits_or_properties[audience_key] === true
    
    if (isAudienceMember) {
      addMap.set(index, payload)
    } else {
      deleteMap.set(index, payload)
    }
  })

  const requests: Promise<void>[] = []

  if (addMap.size > 0) {
    requests.push(sendRequest(request, endpoint, id_type as keyof typeof ID_TYPES, audienceId, addMap, msResponse, 'ADD', isBatch))
  }

  if (deleteMap.size > 0) {
    requests.push(sendRequest(request, endpoint, id_type as keyof typeof ID_TYPES, audienceId, deleteMap, msResponse, 'REMOVE', isBatch))
  }

  await Promise.all(requests)

  if (isBatch) {
    return msResponse
  }
}

export async function sendRequest(
  request: RequestClient,
  endpoint: string,
  id_type: keyof typeof ID_TYPES,
  audienceId: string,
  map: Map<number, Payload>,
  msResponse: MultiStatusResponse,
  operation: keyof typeof OPERATIONS,
  isBatch: boolean
): Promise<void> {

  const ids: string[] = []
  
  for (const [index, p] of map) {
    const { 
      user_id, 
      amplitude_id
    } = p
    
    if (id_type === ID_TYPES.BY_USER_ID) {
      if(user_id){
        ids.push(user_id)
      }
      else {
        const errormessage = 'User ID is required for ID Type fields set to "User ID"'
        if(isBatch){
          msResponse.setErrorResponseAtIndex(index, {
            status: 400,
            errortype: 'PAYLOAD_VALIDATION_FAILED',
            errormessage,
            body: p as unknown as JSONLikeObject
          })
        } else {
          throw new PayloadValidationError(errormessage)
        }
      }
    }
    else if (id_type === ID_TYPES.BY_AMP_ID) {
      if(amplitude_id){
        ids.push(amplitude_id)
      }
      else {
        if(isBatch){
          msResponse.setErrorResponseAtIndex(index, {
            status: 400,
            errortype: 'PAYLOAD_VALIDATION_FAILED',
            errormessage: 'Amplitude ID is required for ID Type fields set to "Amplitude ID"',
            body: p as unknown as JSONLikeObject
          })
        } else {
          throw new PayloadValidationError('Amplitude ID is required for ID Type fields set to "Amplitude ID"')
        }
      }
    }
  }

  const json: UploadToCohortJSON = {
    cohort_id: audienceId,
    skip_invalid_ids: true,
    memberships: [{
      ids,
      id_type,
      operation
    }]
  }

  const url = getEndpointByRegion('cohorts_membership', endpoint)

  try {
    const response = await request<UploadToCohortResponse>(url, {
      method: 'POST',
      json
    })

    const skippedIds = response.data.memberships_result[0].skipped_ids || []
    skippedIds.forEach(skippedId => {
      for (const [key, payload] of map.entries()) {
        const matchFound = id_type === ID_TYPES.BY_USER_ID ? payload.user_id === skippedId : payload.amplitude_id === skippedId
        if (matchFound) {
          const errormessage = `The user with ${id_type === ID_TYPES.BY_USER_ID ? 'User ID' : 'Amplitude ID'} ${skippedId} was invalid and was not processed in the cohort update.`
          if(isBatch){
            msResponse.setErrorResponseAtIndex(key, {
              status: 400,
              errortype: 'UNKNOWN_ERROR',
              errormessage,
              body: map.get(key) as unknown as JSONLikeObject,
              sent: { ...json, memberships: [{ ...json.memberships[0], ids: [skippedId] }] } as unknown as JSONLikeObject
            })
          } 
          else {
            throw new PayloadValidationError(errormessage)
          }
        }
      }
    })
  } 
  catch (err) {
    const { 
      response: {
        data: {
          error: { 
            error, 
            message 
          } = {}
        }
      }
    } = err as ResponseError

    for (const [index, p] of map) {
      const id = getId(p, id_type)
      const errormessage = `Request failed for payload with ID ${id} of type ${id_type} with error: ${error || 'UNKNOWN_ERROR'} and message: ${message || 'No message returned from Amplitude'}`
      if(isBatch){
        if(!msResponse.getResponseAtIndex(index)){
          msResponse.setErrorResponseAtIndex(index, {
            status: 400,
            errortype: error as keyof typeof ErrorCodes || 'UNKNOWN_ERROR',
            errormessage,
            body: p as unknown as JSONLikeObject,
            sent: { ...json, memberships: [{ ...json.memberships[0], ids: [id] }] } as unknown as JSONLikeObject
          })
        }
      } 
      else {
        throw new PayloadValidationError(errormessage)
      }
    }
  }
}

export function getId(payload: Payload, id_type: keyof typeof ID_TYPES): string | undefined {
  if (id_type === ID_TYPES.BY_USER_ID) {
    return payload.user_id
  }
  else if (id_type === ID_TYPES.BY_AMP_ID) {
    return payload.amplitude_id
  }
  return undefined
}

export function returnErrorResponse(
  msResponse: MultiStatusResponse,
  payloads: Payload[],
  isBatch: boolean,
  errorMessage: string
): MultiStatusResponse {
  if (isBatch) {
    payloads.forEach((payload, i) => {
      msResponse.setErrorResponseAtIndex(i, {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: errorMessage,
        body: payload as unknown as JSONLikeObject
      })
    })
    return msResponse
  } else {
    throw new PayloadValidationError(errorMessage)
  }
}