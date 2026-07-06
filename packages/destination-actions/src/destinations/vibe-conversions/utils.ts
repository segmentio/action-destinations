import { isIP } from 'net'
import type { RequestClient } from '@segment/actions-core'
import { PayloadValidationError, MultiStatusResponse, getErrorCodeFromHttpStatus } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { Payload } from './trackConversion/generated-types'
import type { ConversionEventRequest, ConversionEventResponse, EventType } from './types'
import { CONVERSION_ENDPOINT, EVENT_TYPES, MAX_EVENT_AGE_MS } from './constants'

function isEventType(value: string): value is EventType {
  return (EVENT_TYPES as readonly string[]).includes(value)
}

// Build the stringified-JSON `ed` value the Vibe API expects.
function serializeEventData(ed: Payload['ed']): string | undefined {
  if (ed === undefined || ed === null) {
    return undefined
  }
  // Drop undefined values so unmapped reserved attributes aren't serialized.
  const cleaned: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(ed)) {
    if (value !== undefined && value !== null) {
      cleaned[key] = value
    }
  }
  if (Object.keys(cleaned).length === 0) {
    return undefined
  }
  return JSON.stringify(cleaned)
}

// Convert an ISO8601 / epoch timestamp to UNIX milliseconds.
function toUnixMs(ts: Payload['ts']): number | undefined {
  if (ts === undefined || ts === null || ts === '') {
    return undefined
  }
  const ms = typeof ts === 'number' ? ts : new Date(ts).getTime()
  if (Number.isNaN(ms)) {
    throw new PayloadValidationError('`ts` (timestamp) is not a valid date.')
  }
  return ms
}

// Build a single typed request body from a payload, applying validation and transforms.
export function buildConversionEvent(payload: Payload, settings: Settings): ConversionEventRequest {
  const { a, eid, ts, ip, em, ed, gid, ua, url } = payload

  if (!isEventType(a)) {
    throw new PayloadValidationError(`\`a\` (Event Type) must be one of: ${EVENT_TYPES.join(', ')}.`)
  }

  if (!ip && !em) {
    throw new PayloadValidationError('Either `ip` (IP Address) or `em` (Email) is required.')
  }

  if (ip && isIP(ip) !== 4) {
    throw new PayloadValidationError('`ip` (IP Address) must be a valid IPv4 address.')
  }

  const tsMs = toUnixMs(ts)
  if (tsMs !== undefined && Date.now() - tsMs > MAX_EVENT_AGE_MS) {
    throw new PayloadValidationError('`ts` (timestamp) must be within the last 7 days.')
  }

  return {
    a,
    eid,
    aid: settings.aid,
    ts: tsMs,
    ip: ip || undefined,
    em: em || undefined,
    ed: serializeEventData(ed),
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

// Send a batch of conversion events.
//
// NOTE: Vibe's conversion API does NOT expose a batch endpoint — there is no
// single request that accepts multiple events. `performBatch` is implemented
// only so that Segment can group events and so that a single invalid or failed
// event does not fail the whole batch (per-event isolation via
// MultiStatusResponse). Under the hood each event is still sent as its own POST
// request. If Vibe adds a true batch endpoint in future, this should be
// reworked to send a single request.
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
