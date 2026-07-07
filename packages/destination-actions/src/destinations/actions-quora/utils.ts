import {
  RequestClient,
  MultiStatusResponse,
  JSONLikeObject,
  ModifiedResponse,
  PayloadValidationError,
  IntegrationError
} from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { Payload } from './trackConversion/generated-types'
import type {
  QuoraConversionItem,
  QuoraSingleRequest,
  QuoraBatchRequest,
  QuoraBatchResponse,
  QuoraSingleResponse
} from './types'
import { SINGLE_ENDPOINT, BATCH_ENDPOINT, GENERIC_EVENT_NAME } from './constants'

/** Returns a trimmed string, or undefined for empty/nullish input. */
function clean(value: string | undefined | null): string | undefined {
  if (value === undefined || value === null) return undefined
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

/**
 * Converts a Segment timestamp (ISO 8601 string, epoch ms number, or Date)
 * into Quora's epoch-microseconds integer. Returns undefined if absent/invalid.
 */
export function toEpochMicroseconds(timestamp: string | number | undefined): number | undefined {
  if (timestamp === undefined || timestamp === null) return undefined
  const ms = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime()
  if (Number.isNaN(ms)) return undefined
  return Math.round(ms * 1000)
}

/**
 * Resolves the Quora `event_name`. When the mapped event name is `Generic`,
 * the raw Segment event name is passed through instead.
 */
export function resolveEventName(payload: Payload): string {
  if (payload.event_name === GENERIC_EVENT_NAME) {
    return clean(payload.segment_event_name) ?? GENERIC_EVENT_NAME
  }
  return payload.event_name
}

/**
 * Coerces the ad account id setting to a number and validates it is a safe integer.
 */
export function resolveAccountId(settings: Settings): number {
  const accountId = Number(settings.account_id)
  if (!Number.isFinite(accountId) || !Number.isSafeInteger(accountId)) {
    throw new IntegrationError('Account ID must be a valid numeric value.', 'INVALID_ACCOUNT_ID', 400)
  }
  return accountId
}

/**
 * Builds a single Quora conversion item (`{ user, device, conversion }`) from a payload.
 * Shared by both the single and batch delivery paths. Empty sub-objects are omitted.
 * Throws a PayloadValidationError if no event name is resolvable.
 */
export function buildConversionItem(payload: Payload): QuoraConversionItem {
  const eventName = resolveEventName(payload)
  if (!clean(eventName)) {
    throw new PayloadValidationError('Event Name is required.')
  }

  const user = {
    email: clean(payload.user?.email),
    name: clean(payload.user?.name),
    phone_number: clean(payload.user?.phone_number),
    date_of_birth: clean(payload.user?.date_of_birth),
    ip: clean(payload.user?.ip),
    country: clean(payload.user?.country),
    region: clean(payload.user?.region),
    city: clean(payload.user?.city),
    postal_code: clean(payload.user?.postal_code)
  }

  const device = {
    mobile_device_id: clean(payload.device?.mobile_device_id),
    user_agent: clean(payload.device?.user_agent),
    language: clean(payload.device?.language),
    referer: clean(payload.device?.referer)
  }

  const item: QuoraConversionItem = {
    conversion: {
      event_name: eventName,
      timestamp: toEpochMicroseconds(payload.timestamp),
      click_id: clean(payload.click_id),
      value: payload.value ?? undefined,
      event_id: clean(payload.event_id)
    }
  }

  if (Object.values(user).some((v) => v !== undefined)) {
    item.user = user
  }
  if (Object.values(device).some((v) => v !== undefined)) {
    item.device = device
  }

  return item
}

/**
 * Shared send routine used by both `perform` and `performBatch`.
 *
 * - Single (`isBatch = false`): POSTs `{ ...item, account_id }` to the single endpoint.
 * - Batch (`isBatch = true`): POSTs `{ account_id, data: [items] }` to the batch endpoint
 *   with `throwHttpErrors: false` so the multi-status body can be interrogated per-item.
 */
export async function sendEvents(
  request: RequestClient,
  settings: Settings,
  items: QuoraConversionItem[],
  isBatch: boolean
): Promise<ModifiedResponse<QuoraSingleResponse | QuoraBatchResponse>> {
  const account_id = resolveAccountId(settings)

  if (isBatch) {
    const body: QuoraBatchRequest = { account_id, data: items }
    return request<QuoraBatchResponse>(BATCH_ENDPOINT, {
      method: 'POST',
      json: body as unknown as JSONLikeObject,
      throwHttpErrors: false
    })
  }

  const body: QuoraSingleRequest = { account_id, ...items[0] }
  return request<QuoraSingleResponse>(SINGLE_ENDPOINT, {
    method: 'POST',
    json: body as unknown as JSONLikeObject
  })
}

/**
 * Inspects a single-event response. Quora returns HTTP 200 even when the one
 * event is rejected, so interrogate the body and throw a PayloadValidationError
 * if the event errored.
 */
export function assertSingleEventSucceeded(response: ModifiedResponse<QuoraSingleResponse | QuoraBatchResponse>): void {
  const data = response.data
  if (!data) return
  const errored = data.events?.find((event) => event.status !== 'OK')
  if (data.events_errored || errored) {
    const code = errored?.error_code ?? 'unknown error'
    const message = errored?.error_message ?? `Quora rejected the event: ${code}`
    throw new PayloadValidationError(message)
  }
}

/**
 * Interprets a batch multi-status response and populates a MultiStatusResponse.
 *
 * `validPayloadIndices` maps each position in `items` back to its original index in
 * the caller's payload array (positions that failed local validation are excluded).
 * Any item not represented in the response `events[]` array defaults to success.
 */
export function handleBatchResponse(
  response: ModifiedResponse<QuoraSingleResponse | QuoraBatchResponse>,
  items: QuoraConversionItem[],
  validPayloadIndices: number[],
  multiStatusResponse: MultiStatusResponse
): MultiStatusResponse {
  const status = response.status
  const data = response.data

  // Transport-level failure — mark every valid item errored with the transport status.
  if (status < 200 || status >= 300 || !data) {
    validPayloadIndices.forEach((originalIndex, position) => {
      multiStatusResponse.setErrorResponseAtIndex(originalIndex, {
        status: status || 400,
        errormessage: response.statusText || 'Quora Conversions API request failed',
        sent: items[position] as unknown as JSONLikeObject
      })
    })
    return multiStatusResponse
  }

  // Index per-item results by their `index` field.
  const resultByIndex = new Map<number, { status: string; error_code?: string; error_message?: string }>()
  ;(data.events ?? []).forEach((event) => {
    resultByIndex.set(event.index, event)
  })

  validPayloadIndices.forEach((originalIndex, position) => {
    const result = resultByIndex.get(position)
    const sent = items[position] as unknown as JSONLikeObject

    if (result && result.status !== 'OK') {
      multiStatusResponse.setErrorResponseAtIndex(originalIndex, {
        status: 400,
        errortype: 'BAD_REQUEST',
        errormessage: result.error_message || `Quora rejected the event: ${result.error_code ?? 'unknown error'}`,
        sent,
        body: result as unknown as JSONLikeObject
      })
    } else {
      multiStatusResponse.setSuccessResponseAtIndex(originalIndex, {
        status: 200,
        sent,
        body: (result as unknown as JSONLikeObject) ?? {}
      })
    }
  })

  return multiStatusResponse
}
