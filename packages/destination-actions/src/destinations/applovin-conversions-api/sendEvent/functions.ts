import { MultiStatusResponse, PayloadValidationError } from '@segment/actions-core'
import type { JSONLikeObject, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { isAlreadyHashed, processHashing } from '../../../lib/hashing-utils'
import {
  API_BASE_URL,
  EVENTS_REQUIRING_ITEMS,
  EVENTS_REQUIRING_QUANTITY,
  EVENTS_REQUIRING_VALUE,
  EVENTS_WITH_ITEMS,
  EVENTS_WITH_VALUE,
  MIN_USER_ID_LENGTH
} from './constants'
import type { EventName } from './constants'
import type {
  AppLovinEvent,
  AppLovinOs,
  AppLovinRequest,
  ParsedCurrency,
  ValidationInput
} from './types'
import { APPLOVIN_CONVERSIONS_API_VERSION } from '../versioning-info'

const GMAIL_DOMAINS = ['gmail.com', 'googlemail.com']

export function normalizeEmail(email: string): string {
  const trimmed = email.replace(/^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$/g, '').toLowerCase()
  if (!/^[!-?A-~]+@[!-?A-~]+$/.test(trimmed)) {
    return ''
  }
  const at = trimmed.indexOf('@')
  const local = trimmed.slice(0, at)
  const domain = trimmed.slice(at + 1)
  if (!GMAIL_DOMAINS.includes(domain)) {
    return trimmed
  }
  const withoutPlus = local.split('+')[0].replace(/\./g, '')
  return withoutPlus ? `${withoutPlus}@${domain}` : ''
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^0+/, '')
}

function hashValue(raw: string, normalize: (value: string) => string): string | undefined {
  if (isAlreadyHashed(raw, 'sha256', 'hex')) {
    return raw.toLowerCase()
  }
  const normalized = normalize(raw)
  return normalized ? processHashing(normalized, 'sha256', 'hex') : undefined
}

export function hashLast10Digits(phone: string): string | undefined {
  if (/[a-z]/i.test(phone)) {
    return undefined
  }
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) {
    return undefined
  }
  return processHashing(digits.slice(-10), 'sha256', 'hex')
}

const OS_VALUES: Record<string, AppLovinOs> = {
  ios: 'ios',
  ipados: 'ios',
  android: 'android',
  macos: 'macos',
  windows: 'windows'
}

function normalizeOs(os: string): AppLovinOs {
  return OS_VALUES[os.toLowerCase()] ?? 'desktop_os'
}

function trimStrings<T>(value: T): T {
  if (typeof value === 'string') {
    return value.trim() as T
  }
  if (Array.isArray(value)) {
    return value.map(trimStrings) as T
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, trimStrings(entry)])) as T
  }
  return value
}

export function parseCurrency(value: string | undefined): ParsedCurrency {
  const currency = value?.trim()
  if (!currency) {
    return {}
  }
  if (!/^[A-Za-z]{3}$/.test(currency)) {
    return { error: 'Currency must be a three-letter ISO 4217 code, for example USD.' }
  }
  return { code: currency.toUpperCase() }
}

function validate({
  name,
  client_ip_address,
  client_user_agent,
  dedupe_id,
  aleid,
  hasOtherIdentifier,
  transaction_id,
  search_term,
  items,
  currency
}: ValidationInput): void {
  const errors: string[] = []

  if (!client_ip_address) {
    errors.push('IP Address is required.')
  }
  if (!client_user_agent) {
    errors.push('User Agent is required.')
  }
  if (!dedupe_id) {
    errors.push('Dedupe ID is required.')
  }
  if (!aleid) {
    errors.push('ALEID is required.')
  }
  if (!hasOtherIdentifier) {
    errors.push('At least one identifier other than ALEID is required: alart, axwrt, client ID, user ID, email or phone.')
  }
  if (name === 'purchase' && !transaction_id) {
    errors.push('Transaction ID is required for purchase events.')
  }
  if (name === 'search' && !search_term) {
    errors.push('Search Term is required for search events.')
  }
  if (EVENTS_REQUIRING_ITEMS.includes(name) && (!items?.length || items.some((item) => !item.item_id))) {
    errors.push(`Each item requires an Item ID for ${name} events.`)
  }
  if (EVENTS_REQUIRING_QUANTITY.includes(name) && items?.some((item) => typeof item.quantity !== 'number')) {
    errors.push(`Each item requires a quantity for ${name} events.`)
  }
  if (currency.error) {
    errors.push(currency.error)
  } else if (EVENTS_REQUIRING_VALUE.includes(name) && !currency.code) {
    errors.push(`Currency is required for ${name} events.`)
  }

  if (errors.length > 0) {
    throw new PayloadValidationError(errors.join(' '))
  }
}

export function buildEvent(payload: Payload): AppLovinEvent {
  const {
    name,
    event_time,
    event_source_url,
    dedupe_id,
    items,
    currency,
    value,
    transaction_id,
    shipping,
    tax,
    is_new_customer,
    payment_type,
    search_term,
    sign_up_method,
    user_data: {
      client_ip_address,
      client_user_agent,
      esi,
      aleid,
      alart,
      axwrt,
      client_id,
      user_id,
      email: rawEmail,
      phone: rawPhone,
      ifa,
      idfv,
      os,
      sid,
      country_code,
      us_zip,
      non_us_zip
    }
  } = trimStrings(payload) as Payload & {
    name: EventName
    user_data: { esi: 'web' | 'app' }
  }

  const email = rawEmail ? hashValue(rawEmail, normalizeEmail) : undefined
  const phone = rawPhone ? hashValue(rawPhone, normalizePhone) : undefined
  const phoneLast10 = rawPhone && !isAlreadyHashed(rawPhone, 'sha256', 'hex') ? hashLast10Digits(rawPhone) : undefined
  const osValue = os ? normalizeOs(os) : undefined
  const zip = us_zip ? us_zip.slice(0, 5) : non_us_zip
  const userId = user_id && user_id.length >= MIN_USER_ID_LENGTH ? user_id : undefined
  const currencyResult = parseCurrency(currency)

  validate({
    name,
    client_ip_address,
    client_user_agent,
    dedupe_id,
    aleid,
    hasOtherIdentifier: [alart, axwrt, client_id, userId, email, phone].some(Boolean),
    transaction_id,
    search_term,
    items,
    currency: currencyResult
  })
  const currencyCode = currencyResult.code

  const data = {
    ...(EVENTS_WITH_ITEMS.includes(name) && items?.length ? { items } : {}),
    ...(EVENTS_WITH_VALUE.includes(name)
      ? {
          ...(currencyCode ? { currency: currencyCode } : {}),
          ...(typeof value === 'number' ? { value } : {})
        }
      : {}),
    ...(name === 'purchase'
      ? {
          ...(transaction_id ? { transaction_id } : {}),
          ...(typeof shipping === 'number' ? { shipping } : {}),
          ...(typeof tax === 'number' ? { tax } : {}),
          ...(typeof is_new_customer === 'boolean' ? { is_new_customer } : {})
        }
      : {}),
    ...(name === 'add_payment_info' && payment_type ? { payment_type } : {}),
    ...(name === 'search' && search_term ? { search_term } : {}),
    ...(name === 'sign_up' && sign_up_method ? { method: sign_up_method } : {})
  }

  return {
    name,
    event_time: new Date(event_time).getTime(),
    ...(event_source_url ? { event_source_url } : {}),
    dedupe_id,
    user_data: {
      client_ip_address,
      client_user_agent,
      esi,
      ...(aleid ? { aleid } : {}),
      ...(alart ? { alart } : {}),
      ...(axwrt ? { axwrt } : {}),
      ...(client_id ? { client_id } : {}),
      ...(userId ? { user_id: userId } : {}),
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(phoneLast10 ? { phone_last10_hashed: phoneLast10 } : {}),
      ...(ifa ? { ifa } : {}),
      ...(idfv ? { idfv } : {}),
      ...(osValue ? { os: osValue } : {}),
      ...(sid ? { sid } : {}),
      ...(country_code ? { country_code } : {}),
      ...(zip ? { zip } : {})
    },
    ...(name === 'page_view' ? { data: null } : {}),
    ...(name !== 'page_view' && name !== 'app_open' ? { data } : {})
  } as AppLovinEvent
}

function sendRequest(request: RequestClient, settings: Settings, events: AppLovinEvent[], throwHttpErrors: boolean) {
  const body: AppLovinRequest = { events }
  return request(`${API_BASE_URL}/${APPLOVIN_CONVERSIONS_API_VERSION}/event`, {
    method: 'post',
    searchParams: { pixel_id: settings.pixel_id },
    headers: { Authorization: settings.api_key },
    json: body,
    throwHttpErrors
  })
}

export async function send(request: RequestClient, settings: Settings, payload: Payload) {
  return sendRequest(request, settings, [buildEvent(payload)], true)
}

export async function sendBatch(request: RequestClient, settings: Settings, payloads: Payload[]) {
  const multiStatusResponse = new MultiStatusResponse()
  const validEvents: { index: number; event: AppLovinEvent }[] = []

  payloads.forEach((payload, index) => {
    try {
      validEvents.push({ index, event: buildEvent(payload) })
    } catch (error) {
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: 400,
        errormessage: (error as Error).message
      })
    }
  })

  if (validEvents.length === 0) {
    return multiStatusResponse
  }

  const response = await sendRequest(
    request,
    settings,
    validEvents.map(({ event }) => event),
    false
  )

  validEvents.forEach(({ index, event }) => {
    const sent = event as unknown as JSONLikeObject
    if (response.status >= 200 && response.status < 300) {
      multiStatusResponse.setSuccessResponseAtIndex(index, {
        status: 200,
        sent,
        body: { success: true }
      })
    } else {
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: response.status,
        errormessage: response.statusText || `AppLovin returned status ${response.status}`,
        sent,
        body: (response.data as JSONLikeObject) ?? response.content
      })
    }
  })

  return multiStatusResponse
}
