import { RequestClient, MultiStatusResponse, JSONLikeObject, PayloadValidationError, ErrorCodes } from '@segment/actions-core'
import type { Settings, AudienceSettings } from '../generated-types'
import type { Payload } from './generated-types'
import { PayloadMap, Operation, UploadToCohortJSON, UploadToCohortResponse, ResponseError, PossibleErrorCodes } from './types'
import { ID_TYPES } from '../constants'
import { getEndpointByRegion } from '../functions'
import { IDType } from '../types'

export async function send(request: RequestClient, payloads: Payload[], settings: Settings, isBatch: boolean, audienceSettings?: AudienceSettings) {
  const { 
    engage_fields: { 
      segment_external_audience_id: audienceId,
      segment_audience_key: audience_key
    },
  } = payloads[0] 

  const {
    endpoint
  } = settings 

  const {
    id_type
  } = (audienceSettings || {}) as { id_type: IDType | undefined}

  const msResponse = new MultiStatusResponse()

  if(!audience_key){
    return failAllPayloads(payloads, msResponse, isBatch, 'Segment Audience Key is a required field.')
  }
  if(!id_type) {
    return failAllPayloads(payloads, msResponse, isBatch, 'ID Type must be specified in Audience Settings.')
  }

  const addMap: PayloadMap = new Map()
  const deleteMap: PayloadMap = new Map()

  payloads.forEach((payload, index) => {
    const { 
      engage_fields: { 
        traits_or_properties
      } = {}
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
    if(json){
      requests.push(sendRequest(request, addMap, msResponse, json, id_type, endpoint, isBatch))
    }
  }

  if (deleteMap.size > 0) {
    const json = getJSON(deleteMap, id_type, audienceId, msResponse, 'REMOVE', isBatch)
    if(json){
      requests.push(sendRequest(request, deleteMap, msResponse, json, id_type, endpoint, isBatch))
    }
  }

  if(requests.length === 0) {
    if(isBatch) {
      return msResponse
    }
    throw new PayloadValidationError("The payload is invalid and cannot be sent to Amplitude. Check that it contains the correct type of identifier")
  }

  await Promise.all(requests)

  if (isBatch) {
    return msResponse
  }
}

export function failAllPayloads(payloads: Payload[], msResponse: MultiStatusResponse, isBatch: boolean, message: string): MultiStatusResponse {
  payloads.forEach((payload, index) => {
    handleError(
      payload,
      msResponse,
      index,
      isBatch,
      message,
      'PAYLOAD_VALIDATION_FAILED'
    )
  })
  if(isBatch) {
    return msResponse
  }
  throw new PayloadValidationError(message)
}

export function getJSON(map: PayloadMap, id_type: IDType, audienceId: string, msResponse: MultiStatusResponse, operation: Operation, isBatch: boolean): UploadToCohortJSON | undefined {
  const ids: string[] = getIds(map, id_type, msResponse, isBatch)
  if(ids.length === 0){
    return undefined
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
  return json
}

export function getIds(map: PayloadMap, id_type: IDType, msResponse: MultiStatusResponse, isBatch: boolean): string[] {
  const idSet = new Set<string>()
  for (const [index, payload] of map.entries()) {
    const id = getId(payload, id_type)
    if (id) {
      if (idSet.has(id)) {
        // If there are duplicate IDs, handle an error for the duplicate
        handleError(
          payload,
          msResponse,
          index,
          isBatch,
          `Duplicate ID ${id} of type ${getIdTypeName(id_type)} found in payload batch. The duplicate payload has been rejected. Each payload must have a unique ID for the specified ID Type.`,
          'PAYLOAD_VALIDATION_FAILED'
        )
      }
      else {
        idSet.add(id)
      }
    } 
    else {
      handleError(
        payload,
        msResponse,
        index,
        isBatch,
        `No User Identifier of type ${getIdTypeName(id_type)} found in payload. Each payload must have a unique ID for the specified ID Type.`,
        'PAYLOAD_VALIDATION_FAILED'
      ) 
    }
  }
  return Array.from(idSet)
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

export function handleError(payload: Payload, msResponse: MultiStatusResponse, index: number, isBatch: boolean, errormessage: string, errortype: PossibleErrorCodes, sent?: JSONLikeObject): void {
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

export async function sendRequest(request: RequestClient, map: PayloadMap, msResponse: MultiStatusResponse, json: UploadToCohortJSON, id_type: IDType, endpoint: string, isBatch: boolean) {
  const url = getEndpointByRegion('cohorts_membership', endpoint)
  const idTypeName = getIdTypeName(id_type)

  try {
    const response = await request<UploadToCohortResponse>(url, {
      method: 'POST',
      json
    })

    const skippedIds = new Set(response?.data?.memberships_result[0]?.skipped_ids || [])

    for (const [index, payload] of map.entries()) {
      const id = getId(payload, id_type)
      if (id && skippedIds.has(id)) {
        handleError(
          payload,
          msResponse,
          index,
          isBatch,
          `The user with ${idTypeName} ${id} was invalid and was not processed in the cohort update.`,
          'UNKNOWN_ERROR'
        )
      } 
      else if (isBatch && !msResponse.getResponseAtIndex(index)) {
        msResponse.setSuccessResponseAtIndex(index, {
          status: 200,
          body: payload as unknown as JSONLikeObject,
          sent: { ...json, memberships: [{ ...json.memberships[0], ids: [id] }] } as unknown as JSONLikeObject
        })
      }
    }
  }
  catch (err) {
    const {
      response: {
        data: {
          error: {
            error,
            message
          } = {}
        } = {}
      } = {}
    } = err as ResponseError

    for (const [index, payload] of map.entries()) {
      const id = getId(payload, id_type)
      if (isBatch && msResponse.getResponseAtIndex(index)) {
        continue
      }

      handleError(
        payload,
        msResponse,
        index,
        isBatch,
        `Request failed for payload with ID ${id} of type ${id_type} with error: ${error || 'UNKNOWN_ERROR'} and message: ${message || 'No message returned from Amplitude'}`,
        error as keyof typeof ErrorCodes || 'UNKNOWN_ERROR',
        { ...json, memberships: [{ ...json.memberships[0], ids: [id] }] } as unknown as JSONLikeObject
      )
    }
  }
}

export function getIdTypeName(id_type: IDType): string {
  return id_type === ID_TYPES.BY_USER_ID ? 'User ID' : 'Amplitude ID'
}