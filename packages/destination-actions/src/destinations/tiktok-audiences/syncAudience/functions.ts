import {
  RequestClient,
  MultiStatusResponse,
  ModifiedResponse,
  AudienceMembership,
  JSONLikeObject,
  PayloadValidationError
} from '@segment/actions-core'
import { TikTokAudiences } from '../api'
import { AudienceSettings } from '../generated-types'
import { Payload } from './generated-types'
import { getIDSchema, isHashedInformation, hash, normalizeEmail } from '../functions'
import { TikTokAudienceAction } from './types'

export async function send(
  request: RequestClient,
  payloads: Payload[],
  audienceSettings?: AudienceSettings,
  audienceMembership?: AudienceMembership[],
  isBatch?: boolean
) {
  const multiStatusResponse = new MultiStatusResponse()

  if (!audienceSettings) {
    return returnAllErrors(multiStatusResponse, payloads, 400, 'Bad Request: no audienceSettings found.', isBatch)
  }

  if (!Array.isArray(audienceMembership) || audienceMembership.length !== payloads.length) {
    return returnAllErrors(
      multiStatusResponse,
      payloads,
      400,
      'Audience Memberships must be an array with the same length as payloads.',
      isBatch
    )
  }

  const addMap = new Map<number, Payload>()
  const deleteMap = new Map<number, Payload>()

  payloads.forEach((p, i) => {
    const membership = audienceMembership[i]
    if (!validate(p, multiStatusResponse, i, membership, isBatch)) {
      return
    }

    if (membership === true) {
      addMap.set(i, p)
    } else {
      deleteMap.set(i, p)
    }
  })

  const requests: Promise<ModifiedResponse | void>[] = []

  if (addMap.size > 0) {
    requests.push(
      isBatch
        ? sendAndCollectResponses(request, audienceSettings, addMap, 'add', multiStatusResponse)
        : sendRequest(request, audienceSettings, addMap, 'add')
    )
  }

  if (deleteMap.size > 0) {
    requests.push(
      isBatch
        ? sendAndCollectResponses(request, audienceSettings, deleteMap, 'delete', multiStatusResponse)
        : sendRequest(request, audienceSettings, deleteMap, 'delete')
    )
  }

  const responses = await Promise.all(requests)

  if (!isBatch) {
    return responses[0]
  }

  return multiStatusResponse
}

export async function sendRequest(
  request: RequestClient,
  audienceSettings: AudienceSettings,
  payloadMap: Map<number, Payload>,
  action: TikTokAudienceAction
): Promise<ModifiedResponse> {
  const payloads = Array.from(payloadMap.values())
  const advertiserId = audienceSettings.advertiserId
  const idSchema = getIDSchema(payloads[0])
  const batchData = extractUsers(payloads)
  const TikTokApiClient = new TikTokAudiences(request, advertiserId)

  return TikTokApiClient.batchUpdate({
    advertiser_ids: [advertiserId],
    action,
    id_schema: idSchema,
    batch_data: batchData
  })
}

export async function sendAndCollectResponses(
  request: RequestClient,
  audienceSettings: AudienceSettings,
  payloadMap: Map<number, Payload>,
  action: TikTokAudienceAction,
  multiStatusResponse: MultiStatusResponse
): Promise<void> {
  const payloads = Array.from(payloadMap.values())

  if (payloads.length === 0) {
    return
  }

  const advertiserId = audienceSettings.advertiserId
  const idSchema = getIDSchema(payloads[0])
  const batchData = extractUsers(payloads)

  try {
    const TikTokApiClient = new TikTokAudiences(request, advertiserId)

    await TikTokApiClient.batchUpdate({
      advertiser_ids: [advertiserId],
      action,
      id_schema: idSchema,
      batch_data: batchData
    })

    for (const [index, p] of payloadMap) {
      if (!multiStatusResponse.getResponseAtIndex(index)) {
        multiStatusResponse.setSuccessResponseAtIndex(index, {
          status: 200,
          sent: {
            action,
            advertiser_ids: [advertiserId],
            id_schema: idSchema,
            batch_data: extractUsers([p])
          } as unknown as JSONLikeObject,
          body: p as unknown as JSONLikeObject
        })
      }
    }
  } catch (err) {
    const error = err as { message?: string; response?: { status?: number } }
    const status = error.response?.status ?? 500
    const message = error.message ?? 'Unknown error'

    for (const [index, p] of payloadMap) {
      if (!multiStatusResponse.getResponseAtIndex(index)) {
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status,
          errormessage: message,
          sent: {
            action,
            advertiser_ids: [advertiserId],
            id_schema: idSchema,
            batch_data: extractUsers([p])
          } as unknown as JSONLikeObject,
          body: p as unknown as JSONLikeObject
        })
      }
    }
  }
}

function returnAllErrors(
  multiStatusResponse: MultiStatusResponse,
  payloads: Payload[],
  status: number,
  message: string,
  isBatch?: boolean
): never | MultiStatusResponse {
  if (!isBatch) {
    throw new PayloadValidationError(message)
  }
  payloads.forEach((p, i) => {
    multiStatusResponse.setErrorResponseAtIndex(i, {
      status,
      errormessage: message,
      body: p as unknown as JSONLikeObject
    })
  })
  return multiStatusResponse
}

function handleValidationError(
  multiStatusResponse: MultiStatusResponse,
  index: number,
  payload: Payload,
  message: string,
  isBatch?: boolean
): never | false {
  if (!isBatch) {
    throw new PayloadValidationError(message)
  }
  multiStatusResponse.setErrorResponseAtIndex(index, {
    status: 400,
    errortype: 'PAYLOAD_VALIDATION_FAILED',
    errormessage: message,
    body: payload as unknown as JSONLikeObject
  })
  return false
}

export function validate(
  payload: Payload,
  multiStatusResponse: MultiStatusResponse,
  index: number,
  membership: boolean | undefined,
  isBatch?: boolean
): boolean {
  if (membership !== true && membership !== false) {
    return handleValidationError(
      multiStatusResponse,
      index,
      payload,
      'Audience membership value must be a boolean.',
      isBatch
    )
  }

  const { email, phone, advertising_id, send_email, send_phone, send_advertising_id } = payload

  if (!send_email && !send_phone && !send_advertising_id) {
    return handleValidationError(
      multiStatusResponse,
      index,
      payload,
      'At least one of `Send Email`, `Send Phone` or `Send Advertising ID` must be set to `true`.',
      isBatch
    )
  }

  const hasEnabledIdentifier = (send_email && email) || (send_phone && phone) || (send_advertising_id && advertising_id)

  if (!hasEnabledIdentifier) {
    return handleValidationError(
      multiStatusResponse,
      index,
      payload,
      'At least one enabled identifier (Email, Phone, or Advertising ID) must have a value.',
      isBatch
    )
  }

  return true
}

/*
 * Kept the same logic as before for extracting users
 */
export function extractUsers(payloads: Payload[]): Record<string, unknown>[][] {
  const batchData: Record<string, unknown>[][] = []

  for (const payload of payloads) {
    const userIds: Record<string, unknown>[] = []
    const audienceIds = [payload.external_audience_id]

    if (payload.send_email) {
      if (payload.email) {
        const normalized = normalizeEmail(payload.email)
        userIds.push({ id: isHashedInformation(normalized) ? normalized : hash(normalized), audience_ids: audienceIds })
      } else {
        userIds.push({})
      }
    }

    if (payload.send_phone) {
      if (payload.phone) {
        userIds.push({
          id: isHashedInformation(payload.phone) ? payload.phone : hash(payload.phone),
          audience_ids: audienceIds
        })
      } else {
        userIds.push({})
      }
    }

    if (payload.send_advertising_id) {
      if (payload.advertising_id) {
        userIds.push({ id: hash(payload.advertising_id), audience_ids: audienceIds })
      } else {
        userIds.push({})
      }
    }

    batchData.push(userIds)
  }

  return batchData
}
