import { MultiStatusResponse, PayloadValidationError } from '@segment/actions-core'
import type { JSONLikeObject, ModifiedResponse, RequestClient } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { Payload } from './sendConversion/generated-types'
import type {
  ActionSource,
  ContentItemJSON,
  EventDataJSON,
  EventJSON,
  EventsErrorResponse,
  EventsRequestJSON,
  EventsResponse,
  EventType,
  IndexedEventJSON
} from './sendConversion/types'
import {
  APP_EVENT_TYPES,
  EVENTS_ENDPOINT,
  EVENT_DATA_TYPES,
  INTEGRATION_SOURCE,
  REJECTED_EVENT_INDEX_REGEX,
  REJECTED_EVENT_PATH_REGEX,
  REJECTED_EVENT_STATUSES,
  RETRY_STATUS
} from './constants'
import {
  clean,
  cleanEmail,
  cleanExternalId,
  cleanName,
  cleanPhone,
  hashValue,
  hashValues,
  toCountry,
  toCurrency,
  toCustomEventName,
  toGaid,
  toIpAddress,
  toMoney,
  toSourceUrl,
  toTimestampMs,
  toVariants
} from './sendConversion/utils'

type ContentItem = NonNullable<Payload['contents']>[number]

function buildContentItem(item: ContentItem, eventCurrency: string | undefined): ContentItemJSON {
  const { id, group_id, name, content_type, quantity, amount, currency, ...variant_attributes } = item

  const itemId = clean(id)
  const groupId = clean(group_id)
  const itemName = clean(name)
  const contentType = clean(content_type)
  const itemCurrency = toCurrency(currency) ?? eventCurrency
  const variants = toVariants(variant_attributes)

  return {
    ...(itemId ? { id: itemId } : {}),
    ...(groupId ? { group_id: groupId } : {}),
    ...(itemName ? { name: itemName } : {}),
    ...(contentType ? { content_type: contentType } : {}),
    ...(quantity !== undefined ? { quantity: Math.trunc(quantity) } : {}),
    ...toMoney(amount, itemCurrency, 'Currency is required when a Contents item has an Amount.'),
    ...(variants ? { variant_dict: variants } : {})
  }
}

function buildData(
  eventType: EventType,
  { amount, currency, plan_id, contents }: Pick<Payload, 'amount' | 'currency' | 'plan_id' | 'contents'>
): EventDataJSON {
  const currencyCode = toCurrency(currency)
  const planId = clean(plan_id)

  const money = toMoney(amount, currencyCode, 'Currency is required when Amount is provided.')

  const buildItems = (): ContentItemJSON[] =>
    (contents ?? []).map((item) => buildContentItem(item, currencyCode)).filter((item) => Object.keys(item).length > 0)

  switch (EVENT_DATA_TYPES[eventType]) {
    case 'customer_action':
      return { type: 'customer_action', ...money }
    case 'contents': {
      const items = buildItems()
      return { type: 'contents', ...money, ...(items.length > 0 ? { contents: items } : {}) }
    }
    case 'plan_enrollment': {
      const items = buildItems()
      return {
        type: 'plan_enrollment',
        ...(planId ? { plan_id: planId } : {}),
        ...money,
        ...(items.length > 0 ? { contents: items } : {})
      }
    }
    case 'custom': {
      const items = buildItems()
      return {
        type: 'custom',
        ...(planId ? { plan_id: planId } : {}),
        ...money,
        ...(items.length > 0 ? { contents: items } : {})
      }
    }
  }
}

export function buildJSON(payload: Payload): EventJSON {
  const {
    event_type,
    event_id,
    timestamp,
    action_source,
    custom_event_name,
    source_url,
    oppref,
    opt_out,
    amount,
    currency,
    plan_id,
    contents,
    essential_identifiers,
    matching_data
  } = payload
  const { email, phone, android_advertising_id } = essential_identifiers
  const { obref, external_id, user_agent, ip_address, first_name, last_name, city, region, country, postal_code } =
    matching_data ?? {}

  const eventType = event_type as EventType
  const actionSource = action_source as ActionSource
  const id = clean(event_id)

  if (id === undefined) {
    throw new PayloadValidationError('Event ID is required.')
  }

  if (APP_EVENT_TYPES.includes(eventType) && actionSource !== 'mobile_app') {
    throw new PayloadValidationError('Action Source must be Mobile App for App Installed and App Opened events.')
  }

  const emailHashes = hashValues(email, cleanEmail)
  const phoneHashes = hashValues(phone, cleanPhone)
  const gaid = toGaid(android_advertising_id)

  if (emailHashes.length === 0 && phoneHashes.length === 0 && !gaid) {
    throw new PayloadValidationError(
      'At least one valid essential identifier is required: Email, Phone or Android Advertising ID.'
    )
  }

  const externalIdHash = hashValue(external_id, cleanExternalId)
  const firstNameHash = hashValue(first_name, cleanName)
  const lastNameHash = hashValue(last_name, cleanName)
  const obrefValue = clean(obref)
  const userAgent = clean(user_agent)
  const ipAddress = toIpAddress(ip_address)
  const cityValue = clean(city)
  const regionValue = clean(region)
  const countryCode = toCountry(country)
  const postalCode = clean(postal_code)

  const sourceUrl = toSourceUrl(source_url, actionSource === 'web')
  const opprefValue = clean(oppref)
  return {
    id,
    type: eventType,
    timestamp_ms: toTimestampMs(timestamp),
    action_source: actionSource,
    ...(eventType === 'custom' ? { custom_event_name: toCustomEventName(custom_event_name) } : {}),
    ...(sourceUrl ? { source_url: sourceUrl } : {}),
    ...(opprefValue ? { oppref: opprefValue } : {}),
    ...(opt_out !== undefined ? { opt_out } : {}),
    user: {
      ...(emailHashes.length > 0 ? { emails_sha256: emailHashes } : {}),
      ...(phoneHashes.length > 0 ? { phone_numbers_sha256: phoneHashes } : {}),
      ...(gaid ? { android_advertising_id: gaid } : {}),
      ...(externalIdHash ? { external_ids_sha256: [externalIdHash] } : {}),
      ...(obrefValue ? { obref: obrefValue } : {}),
      ...(userAgent ? { user_agent: userAgent } : {}),
      ...(ipAddress ? { ip_address: ipAddress } : {}),
      ...(firstNameHash ? { first_names_sha256: [firstNameHash] } : {}),
      ...(lastNameHash ? { last_names_sha256: [lastNameHash] } : {}),
      ...(cityValue ? { cities: [cityValue] } : {}),
      ...(regionValue ? { regions: [regionValue] } : {}),
      ...(countryCode ? { countries: [countryCode] } : {}),
      ...(postalCode ? { postal_codes: [postalCode] } : {})
    },
    data: buildData(eventType, { amount, currency, plan_id, contents })
  }
}

function post(
  request: RequestClient,
  settings: Settings,
  events: EventJSON[],
  throwHttpErrors = true
): Promise<ModifiedResponse<EventsResponse>> {
  const { pixel_id, api_key, validate_only } = settings

  const json: EventsRequestJSON = {
    integration_source: INTEGRATION_SOURCE,
    ...(validate_only ? { validate_only: true } : {}),
    events
  }

  return request<EventsResponse>(EVENTS_ENDPOINT, {
    method: 'post',
    searchParams: { pid: pixel_id.trim() },
    headers: { Authorization: `Bearer ${api_key.trim()}` },
    json,
    throwHttpErrors
  })
}

export function sendSingle(
  request: RequestClient,
  settings: Settings,
  payload: Payload
): Promise<ModifiedResponse<EventsResponse>> {
  return post(request, settings, [buildJSON(payload)])
}

export async function sendBatch(
  request: RequestClient,
  settings: Settings,
  payloads: Payload[]
): Promise<MultiStatusResponse> {
  const multiStatusResponse = new MultiStatusResponse()
  const validEvents: IndexedEventJSON[] = []

  payloads.forEach((payload, index) => {
    try {
      validEvents.push({ event: buildJSON(payload), index })
    } catch (error) {
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: error instanceof Error ? error.message : 'Invalid payload for ChatGPT Conversions API.'
      })
    }
  })

  if (validEvents.length === 0) {
    return multiStatusResponse
  }

  const { status, statusText, data, content } = await post(
    request,
    settings,
    validEvents.map(({ event }) => event),
    false
  )
  const body = (typeof data === 'object' && data !== null ? data : content) as JSONLikeObject | string
  const isSuccess = status >= 200 && status < 300
  const { rejectedPosition, rejectionMessage } = isSuccess
    ? { rejectedPosition: undefined, rejectionMessage: undefined }
    : getRejection(data, validEvents.length)
  // The API only attributes an error to a specific event with 400 (invalid_event) or 422 (timestamp
  // errors). Other failures (401/403 auth, 429, 5xx) affect the whole request, so the status check stops
  // them being treated as a single bad event, which would wrongly make that event non-retryable.
  const isEventRejection = rejectedPosition !== undefined && REJECTED_EVENT_STATUSES.includes(status)
  const errormessage =
    rejectionMessage || statusText || `ChatGPT Conversions API rejected the request with status ${status}.`

  // The API is all-or-nothing and names only ONE bad event per failed request (error.errors[0].param,
  // e.g. "events[2].type"), even if several events are invalid. We fail that event with the API's
  // message and mark the others as retryable (500) so they are re-sent in a new batch. If that batch
  // contains another bad event, the API names it next, so k bad events resolve over k + 1 attempts.
  // If no event is named (auth errors, 5xx, unparseable body) every event shares the same error.
  validEvents.forEach(({ event, index }, position) => {
    const sent = event as unknown as JSONLikeObject
    if (isSuccess) {
      multiStatusResponse.setSuccessResponseAtIndex(index, { status, sent, body })
    } else if (isEventRejection) {
      if (position === rejectedPosition) {
        multiStatusResponse.setErrorResponseAtIndex(index, { status, errormessage, sent, body })
      } else {
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status: RETRY_STATUS,
          errormessage: `Not delivered because another event in the batch was rejected by ChatGPT Conversions API (${errormessage}). It will be retried.`,
          sent,
          body
        })
      }
    } else {
      multiStatusResponse.setErrorResponseAtIndex(index, { status, errormessage, sent, body })
    }
  })

  return multiStatusResponse
}

// Works out which event the API rejected, and why, from a failed (non-2xx) response body.
//
// The API is all-or-nothing: one bad event fails the whole request. It also names only ONE bad event per
// request (error.errors holds a single entry), even when several events are invalid. Which one it names is
// not always the lowest index: schema errors are reported before timestamp errors.
//
// Returns:
//   rejectedPosition: the n in "events[n]", read with REJECTED_EVENT_INDEX_REGEX. This is the event's position in
//     the request we sent, which holds only the events that passed local validation. It is NOT the event's index
//     in the original payloads array. Undefined when no event is named, or when n is outside the batch.
//   rejectionMessage: errors[0].message, falling back to error.message, with the "events[n]." prefix removed
//     (REJECTED_EVENT_PATH_REGEX) because that number means nothing to the customer reading the delivery logs.
//
// Real responses (from live probes), and what this returns for each:
//
// 1. 400, one event is invalid. error.param is "events[0]"; errors[0].param is the field within that event.
//    {
//      "error": {
//        "message": "Invalid event at events[0]. See errors for details.",
//        "type": "invalid_request_error",
//        "param": "events[0]",
//        "code": "invalid_event",
//        "errors": [
//          { "message": "events[0].type must be a supported event type.", "param": "events[0].type", "code": "unknown_event_type" }
//        ]
//      }
//    }
//    => { rejectedPosition: 0, rejectionMessage: "type must be a supported event type." }
//
// 2. 422, event timestamp is more than 7 days old. Same shape; the param points at a different field.
//    {
//      "error": {
//        "message": "event_timestamp_ms must be within the last 7 days.",
//        "type": "invalid_request_error",
//        "param": "events[0].timestamp_ms",
//        "code": "event_timestamp_too_old",
//        "errors": [
//          { "message": "event_timestamp_ms must be within the last 7 days.", "param": "events[0].timestamp_ms", "code": "event_timestamp_too_old" }
//        ]
//      }
//    }
//    => { rejectedPosition: 0, rejectionMessage: "event_timestamp_ms must be within the last 7 days." }
//
// 3. 400, whole request is invalid (here an empty body). The param is "events", not "events[n]", so no regex match.
//    {
//      "error": {
//        "message": "Invalid request body. See errors for details.",
//        "type": "invalid_request_error",
//        "param": null,
//        "code": "invalid_request_body",
//        "errors": [{ "message": "Missing required field: events.", "param": "events", "code": "missing_events" }]
//      }
//    }
//    => { rejectedPosition: undefined, rejectionMessage: "Missing required field: events." }
//
// 4. 401 (wrong API key) and 403 (wrong pixel id). No errors array at all, so the message falls back to error.message.
//    { "error": { "message": "403: unknown pid", "type": "server_error", "param": null, "code": null } }
//    => { rejectedPosition: undefined, rejectionMessage: "403: unknown pid" }
//
// 5. The named event is not always the first bad one. A batch of 6 where event 0 has a timestamp older than 7 days
//    AND event 5 has an unknown type. The API names events[5], not events[0], because it checks schema errors
//    (type, amount, ...) across the whole batch before timestamp errors. Event 0 is not mentioned at all.
//    {
//      "error": {
//        "message": "Invalid event at events[5]. See errors for details.",
//        "type": "invalid_request_error",
//        "param": "events[5]",
//        "code": "invalid_event",
//        "errors": [
//          { "message": "events[5].type must be a supported event type.", "param": "events[5].type", "code": "unknown_event_type" }
//        ]
//      }
//    }
//    => { rejectedPosition: 5, rejectionMessage: "type must be a supported event type." }
//
// 6. Two schema errors of different kinds. A batch of 6 where event 0 has an unknown type and event 5 has a
//    non-integer amount. The API names events[5].data.amount, not events[0].type. So it is not simply the lowest
//    index, and which error wins depends on the order the API runs its checks (the order is not documented).
//    {
//      "error": {
//        "message": "Invalid event at events[5]. See errors for details.",
//        "type": "invalid_request_error",
//        "param": "events[5]",
//        "code": "invalid_event",
//        "errors": [
//          { "message": "events[5].data.amount must be an integer.", "param": "events[5].data.amount", "code": "invalid_amount" }
//        ]
//      }
//    }
//    => { rejectedPosition: 5, rejectionMessage: "data.amount must be an integer." }
//
// Worked example: 4 payloads are sent, payload 0 fails local validation, so the request holds payloads 1, 2 and 3
// at positions 0, 1 and 2. If the API answers with response 1 naming "events[1]", the bad event is position 1,
// which is payload 2. In sendBatch that gives: payload 0 = its own validation error, payload 1 = retry (500),
// payload 2 = 400 with the API's message, payload 3 = retry (500).
function getRejection(
  data: unknown,
  eventCount: number
): { rejectedPosition: number | undefined; rejectionMessage: string | undefined } {
  if (typeof data !== 'object' || data === null) {
    return { rejectedPosition: undefined, rejectionMessage: undefined }
  }
  const { error } = data as EventsErrorResponse
  const firstError = error?.errors?.[0]
  const match = firstError?.param ? REJECTED_EVENT_INDEX_REGEX.exec(firstError.param) : null
  const position = match ? Number(match[1]) : undefined
  const message = (firstError?.message ?? error?.message)?.replace(REJECTED_EVENT_PATH_REGEX, '')
  return {
    rejectedPosition: position !== undefined && position < eventCount ? position : undefined,
    rejectionMessage: message
  }
}
