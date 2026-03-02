import { RequestClient, MultiStatusResponse, JSONLikeObject, PayloadValidationError, IntegrationError, getErrorCodeFromHttpStatus } from '@segment/actions-core'
import type { Payload } from './generated-types'
import type { AddMap, RemoveMap, BatchPatchBody, BatchPatchResponse, BatchMultistatusItem, VisitorActionResponse } from './types'
import { CONSTANTS } from '../constants'

export async function send(request: RequestClient, payload: Payload[], isBatch: boolean): Promise<MultiStatusResponse | void> {
  const msResponse = new MultiStatusResponse()
  const segmentId = payload[0]?.segmentAudienceId

  if (!segmentId) {
    payload.forEach((p, index) => {
      handleError('Missing Pendo Segment ID', isBatch, msResponse, index, p, 400)
    })
    return msResponse
  }

  if (isBatch) {
    return sendBatch(request, payload, segmentId, msResponse)
  }

  return sendSingle(request, payload[0], segmentId, isBatch, msResponse)
}

async function sendBatch(request: RequestClient, payload: Payload[], segmentId: string, msResponse: MultiStatusResponse): Promise<MultiStatusResponse> {
  const adds: AddMap = new Map()
  const removes: RemoveMap = new Map()

  payload.forEach((p, index) => {
    const { visitorId, traitsOrProperties, segmentAudienceKey } = p
    if (!visitorId) {
      handleError('Visitor ID is required', true, msResponse, index, p, 400)
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

  const patchBody: BatchPatchBody = { patch: [] }

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
        skipResponseCloning: true,
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
            sent: { patch: [{ op: item.operation, path: '/visitors', value: [visitorId] }] } as unknown as JSONLikeObject
          })
        } else {
          handleError(item.message, true, msResponse, index, p, item.status)
        }
      })
    })
  } 
  catch (error) {
    const status = (error?.response?.status as number) || 500
    const message = (error?.message as string) || 'An error occurred while syncing visitors to Pendo Segment.'

    const allIndices = [...adds.keys(), ...removes.keys()]
    allIndices.forEach((index) => {
      handleError(message, true, msResponse, index, payload[index], status)
    })
  }

  return msResponse
}

async function sendSingle(request: RequestClient, p: Payload, segmentId: string, isBatch: boolean, msResponse: MultiStatusResponse): Promise<void> {
  const { visitorId, traitsOrProperties, segmentAudienceKey } = p

  if (!visitorId) {
    handleError('Visitor ID is required', isBatch, msResponse, 0, p, 400)
    return
  }

  const isAdding = Boolean(traitsOrProperties[segmentAudienceKey])
  const method = isAdding ? 'PUT' : 'DELETE'
  const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.SEGMENT_ENDPOINT}/${segmentId}/visitor/${encodeURIComponent(visitorId)}`

  try {
    await request<VisitorActionResponse>(url, {
      method
    })
  } 
  catch (error) {
    const status = (error?.response?.status as number) || 400
    const message = (error?.message as string) || `An error occurred while ${isAdding ? 'adding' : 'removing'} visitor from Pendo Segment.`
    throw new IntegrationError(message, getErrorCodeFromHttpStatus(status), status)
  }
}

function handleError(message: string, isBatch: boolean, msResponse: MultiStatusResponse, index: number, payload: Payload, status = 400): void {
  if (!isBatch) {
    throw new PayloadValidationError(message)
  }
  msResponse.setErrorResponseAtIndex(index, {
    status,
    body: payload as unknown as JSONLikeObject,
    errormessage: message
  })
}
