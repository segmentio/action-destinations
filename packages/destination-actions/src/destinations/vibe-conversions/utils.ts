import type { RequestClient } from '@segment/actions-core'
import { PayloadValidationError } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { Payload } from './trackConversion/generated-types'
import type { ConversionEventRequest, ConversionEventResponse, EventType } from './types'
import { CONVERSION_ENDPOINT, MAX_EVENT_AGE_MS } from './constants'

// Convert an event data value to the stringified-JSON shape the Vibe API expects.
function serializeEventData(ed: Payload['ed']): string | undefined {
  if (ed === undefined || ed === null) return undefined
  if (typeof ed === 'string') return ed
  return JSON.stringify(ed)
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
  const { a, eid, ts, ip, em, ed, gid, ua, url } = payload

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
    ed: serializeEventData(ed),
    gid: gid || undefined,
    ua: ua || undefined,
    url: url || undefined
  }
}

// Send a single conversion event to Vibe. The API has no batch endpoint,
// so events are sent one request at a time.
export function sendEvent(request: RequestClient, settings: Settings, payload: Payload) {
  const body = buildConversionEvent(payload, settings)
  return request<ConversionEventResponse>(CONVERSION_ENDPOINT, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json'
    },
    json: body
  })
}
