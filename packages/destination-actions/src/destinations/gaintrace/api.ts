import type { JSONLikeObject, RequestClient } from '@segment/actions-core'
import { MultiStatusResponse, PayloadValidationError } from '@segment/actions-core'
import { GAINTRACE_API_VERSION } from './versioning-info'

/**
 * GainTrace's public API. Hardcoded rather than a setting: the base URL is a
 * published contract (`docs/api-design.openapi.json`), and a user-supplied host
 * would be an SSRF surface for no benefit.
 */
export const API_BASE = `https://app.gaintrace.com/api/${GAINTRACE_API_VERSION}`

/** Explicit ceiling so a slow response cannot pin a delivery worker. */
export const REQUEST_TIMEOUT_MS = 30_000

/**
 * Hard cap documented by POST /api/v1/events, which rejects a larger array
 * outright. Enforced in code as well as declared in `batch_size`, so a
 * misconfigured or future batching change cannot silently fail a whole batch.
 */
export const MAX_EVENTS_PER_REQUEST = 1000

/** Per-item outcome returned by POST /api/v1/events, aligned to the sent array. */
export type ItemStatus = 'inserted' | 'duplicate' | 'error' | 'rejected'

export interface EventsApiResponse {
  data?: {
    inserted?: number
    duplicates?: number
    errors?: number
    results?: Array<{ status: ItemStatus; reason?: string }>
  }
  validation_errors?: Array<{ index: number; error: string }>
}

export interface GainTraceEvent extends JSONLikeObject {
  event_name: string
  event_category: string
  source: 'segment'
  source_event_id: string
  timestamp: string
  user_id?: string
  anonymous_id?: string
  properties?: JSONLikeObject
}

/** Shape shared by trackEvent and pageView before it becomes a GainTraceEvent. */
export interface EventSource {
  messageId?: string
  timestamp?: string | number
  eventName?: string
  eventCategory?: string
  userId?: string
  anonymousId?: string
  properties?: Record<string, unknown>
}

/**
 * Copy own enumerable keys into a null-prototype object.
 *
 * Payload objects come from customer event data, so iterating with `for...in`
 * would pick up inherited keys and a `__proto__` key could pollute the
 * accumulator. Returns undefined for an empty result so callers omit the field
 * entirely rather than sending `{}`.
 */
export function safeObject(input?: Record<string, unknown>): JSONLikeObject | undefined {
  if (!input) return undefined
  const out = Object.create(null) as Record<string, unknown>
  let count = 0
  for (const key of Object.keys(input)) {
    if (key === '__proto__') continue
    const value = input[key]
    if (value === undefined) continue
    out[key] = value
    count++
  }
  return count > 0 ? (out as JSONLikeObject) : undefined
}

/**
 * Normalise a Segment timestamp to ISO-8601.
 *
 * No clock validation of any kind. Segment replays historical data into newly
 * connected destinations, so backdated timestamps are the normal case, not an
 * anomaly, and a sending client's clock may legitimately run ahead of Segment's.
 */
export function toIso(value?: string | number): string | undefined {
  if (value == null) return undefined
  const date = new Date(value)
  const ms = date.getTime()
  if (Number.isNaN(ms)) return undefined
  return date.toISOString()
}

/** Validate one event, returning a human message when it cannot be sent. */
export function validateEvent(payload: EventSource): string | undefined {
  if (!payload.messageId) {
    return 'messageId is required. GainTrace deduplicates on it, so without it a Segment replay would count the same event more than once.'
  }
  if (!payload.eventName) return 'An event name is required.'
  if (!toIso(payload.timestamp)) return 'A valid ISO-8601 timestamp is required.'
  if (!payload.userId && !payload.anonymousId) {
    return 'Either a User ID or an Anonymous ID is required to attribute the event.'
  }
  return undefined
}

function toApiEvent(payload: EventSource, defaultCategory: string): GainTraceEvent {
  return {
    event_name: payload.eventName as string,
    event_category: payload.eventCategory || defaultCategory,
    source: 'segment',
    source_event_id: payload.messageId as string,
    timestamp: toIso(payload.timestamp) as string,
    ...(payload.userId ? { user_id: payload.userId } : {}),
    ...(payload.anonymousId ? { anonymous_id: payload.anonymousId } : {}),
    ...(safeObject(payload.properties) ? { properties: safeObject(payload.properties) } : {})
  }
}

/**
 * The one code path for both single and batch sends.
 *
 * `perform` wraps its single payload in an array and calls this, so there is no
 * second implementation to drift. The only branch is the return value: a batch
 * gets a MultiStatusResponse with per-event outcomes, a single send gets the raw
 * response so ordinary error handling applies.
 */
export async function sendEvents(
  request: RequestClient,
  payloads: EventSource[],
  defaultCategory: string,
  isBatch: boolean
) {
  const multiStatus = new MultiStatusResponse()

  if (payloads.length === 0) {
    if (isBatch) return multiStatus
    throw new PayloadValidationError('No event to send.')
  }

  // Filtered-index -> original-index map. Per-item results from the API are
  // positional against what we SENT, so without this a single invalid event
  // shifts every subsequent result onto the wrong original event.
  const originalIndexes: number[] = []
  const events: GainTraceEvent[] = []

  payloads.forEach((payload, index) => {
    const problem = validateEvent(payload)
    if (problem) {
      if (!isBatch) throw new PayloadValidationError(problem)
      multiStatus.setErrorResponseAtIndex(index, {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: problem
      })
      return
    }
    originalIndexes.push(index)
    events.push(toApiEvent(payload, defaultCategory))
  })

  if (events.length === 0) return multiStatus

  if (events.length > MAX_EVENTS_PER_REQUEST) {
    throw new PayloadValidationError(
      `GainTrace accepts at most ${MAX_EVENTS_PER_REQUEST} events per request; received ${events.length}.`
    )
  }

  const response = await request<EventsApiResponse>(`${API_BASE}/events`, {
    method: 'POST',
    json: { events }
  })

  if (!isBatch) return response

  const results = response.data?.data?.results
  originalIndexes.forEach((originalIndex, sentIndex) => {
    const result = results?.[sentIndex]
    // No per-item result means the API accepted the batch without detail; the
    // request itself succeeded, so report success rather than inventing failure.
    if (!result || result.status === 'inserted' || result.status === 'duplicate') {
      multiStatus.setSuccessResponseAtIndex(originalIndex, {
        status: 200,
        // Deliberately NOT echoing the sent payload: MultiStatus bodies are
        // surfaced and stored, and event properties can carry personal data.
        sent: { source_event_id: events[sentIndex].source_event_id } as JSONLikeObject,
        body: { status: result?.status ?? 'accepted' }
      })
      return
    }
    multiStatus.setErrorResponseAtIndex(originalIndex, {
      status: 400,
      errortype: 'BAD_REQUEST',
      errormessage: result.reason ?? `GainTrace rejected the event (${result.status}).`,
      sent: { source_event_id: events[sentIndex].source_event_id } as JSONLikeObject,
      body: { status: result.status, reason: result.reason }
    })
  })

  return multiStatus
}
