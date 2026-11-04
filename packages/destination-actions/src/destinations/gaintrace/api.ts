import type { JSONLikeObject, RequestClient } from '@segment/actions-core'
import { MultiStatusResponse, PayloadValidationError } from '@segment/actions-core'
import { API_BASE, MAX_EVENTS_PER_REQUEST } from './constants'
import type { EventsApiResponse, EventSource, GainTraceEvent } from './types'

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

export function toIso(value?: string | number): string | undefined {
  if (value == null) return undefined
  const date = new Date(value)
  const ms = date.getTime()
  if (Number.isNaN(ms)) return undefined
  return date.toISOString()
}

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
  const properties = safeObject(payload.properties)

  return {
    event_name: payload.eventName as string,
    event_category: payload.eventCategory || defaultCategory,
    source: 'segment',
    source_event_id: payload.messageId as string,
    timestamp: toIso(payload.timestamp) as string,
    ...(payload.userId ? { user_id: payload.userId } : {}),
    ...(payload.anonymousId ? { anonymous_id: payload.anonymousId } : {}),
    ...(properties ? { properties } : {})
  }
}

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

  if (isBatch && payloads.length > MAX_EVENTS_PER_REQUEST) {
    throw new PayloadValidationError(
      `GainTrace accepts at most ${MAX_EVENTS_PER_REQUEST} events per request; received ${payloads.length}.`
    )
  }

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

  const response = await request<EventsApiResponse>(`${API_BASE}/events`, {
    method: 'POST',
    json: { events }
  })

  if (!isBatch) return response

  const results = response.data?.data?.results
  originalIndexes.forEach((originalIndex, sentIndex) => {
    const result = results?.[sentIndex]
    if (!result || result.status === 'inserted' || result.status === 'duplicate') {
      multiStatus.setSuccessResponseAtIndex(originalIndex, {
        status: 200,
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
