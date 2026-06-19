import {
  IntegrationError,
  ErrorCodes,
  getErrorCodeFromHttpStatus,
  RequestClient,
  MultiStatusResponse,
  JSONLikeObject,
  PayloadValidationError,
  InvalidAudienceMembershipError,
  AudienceMembership
} from '@segment/actions-core'
import type { Payload } from './generated-types'
import type { AddMap, RemoveMap, PatchBodyJSON, BatchPatchResponse, BatchMultistatusItem } from './types'
import { SEGMENT_ENDPOINT } from '../constants'
import { getDomain } from '../functions'

export async function send(
  request: RequestClient,
  region: string,
  payload: Payload[],
  isBatch: boolean,
  audienceMemberships: AudienceMembership[]
): Promise<MultiStatusResponse | void> {
  const msResponse = new MultiStatusResponse()
  const segmentId = payload[0]?.segmentAudienceId

  if (!segmentId) {
    payload.forEach((p, index) => {
      handleError(
        'PayloadValidationError',
        'Missing Pendo Segment ID',
        isBatch,
        msResponse,
        index,
        400,
        p as unknown as JSONLikeObject
      )
    })
    return msResponse
  }

  const adds: AddMap = new Map()
  const removes: RemoveMap = new Map()

  payload.forEach((p, index) => {
    const { visitorId } = p
    if (!visitorId) {
      handleError(
        'PayloadValidationError',
        'Visitor ID is required',
        isBatch,
        msResponse,
        index,
        400,
        p as unknown as JSONLikeObject
      )
      return
    }
    const membership = Array.isArray(audienceMemberships) ? audienceMemberships[index] : undefined
    if (typeof membership !== 'boolean') {
      handleError(
        'InvalidAudienceMembershipError',
        'Unable to determine audience membership for this event',
        isBatch,
        msResponse,
        index,
        400,
        p as unknown as JSONLikeObject
      )
      return
    }
    if (membership) {
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
      `${getDomain(region)}/${SEGMENT_ENDPOINT}/${segmentId}/visitor`,
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
            sent: p as unknown as JSONLikeObject,
            body: buildPendoRequest(item.operation, [visitorId])
          })
        } else {
          handleError(
            'IntegrationError',
            item.message,
            isBatch,
            msResponse,
            index,
            item.status,
            p as unknown as JSONLikeObject,
            buildPendoRequest(item.operation, [visitorId])
          )
        }
      })
    })
  } catch (error) {
    const status = (error?.response?.status as number) || 500
    const message = (error?.message as string) || 'An error occurred while syncing visitors to Pendo Segment.'

    const allIndices = [...adds.keys(), ...removes.keys()]
    allIndices.forEach((index) => {
      const visitorId = adds.get(index) ?? removes.get(index)
      const op = adds.has(index) ? 'add' : 'remove'
      handleError(
        'IntegrationError',
        message,
        isBatch,
        msResponse,
        index,
        status,
        payload[index] as unknown as JSONLikeObject,
        buildPendoRequest(op, [visitorId as string])
      )
    })
  }

  if (isBatch) {
    return msResponse
  }
  return
}

function buildPendoRequest(op: 'add' | 'remove', visitorIds: string[]): JSONLikeObject {
  return { patch: [{ op, path: '/visitors', value: visitorIds }] } as unknown as JSONLikeObject
}

function handleError(
  errType: 'PayloadValidationError' | 'IntegrationError' | 'InvalidAudienceMembershipError',
  message: string,
  isBatch: boolean,
  msResponse: MultiStatusResponse,
  index: number,
  status = 400,
  sent?: JSONLikeObject,
  body?: JSONLikeObject
): void {
  if (!isBatch) {
    if (errType === 'PayloadValidationError') {
      throw new PayloadValidationError(message)
    } else if (errType === 'InvalidAudienceMembershipError' ) {
      throw new InvalidAudienceMembershipError(message)
    } else {
      throw new IntegrationError(message, getErrorCodeFromHttpStatus(status) || ErrorCodes.UNKNOWN_ERROR, status)
    }
  }
  msResponse.setErrorResponseAtIndex(index, {
    status,
    errormessage: message,
    ...(sent && { sent }),
    ...(body && { body })
  })
}
