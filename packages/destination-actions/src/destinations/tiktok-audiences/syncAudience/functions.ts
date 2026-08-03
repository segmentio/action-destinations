import {
  RequestClient,
  MultiStatusResponse,
  ModifiedResponse,
  AudienceMembership,
  JSONLikeObject,
  PayloadValidationError,
  IntegrationError
} from '@segment/actions-core'
import { StatsContext } from '@segment/actions-core/destination-kit'
import { TikTokAudiences } from '../api'
import { AudienceSettings } from '../generated-types'
import { Payload } from './generated-types'
import { getIDSchema } from '../functions'
import { TikTokAudienceAction } from './types'
import { APIResponse } from '../types'
import { processHashing } from '../../../lib/hashing-utils'

function trackMetric(statsContext: StatsContext | undefined, metric: string) {
  statsContext?.statsClient?.incr(metric, 1, statsContext?.tags)
}

export async function send(
  request: RequestClient,
  payloads: Payload[],
  audienceSettings?: AudienceSettings,
  audienceMembership?: AudienceMembership[],
  isBatch?: boolean,
  statsContext?: StatsContext
) {
  const multiStatusResponse = new MultiStatusResponse()

  const { advertiserId } = audienceSettings || {}

  if (!audienceSettings) {
    return returnAllErrors(multiStatusResponse, payloads, 400, 'Bad Request: no audienceSettings found.', isBatch, statsContext)
  }

  if(!advertiserId) {
    return returnAllErrors(
      multiStatusResponse,
      payloads,
      400,
      'Bad Request: Advertiser ID is required in audienceSettings.',
      isBatch,
      statsContext
    )
  }

  if (
    !Array.isArray(audienceMembership) ||
    audienceMembership.length !== payloads.length ||
    audienceMembership.some((m) => typeof m !== 'boolean')
  ) {
    return returnAllErrors(
      multiStatusResponse,
      payloads,
      400,
      'Audience Memberships must be an array of booleans with the same length as payloads.',
      isBatch,
      statsContext
    )
  }

  const addMap = new Map<number, Payload>()
  const deleteMap = new Map<number, Payload>()

  payloads.forEach((p, i) => {
    const membership = audienceMembership[i]
    if (!validate(p, multiStatusResponse, i, isBatch, statsContext)) {
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
        ? sendAndCollectResponses(request, audienceSettings, addMap, 'add', multiStatusResponse, statsContext)
        : sendRequest(request, audienceSettings, addMap, 'add', statsContext)
    )
  }

  if (deleteMap.size > 0) {
    requests.push(
      isBatch
        ? sendAndCollectResponses(request, audienceSettings, deleteMap, 'delete', multiStatusResponse, statsContext)
        : sendRequest(request, audienceSettings, deleteMap, 'delete', statsContext)
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
  action: TikTokAudienceAction,
  statsContext?: StatsContext
): Promise<ModifiedResponse> {
  const payloads = Array.from(payloadMap.values())
  const { advertiserId } = audienceSettings
  const idSchema = getIDSchema(payloads[0]) // This is safe we're only processing one payload in non-batch mode
  const batchData = extractUsers(payloads)
  const TikTokApiClient = new TikTokAudiences(request, advertiserId)

  const response = await TikTokApiClient.batchUpdate({
    advertiser_ids: [advertiserId],
    action,
    id_schema: idSchema,
    batch_data: batchData
  })

  const responseData = response.data as APIResponse | undefined
  if (response.status < 200 || response.status >= 300 || responseData?.code !== 0) {
    const message = responseData?.message ?? 'Unknown TikTok API error'
    const errorStatus = response.status >= 400 ? response.status : 400
    trackMetric(statsContext, `syncAudience.single.${action}.error`)
    throw new IntegrationError(message, String(responseData?.code ?? response.status), errorStatus)
  }

  trackMetric(statsContext, `syncAudience.single.${action}.success`)
  return response
}

export async function sendAndCollectResponses(
  request: RequestClient,
  audienceSettings: AudienceSettings,
  payloadMap: Map<number, Payload>,
  action: TikTokAudienceAction,
  multiStatusResponse: MultiStatusResponse,
  statsContext?: StatsContext
): Promise<void> {
  const payloads = Array.from(payloadMap.values())
  const indices = Array.from(payloadMap.keys())

  if (payloads.length === 0) {
    return
  }

  const { advertiserId } = audienceSettings
  const idSchema = getIDSchema(payloads[0]) // This is safe because of batch keys
  const batchData = extractUsers(payloads)

  try {
    const TikTokApiClient = new TikTokAudiences(request, advertiserId)

    const response = await TikTokApiClient.batchUpdate({
      advertiser_ids: [advertiserId],
      action,
      id_schema: idSchema,
      batch_data: batchData
    })

    const responseData = response.data as APIResponse | undefined
    const isSuccess = response.status >= 200 && response.status < 300 && responseData?.code === 0

    if (isSuccess) {
      trackMetric(statsContext, `syncAudience.batch.${action}.success`)
      payloads.forEach((p, i) => {
        const index = indices[i]
        if (!multiStatusResponse.getResponseAtIndex(index)) {
          multiStatusResponse.setSuccessResponseAtIndex(index, {
            status: 200,
            sent: {
              action,
              advertiser_ids: [advertiserId],
              id_schema: idSchema,
              batch_data: [batchData[i]]
            } as unknown as JSONLikeObject,
            body: p as unknown as JSONLikeObject
          })
        }
      })
    } else {
      const status = response.status >= 400 ? response.status : 400
      const message = responseData?.message ?? 'Unknown TikTok API error'
      trackMetric(statsContext, `syncAudience.batch.${action}.error`)

      payloads.forEach((p, i) => {
        const index = indices[i]
        if (!multiStatusResponse.getResponseAtIndex(index)) {
          multiStatusResponse.setErrorResponseAtIndex(index, {
            status,
            errormessage: message,
            sent: {
              action,
              advertiser_ids: [advertiserId],
              id_schema: idSchema,
              batch_data: [batchData[i]]
            } as unknown as JSONLikeObject,
            body: p as unknown as JSONLikeObject
          })
        }
      })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const status = (err as { response?: { status?: number } })?.response?.status || 500
    trackMetric(statsContext, `syncAudience.batch.${action}.error`)

    payloads.forEach((p, i) => {
      const index = indices[i]
      if (!multiStatusResponse.getResponseAtIndex(index)) {
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status,
          errormessage: message,
          sent: {
            action,
            advertiser_ids: [advertiserId],
            id_schema: idSchema,
            batch_data: [batchData[i]]
          } as unknown as JSONLikeObject,
          body: p as unknown as JSONLikeObject
        })
      }
    })
  }
}

function returnAllErrors(
  multiStatusResponse: MultiStatusResponse,
  payloads: Payload[],
  status: number,
  message: string,
  isBatch?: boolean,
  statsContext?: StatsContext
): never | MultiStatusResponse {
  const prefix = isBatch ? 'syncAudience.batch' : 'syncAudience.single'
  trackMetric(statsContext, `${prefix}.validation_error`)
  if (!isBatch) {
    throw new PayloadValidationError(message)
  }
  payloads.forEach((p, i) => {
    multiStatusResponse.setErrorResponseAtIndex(i, {
      status,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
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
  isBatch?: boolean,
  statsContext?: StatsContext
): never | false {
  const prefix = isBatch ? 'syncAudience.batch' : 'syncAudience.single'
  trackMetric(statsContext, `${prefix}.validation_error`)
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
  isBatch?: boolean,
  statsContext?: StatsContext
): boolean {

  const { email, phone, advertising_id, send_email, send_phone, send_advertising_id, external_audience_id } = payload

  if (!external_audience_id) {
    return handleValidationError(
      multiStatusResponse,
      index,
      payload,
      'Missing required field: external_audience_id.',
      isBatch,
      statsContext
    )
  }

  if (!send_email && !send_phone && !send_advertising_id) {
    return handleValidationError(
      multiStatusResponse,
      index,
      payload,
      'At least one of `Send Email`, `Send Phone` or `Send Advertising ID` must be set to `true`.',
      isBatch,
      statsContext
    )
  }

  const hasEnabledIdentifier = (send_email && email) || (send_phone && phone) || (send_advertising_id && advertising_id)

  if (!hasEnabledIdentifier) {
    return handleValidationError(
      multiStatusResponse,
      index,
      payload,
      'At least one enabled identifier (Email, Phone, or Advertising ID) must have a value.',
      isBatch,
      statsContext
    )
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
        userIds.push({ id: processHashing(normalized, 'sha256', 'hex'), audience_ids: audienceIds })
      } else {
        userIds.push({})
      }
    }

    if (payload.send_phone) {
      if (payload.phone) {
        userIds.push({
          id: processHashing(payload.phone, 'sha256', 'hex'),
          audience_ids: audienceIds
        })
      } else {
        userIds.push({})
      }
    }

    if (payload.send_advertising_id) {
      if (payload.advertising_id) {
        userIds.push({ id: processHashing(payload.advertising_id, 'sha256', 'hex'), audience_ids: audienceIds })
      } else {
        userIds.push({})
      }
    }

    batchData.push(userIds)
  }

  return batchData
}

export function normalizeEmail(email: string): string {
  return email
    .replace(/\+.*@/, '@')
    .replace(/\.(?=.*@)/g, '')
    .toLowerCase()
}