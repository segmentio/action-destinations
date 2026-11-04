import { MultiStatusResponse, PayloadValidationError } from '@segment/actions-core'
import type { JSONLikeObject, ModifiedResponse, RequestClient } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { Payload } from './sendConversion/generated-types'
import type {
  ActionSource,
  ContentItemJSON,
  EventDataJSON,
  EventJSON,
  EventsRequestJSON,
  EventsResponse,
  EventType,
  IndexedEventJSON
} from './sendConversion/types'
import { APP_EVENT_TYPES, EVENTS_ENDPOINT, EVENT_DATA_TYPES, INTEGRATION_SOURCE } from './constants'
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
        errormessage: error instanceof Error ? error.message : 'Invalid payload for ChatGPT Ads Conversions.'
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

  validEvents.forEach(({ event, index }) => {
    const sent = event as unknown as JSONLikeObject
    if (isSuccess) {
      multiStatusResponse.setSuccessResponseAtIndex(index, { status, sent, body })
    } else {
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status,
        errormessage: statusText || `ChatGPT Ads rejected the request with status ${status}.`,
        sent,
        body
      })
    }
  })

  return multiStatusResponse
}
