import type { RequestClient } from '@segment/actions-core'
import { PayloadValidationError, MultiStatusResponse, getErrorCodeFromHttpStatus } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { Payload } from './trackConversion/generated-types'
import type { ConversionEventRequest, ConversionEventResponse, EventType } from './types'
import { CONVERSION_ENDPOINT, MAX_EVENT_AGE_MS } from './constants'

// Build the stringified-JSON `ed` value the Vibe API expects, merging the
// reserved attributes (price_usd, purchase_id) into the event data object.
function buildEventData(payload: Payload): string | undefined {
  const { ed, price_usd, purchase_id } = payload

  const merged: Record<string, unknown> = { ...(ed ?? {}) }
  if (price_usd !== undefined && price_usd !== null) merged.price_usd = price_usd
  if (purchase_id !== undefined && purchase_id !== null) merged.purchase_id = purchase_id

  if (Object.keys(merged).length === 0) return undefined
  return JSON.stringify(merged)
}

// Convert an ISO8601 / epoch timestamp to UNIX milliseconds.
function toUnixMs(ts: Payload['ts']): number | undefined {
  if (ts === undefined || ts === null || ts === '') return undefined
  const ms = typeof ts === 'number' ? ts : new Date(ts).getTime()
  if (Number.isNaN(ms)) {
    throw new PayloadValidationError('`ts` (timestamp) is not a valid date.')
  }
  return ms
}

// Build a single typed request body from a payload, applying validation and transforms.
export function buildConversionEvent(payload: Payload, settings: Settings): ConversionEventRequest {
  const { a, eid, ts, ip, em, gid, ua, url } = payload

  if (!ip && !em) {
    throw new PayloadValidationError('Either `ip` (IP Address) or `em` (Email) is required.')
  }

  const tsMs = toUnixMs(ts)
  if (tsMs !== undefined) {
    const now = Date.now()
    if (now - tsMs > MAX_EVENT_AGE_MS) {
      throw new PayloadValidationError('`ts` (timestamp) must be within the last 7 days.')
    }
  }

  return {
    a: a as EventType,
    eid,
    aid: settings.aid,
    ts: tsMs,
    ip: ip || undefined,
    em: em || undefined,
    ed: buildEventData(payload),
    gid: gid || undefined,
    ua: ua || undefined,
    url: url || undefined
  }
}

// Post a single typed request body to the Vibe conversion endpoint.
function postEvent(request: RequestClient, body: ConversionEventRequest) {
  return request<ConversionEventResponse>(CONVERSION_ENDPOINT, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json'
    },
    json: body
  })
}

// Send a single conversion event to Vibe.
export function sendEvent(request: RequestClient, settings: Settings, payload: Payload) {
  const body = buildConversionEvent(payload, settings)
  return postEvent(request, body)
}

// Send a batch of conversion events. Vibe has no batch endpoint, so each event
// is sent as its own request. Validation and delivery are isolated per event so
// one invalid or failed event does not fail the whole batch.
export async function sendBatch(
  request: RequestClient,
  settings: Settings,
  payloads: Payload[]
): Promise<MultiStatusResponse> {
  const multiStatusResponse = new MultiStatusResponse()

  await Promise.all(
    payloads.map(async (payload, index) => {
      let body: ConversionEventRequest
      try {
        body = buildConversionEvent(payload, settings)
      } catch (error) {
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status: (error as { status?: number })?.status ?? 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: (error as Error)?.message ?? 'Validation failed'
        })
        return
      }

      try {
        const response = await postEvent(request, body)
        multiStatusResponse.setSuccessResponseAtIndex(index, {
          status: response.status,
          sent: body as unknown as Record<string, unknown>,
          body: (response.data as unknown as Record<string, unknown>) ?? {}
        })
      } catch (error) {
        const status = (error as { status?: number })?.status ?? 500
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status,
          errortype: getErrorCodeFromHttpStatus(status),
          errormessage: (error as Error)?.message ?? 'Delivery failed',
          sent: body as unknown as Record<string, unknown>
        })
      }
    })
  )

  return multiStatusResponse
}
