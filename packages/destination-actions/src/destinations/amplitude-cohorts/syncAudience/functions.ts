import { RequestClient, MultiStatusResponse, JSONLikeObject, PayloadValidationError, ErrorCodes } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { PayloadMap, Operation, UploadToCohortJSON, UploadToCohortResponse, ResponseError, IDType, PossibleErrorCodes } from './types'
import { ID_TYPES } from '../constants'
import { getEndpointByRegion } from '../functions'

export async function send(request: RequestClient, payloads: Payload[], settings: Settings, isBatch: boolean) {
  const { 
    engage_fields: { 
      segment_external_audience_id: audienceId,
      segment_audience_key: audience_key
    },
    id_type
  } = payloads[0] as { id_type: IDType, engage_fields: Payload['engage_fields'] }

  const {
    endpoint
  } = settings 

  const msResponse = new MultiStatusResponse()

  validateBatch(payloads, id_type, isBatch, msResponse)

  const addMap: PayloadMap = new Map()
  const deleteMap: PayloadMap = new Map()

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
    const json = getJSON(addMap, id_type, audienceId, msResponse, 'ADD', isBatch)
    requests.push(sendRequest(request, json, addMap, id_type, endpoint, msResponse, isBatch))
  }

  if (deleteMap.size > 0) {
    const json = getJSON(deleteMap, id_type, audienceId, msResponse, 'REMOVE', isBatch)
    requests.push(sendRequest(request, json, deleteMap, id_type, endpoint, msResponse, isBatch))
  }

  await Promise.all(requests)

  if (isBatch) {
    return msResponse
  }
}

export function validateBatch(payloads: Payload[], id_type: IDType, isBatch: boolean, msResponse: MultiStatusResponse) {
  if(payloads.some(p => p.id_type !== id_type)) {
    return returnErrorResponse(msResponse, payloads, isBatch, 'All payloads must have the same id_type')
  }
}

export function getJSON(map: PayloadMap, id_type: IDType, audienceId: string, msResponse: MultiStatusResponse, operation: Operation, isBatch: boolean): UploadToCohortJSON {
  validateMap(map, id_type, msResponse, isBatch)
  const idTypeName = getIdTypeName(id_type)
  const ids: string[] = getIds(map, id_type, msResponse, isBatch, idTypeName)
  const json: UploadToCohortJSON = {
    cohort_id: audienceId,
    skip_invalid_ids: true,
    memberships: [{
      ids,
      id_type,
      operation
    }]
  }
  return json
}

export function getIdTypeName(id_type: IDType): string {
  return id_type === ID_TYPES.BY_USER_ID ? 'User ID' : 'Amplitude ID'
}

export function getIds( map: PayloadMap, id_type: IDType, msResponse: MultiStatusResponse, isBatch: boolean, idTypeName: string): string[] {
  const ids: string[] = []
  for (const [index, payload] of map) {
    const id = getId(payload, id_type)
    if (id) {
      ids.push(id)
    } 
    else {
      handleError(
        msResponse,
        index,
        payload,
        isBatch,
        `${idTypeName} field is required for ID Type fields set to "${idTypeName}"`,
        'PAYLOAD_VALIDATION_FAILED'
      )
    }
  }
  return ids
}

export function getId(payload: Payload, id_type: IDType): string | undefined {
  if (id_type === ID_TYPES.BY_USER_ID) {
    return payload.user_id
  }
  else if (id_type === ID_TYPES.BY_AMP_ID) {
    return payload.amplitude_id
  }
  return undefined
}

export function handleError(msResponse: MultiStatusResponse, index: number, payload: Payload, isBatch: boolean, errormessage: string, errortype: PossibleErrorCodes, sent?: JSONLikeObject): void {
  if (isBatch) {
    msResponse.setErrorResponseAtIndex(index, {
      status: 400,
      errortype,
      errormessage,
      body: payload as unknown as JSONLikeObject,
      ...(sent && { sent })
    })
  } 
  else {
    throw new PayloadValidationError(errormessage)
  }
}

export async function sendRequest(request: RequestClient, json: UploadToCohortJSON, map: PayloadMap, id_type:IDType, endpoint: string, msResponse: MultiStatusResponse, isBatch: boolean) {
  const url = getEndpointByRegion('cohorts_membership', endpoint)
  const idTypeName = getIdTypeName(id_type)

  try {
    const response = await request<UploadToCohortResponse>(url, {
      method: 'POST',
      json
    })

    const skippedIds = response.data.memberships_result[0].skipped_ids || []
    skippedIds.forEach(skippedId => {
      for (const [index, payload] of map.entries()) {
        if (getId(payload, id_type) === skippedId) {
          handleError(
            msResponse,
            index,
            payload,
            isBatch,
            `The user with ${idTypeName} ${skippedId} was invalid and was not processed in the cohort update.`,
            'UNKNOWN_ERROR',
            { ...json, memberships: [{ ...json.memberships[0], ids: [skippedId] }] } as unknown as JSONLikeObject
          )
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

    for (const [index, payload] of map.entries()) {
      const id = getId(payload, id_type)
      if (isBatch && msResponse.getResponseAtIndex(index)) {
        continue
      }

      handleError(
        msResponse,
        index,
        payload,
        isBatch,
        `Request failed for payload with ID ${id} of type ${id_type} with error: ${error || 'UNKNOWN_ERROR'} and message: ${message || 'No message returned from Amplitude'}`,
        error as keyof typeof ErrorCodes || 'UNKNOWN_ERROR',
        { ...json, memberships: [{ ...json.memberships[0], ids: [id] }] } as unknown as JSONLikeObject
      )
    }
  }
}

export function validateMap(map: Map<number, Payload>, id_type: IDType, msResponse: MultiStatusResponse, isBatch: boolean) {
  // handle error if any duplicate ids are found in map
  const idSet = new Set<string>()
  for (const [index, payload] of map.entries()) {
    const id = getId(payload, id_type)
    if (id) {
      if (idSet.has(id)) {
        return handleError(
          msResponse,
          index,
          payload,
          isBatch,
          `Duplicate ID ${id} of type ${getIdTypeName(id_type)} found in batch payloads. Each payload must have a unique ID for the specified ID Type.`,
          'PAYLOAD_VALIDATION_FAILED'
        )
      }
      idSet.add(id)
    }
  }
}

export function returnErrorResponse(msResponse: MultiStatusResponse, payloads: Payload[], isBatch: boolean, errorMessage: string): MultiStatusResponse {
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
  } 
  else {
    throw new PayloadValidationError(errorMessage)
  }
}