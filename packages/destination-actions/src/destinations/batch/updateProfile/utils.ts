import { Payload} from './generated-types'
import { ProfileAttributes, BatchJSON, SubscriptionSetting, EventAttributes, EventObject, Event } from './types'
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
        $email_marketing: email_marketing as SubscriptionSetting,
        $sms_marketing: sms_marketing as SubscriptionSetting,
        $language: extractLanguage(language),
        $region: extractRegion(region),
        $timezone: timezone
    }

    Object.keys(nativeProfileAttributes).forEach((key) => {
        delete customAttributes[key]
    })

    const customProfileAttributes = formatAttributes(customAttributes, false)
        
    const attributes: ProfileAttributes = 
        Object.fromEntries(
            Object.entries({ ...nativeProfileAttributes, ...customProfileAttributes })
                .slice(0, MAX_ATTRIBUTES_SIZE)
        )

    const events: Event[] | undefined = eventName ? [{
        name: eventName,
        attributes: formatAttributes(eventAttributes ?? {}, true)}] : undefined

    const json: BatchJSON = {
        identifiers,
        attributes: Object.keys(attributes).length === 0 ? undefined : attributes,
        events
    }

    return json
}

function formatAttributes(attributes: Record<string, unknown>, allowObjects: true): EventAttributes
function formatAttributes(attributes: Record<string, unknown>, allowObjects?: false): ProfileAttributes
function formatAttributes(attributes: Record<string, unknown>, allowObjects?: boolean): EventAttributes | ProfileAttributes {
  const result: EventAttributes = {};

  for (const [key, value] of Object.entries(attributes)) {
    if (typeof value === 'string') {
      result[fixAttributeName(key)] = value
    } 
    else if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
      result[fixAttributeName(key)] = value
    } 
    else if (allowObjects) {
      if (Array.isArray(value)) {
        if (value.every(item => typeof item === 'string')) {
          result[fixAttributeName(key)] = value as string[]
        } 
        else if (value.every(isFlatObject)) {
          result[fixAttributeName(key)] = value.map(obj => formatFlatObject(obj))
        }
      } 
      else if (isFlatObject(value)) {
        result[fixAttributeName(key)] = formatFlatObject(value)
      }
    }
  }

  return result
}

function extractLanguage(language: string | undefined | null): string | undefined | null {
  if(language === null) return null
  const lang = language?.trim().split('-')[0]
  return lang && lang.length === 2 ? lang : undefined
}

function extractRegion(region: string | undefined | null): string | undefined | null {
  if(region === null) return null
  if (!region) return undefined
  if (region.length === 2) return region
  const regionFromLocale = region.trim().split('-')[1]
  return regionFromLocale?.length === 2 ? regionFromLocale : undefined
}

function fixAttributeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9_]/g, '');
}

function correctKey(key: string, value: unknown): string {
    if (typeof value === 'string') {
        if (isISO8601Date(value)) return `date(${fixAttributeName(key)})`;
        if (isValidUrl(value)) return `url(${fixAttributeName(key)})`;
    }
    return key
}

function isFlatObject(obj: unknown): obj is EventObject {
  if (typeof obj !== 'object' || obj === null) return false
  return Object.values(obj).every(value =>
    ['string', 'number', 'boolean'].includes(typeof value) || value === null || value === undefined
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