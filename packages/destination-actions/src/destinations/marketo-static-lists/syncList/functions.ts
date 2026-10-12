import {
  AudienceMembership,
  ErrorCodes,
  MultiStatusResponse,
  PayloadValidationError,
  RequestClient,
  StatsContext
} from '@segment/actions-core'
import { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { addToList, addToListBatch, removeFromList, removeFromListBatch } from '../functions'

export async function syncList(
  request: RequestClient,
  settings: Settings,
  payload: Payload,
  audienceMembership: AudienceMembership,
  statsContext?: StatsContext,
  hookOutputs?: { id?: string; name?: string }
) {
  if (audienceMembership === true) {
    return addToList(request, settings, payload, statsContext, hookOutputs)
  } else if (audienceMembership === false) {
    return removeFromList(request, settings, payload, statsContext, hookOutputs)
  }

  throw new PayloadValidationError('Audience Membership must be a boolean')
}

export async function syncListBatch(
  request: RequestClient,
  settings: Settings,
  payloads: Payload[],
  audienceMembership: AudienceMembership[],
  statsContext?: StatsContext,
  hookOutputs?: { id?: string; name?: string }
): Promise<MultiStatusResponse> {
  const multiStatusResponse = new MultiStatusResponse()
  const addIndices: number[] = []
  const addPayloads: Payload[] = []
  const removeIndices: number[] = []
  const removePayloads: Payload[] = []

  payloads.forEach((payload, index) => {
    const membership = audienceMembership[index]

    if (membership !== true && membership !== false) {
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: 400,
        errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
        errormessage: 'Audience Membership must be a boolean'
      })
      return
    }

    if (membership) {
      addIndices.push(index)
      addPayloads.push(payload)
    } else {
      removeIndices.push(index)
      removePayloads.push(payload)
    }
  })

  const [addResult, removeResult] = await Promise.all([
    addPayloads.length > 0 ? addToListBatch(request, settings, addPayloads, statsContext, hookOutputs) : undefined,
    removePayloads.length > 0
      ? removeFromListBatch(request, settings, removePayloads, statsContext, hookOutputs)
      : undefined
  ])

  if (addResult) {
    addIndices.forEach((originalIndex, i) => {
      multiStatusResponse.pushResponseObjectAtIndex(originalIndex, addResult.getResponseAtIndex(i))
    })
  }

  if (removeResult) {
    removeIndices.forEach((originalIndex, i) => {
      multiStatusResponse.pushResponseObjectAtIndex(originalIndex, removeResult.getResponseAtIndex(i))
    })
  }

  return multiStatusResponse
}
