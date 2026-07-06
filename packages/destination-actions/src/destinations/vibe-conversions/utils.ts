import { isIP } from 'net'
import type { RequestClient } from '@segment/actions-core'
import { PayloadValidationError } from '@segment/actions-core'
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
  if (tsMs !== undefined) {
    const now = Date.now()
    if (tsMs > now) {
      throw new PayloadValidationError('`ts` (timestamp) cannot be in the future.')
    }
    if (now - tsMs > MAX_EVENT_AGE_MS) {
      throw new PayloadValidationError('`ts` (timestamp) must be within the last 7 days.')
    }
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

// Send a single conversion event to Vibe. The API has no batch endpoint,
// so events are always sent one request at a time.
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
