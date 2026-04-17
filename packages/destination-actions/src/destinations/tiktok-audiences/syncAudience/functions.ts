import { RequestClient, MultiStatusResponse, AudienceMembership, JSONLikeObject } from '@segment/actions-core'
import { TikTokAudiences } from '../api'
import { AudienceSettings } from '../generated-types'
import { Payload } from './generated-types'
import { getIDSchema, isHashedInformation, hash, normalizeEmail } from '../functions'
import { TikTokAudienceAction } from './types'

export async function send(request: RequestClient, payloads: Payload[], audienceSettings?: AudienceSettings, audienceMembership?: AudienceMembership[]) {
  const multiStatusResponse = new MultiStatusResponse()

  if (!audienceSettings) {
    setErrorForAll(multiStatusResponse, payloads, 400, 'Bad Request: no audienceSettings found.')
    return multiStatusResponse
  }

  if (!Array.isArray(audienceMembership) || audienceMembership.length !== payloads.length) {
    setErrorForAll(multiStatusResponse, payloads, 400, 'Audience Memberships must be an array with the same length as payloads.')
    return multiStatusResponse
  }

  const addMap = new Map<number, Payload>()
  const deleteMap = new Map<number, Payload>()

  payloads.forEach((p, i) => {
    const membership = audienceMembership[i]
    if (!validate(p, multiStatusResponse, i, membership)) {
      return
    }

    if (membership === true) {
      addMap.set(i, p)
    } else {
      deleteMap.set(i, p)
    }
  })

  const requests: Promise<void>[] = []

  if (addMap.size > 0) {
    requests.push(sendAndCollectResponses(request, audienceSettings, addMap, 'add', multiStatusResponse))
  }

  if (deleteMap.size > 0) {
    requests.push(sendAndCollectResponses(request, audienceSettings, deleteMap, 'delete', multiStatusResponse))
  }

  await Promise.all(requests)

  return multiStatusResponse
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
          sent: { action, advertiser_ids: [advertiserId], id_schema: idSchema, batch_data: extractUsers([p]) } as unknown as JSONLikeObject,
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
          sent: { action, advertiser_ids: [advertiserId], id_schema: idSchema, batch_data: extractUsers([p]) } as unknown as JSONLikeObject,
          body: p as unknown as JSONLikeObject
        })
      }
    }
  }
}

export function setErrorForAll(multiStatusResponse: MultiStatusResponse, payloads: Payload[], status: number, message: string): void {
  payloads.forEach((p, i) => {
    multiStatusResponse.setErrorResponseAtIndex(i, {
      status,
      errormessage: message,
      body: p as unknown as JSONLikeObject
    })
  })
}

export function validate(payload: Payload, multiStatusResponse: MultiStatusResponse, index: number, membership: boolean | undefined): boolean {
  const { email, phone, advertising_id, send_email, send_phone, send_advertising_id } = payload
  
  if (membership !== true && membership !== false) {
    multiStatusResponse.setErrorResponseAtIndex(i, {
      status: 400,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      errormessage: 'Audience membership value must be a boolean.',
      body: payload as unknown as JSONLikeObject
    })
    return false
  }

  if (!send_email && !send_phone && !send_advertising_id) {
    multiStatusResponse.setErrorResponseAtIndex(index, {
      status: 400,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      errormessage: 'At least one of `Send Email`, `Send Phone` or `Send Advertising ID` must be set to `true`.',
      body: payload as unknown as JSONLikeObject
    })
    return false
  }

  const hasEnabledIdentifier =
    (send_email && email) ||
    (send_phone && phone) ||
    (send_advertising_id && advertising_id)

  if (!hasEnabledIdentifier) {
    multiStatusResponse.setErrorResponseAtIndex(index, {
      status: 400,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      errormessage: 'At least one enabled identifier (Email, Phone, or Advertising ID) must have a value.',
      body: payload as unknown as JSONLikeObject
    })
    return false
  }

  return true
}

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
        userIds.push({ id: isHashedInformation(payload.phone) ? payload.phone : hash(payload.phone), audience_ids: audienceIds })
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
