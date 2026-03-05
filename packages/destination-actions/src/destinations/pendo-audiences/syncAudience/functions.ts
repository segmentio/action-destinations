import { RequestClient, MultiStatusResponse, JSONLikeObject, PayloadValidationError, IntegrationError, ErrorCodes, getErrorCodeFromHttpStatus } from '@segment/actions-core'
import type { Payload } from './generated-types'
import type { AddMap, RemoveMap, PatchBodyJSON, BatchPatchResponse, BatchMultistatusItem } from './types'
import { CONSTANTS } from '../constants'

export async function send(request: RequestClient, payload: Payload[], isBatch: boolean): Promise<MultiStatusResponse | void> {
  const msResponse = new MultiStatusResponse()
  const segmentId = payload[0]?.segmentAudienceId

  if (!segmentId) {
    payload.forEach((p, index) => {
      handleError('PayloadValidationError', 'Missing Pendo Segment ID', isBatch, msResponse, index, p, 400)
    })
    return msResponse
  }

  const adds: AddMap = new Map()
  const removes: RemoveMap = new Map()

  payload.forEach((p, index) => {
    const { visitorId, traitsOrProperties, segmentAudienceKey } = p
    if (!visitorId) {
      handleError('PayloadValidationError','Visitor ID is required', isBatch, msResponse, index, p, 400)
      return
    }
    const isAdding = Boolean(traitsOrProperties[segmentAudienceKey])
    if (isAdding) {
      adds.set(index, visitorId)
    } else {
      removes.set(index, visitorId)
    }
  })

  if (adds.size === 0 && removes.size === 0) {
    return msResponse
  }

  const patchBody: PatchBodyJSON = { patch: [] }

  if (adds.size > 0) {
    patchBody.patch.push({
      op: 'add',
      path: '/visitors',
      value: Array.from(adds.values())
    })
  }

  if (removes.size > 0) {
    patchBody.patch.push({
      op: 'remove',
      path: '/visitors',
      value: Array.from(removes.values())
    })
  }

  try {
    const response = await request<BatchPatchResponse>(
      `${CONSTANTS.API_BASE_URL}${CONSTANTS.SEGMENT_ENDPOINT}/${segmentId}/visitor`,
      {
        method: 'PATCH',
        json: patchBody
      }
    )

    const data = response?.data

    data.multistatus.forEach((item: BatchMultistatusItem) => {
      const isSuccess = item.status >= 200 && item.status < 300
      const map = item.operation === 'add' ? adds : removes

      map.forEach((visitorId, index) => {
        const p = payload[index]
        if (isSuccess) {
          msResponse.setSuccessResponseAtIndex(index, {
            status: item.status,
            body: p as unknown as JSONLikeObject,
            sent: buildSent(item.operation, visitorId)
          })
        } else {
          handleError('IntegrationError', item.message, isBatch, msResponse, index, p, item.status, buildSent(item.operation, visitorId))
        }
      })
    })
  } 
  catch (error) {
    const status = (error?.response?.status as number) || 500
    const message = (error?.message as string) || 'An error occurred while syncing visitors to Pendo Segment.'

    const allIndices = [...adds.keys(), ...removes.keys()]
    allIndices.forEach((index) => {
      const visitorId = adds.get(index) ?? removes.get(index)
      const op = adds.has(index) ? 'add' : 'remove'
      handleError('IntegrationError', message, isBatch, msResponse, index, payload[index], status, buildSent(op, visitorId as string))
    })
  }

  if(isBatch) {
    return msResponse
  }
  return
}


function buildSent(op: 'add' | 'remove', visitorId: string): JSONLikeObject {
  return { patch: [{ op, path: '/visitors', value: [visitorId] }] } as unknown as JSONLikeObject
}

function handleError(errType: 'PayloadValidationError' | 'IntegrationError', message: string, isBatch: boolean, msResponse: MultiStatusResponse, index: number, payload: Payload, status = 400, sent?: JSONLikeObject): void {
  if (!isBatch) {
    if(errType === 'PayloadValidationError') {
      throw new PayloadValidationError(message)
    }
    else {
      throw new IntegrationError( message, getErrorCodeFromHttpStatus(status) || ErrorCodes.UNKNOWN_ERROR, status)
    }
  }
  msResponse.setErrorResponseAtIndex(index, {
    status,
    body: payload as unknown as JSONLikeObject,
    errormessage: message,
    ...(sent && { sent })
  })
}
