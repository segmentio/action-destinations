import { Payload } from './generated-types'
import {
  Identifiers,
  ProfileAttributes,
  BatchJSON,
  SubscriptionSetting,
  EventAttributes,
  EventObject,
  Event
} from './type'
import { MAX_ATTRIBUTES_SIZE } from './constants'

export function mapPayload(payload: Payload): BatchJSON {
  const {
    profileAttributes: {
      language,
      email_address,
      phone_number,
      email_marketing,
      sms_marketing,
      region,
      timezone,
      ...customAttributes
    } = {},
    identifiers,
    eventName,
    eventAttributes
  } = payload

  const nativeProfileAttributes: ProfileAttributes = {
    $email_address: email_address,
    $phone_number: phone_number,
    $email_marketing: mapSubscription(email_marketing) === 'reset' ? null : (email_marketing as SubscriptionSetting),
    $sms_marketing: mapSubscription(sms_marketing) === 'reset' ? null : (sms_marketing as SubscriptionSetting),
    $language: extractLanguage(language),
    $region: extractRegion(region),
    $timezone: timezone
  }

  Object.keys(nativeProfileAttributes).forEach((key) => {
    delete customAttributes[key]
  })

  const customProfileAttributes = formatAttributes(customAttributes, false)

  const attributes: ProfileAttributes = Object.fromEntries(
    Object.entries({ ...nativeProfileAttributes, ...customProfileAttributes }).slice(0, MAX_ATTRIBUTES_SIZE)
  )

  const eventNameCleaned = formatEventName(eventName)

  const events: Event[] | undefined = eventNameCleaned
    ? [
        {
          name: eventNameCleaned,
          attributes: formatAttributes(eventAttributes ?? {}, true)
        }
      ]
    : undefined

  const json: BatchJSON = {
    identifiers: formatIdentifiers(identifiers),
    attributes: Object.keys(attributes).length === 0 ? undefined : attributes,
    events
  }

  return json
}

export function formatAttributes(attributes: Record<string, unknown>, allowObjects: true): EventAttributes
export function formatAttributes(attributes: Record<string, unknown>, allowObjects?: false): ProfileAttributes
export function formatAttributes(
  attributes: Record<string, unknown>,
  allowObjects?: boolean
): EventAttributes | ProfileAttributes {
  const result: EventAttributes = {}

  for (const [key, value] of Object.entries(attributes)) {
    const newKey = correctKey(key, value)

    if (typeof value === 'string') {
      result[newKey] = value
    } else if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
      result[newKey] = value
    } else if (allowObjects) {
      if (Array.isArray(value)) {
        if (value.every((item) => typeof item === 'string')) {
          result[newKey] = value
        } else if (value.every(isFlatObject)) {
          result[newKey] = value.map((obj) => formatFlatObject(obj))
        }
      } else if (isFlatObject(value)) {
        result[newKey] = formatFlatObject(value)
      }
    }
  }

  return result
}

export function formatIdentifiers(identifiers: Payload['identifiers']): Identifiers {
  const cleanedIdentifiers: Identifiers = {
    custom_id: identifiers.custom_id,
    ...Object.fromEntries(
      Object.entries(identifiers)
        .filter(([key]) => key !== 'custom_id')
        .map(([key, value]) => [key, String(value)])
    )
  }
  return cleanedIdentifiers
}

function formatEventName(eventName: string | undefined | null): string | undefined {
  if (!eventName) return undefined
  const e = eventName.toLowerCase().replace(/[^a-z0-9_]/g, '_')
  return e.length > 0 ? e : undefined
}

function extractLanguage(language: string | undefined | null): string | undefined | null {
  if (language === null) return null
  const lang = language?.trim().split('-')[0]
  return lang && lang.length === 2 ? lang : undefined
}

function extractRegion(region: string | undefined | null): string | undefined | null {
  if (region === null) return null
  if (!region) return undefined
  if (region.length === 2) return region
  const regionFromLocale = region.trim().split('-')[1]
  return regionFromLocale?.length === 2 ? regionFromLocale : undefined
}

function fixAttributeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9_]/g, '')
}

function correctKey(key: string, value: unknown): string {
  if (typeof value === 'string') {
    if (isISO8601Date(value)) return `date(${fixAttributeName(key)})`
    if (isValidUrl(value)) return `url(${fixAttributeName(key)})`
    return fixAttributeName(key)
  }
  return key
}

function isFlatObject(obj: unknown): obj is EventObject {
  if (typeof obj !== 'object' || obj === null) return false
  return Object.values(obj).every(
    (value) => ['string', 'number', 'boolean'].includes(typeof value) || value === null || value === undefined
  )
}

function formatFlatObject(obj: EventObject): EventObject {
  const result: EventObject = {}
  for (const [key, value] of Object.entries(obj)) {
    result[correctKey(key, value)] = value
  }
  return result
}

function isISO8601Date(value: string): boolean {
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3,6})?Z$/
  return iso8601Regex.test(value)
}

function isValidUrl(value: string): boolean {
  const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i
  return urlRegex.test(value)
}

function mapSubscription(value: unknown): SubscriptionSetting | 'reset' {
  if (value === null || value === undefined) return 'reset'
  if (typeof value === 'boolean') return value ? 'subscribed' : 'unsubscribed'

  if (typeof value === 'string') {
    const v = value.trim().toLowerCase()
    if (v === 'reset') return 'reset'
    if (v === 'subscribed') return 'subscribed'
    if (v === 'unsubscribed') return 'unsubscribed'
    if (v === 'true') return 'subscribed'
    if (v === 'false') return 'unsubscribed'
  }

  return 'reset'
}

