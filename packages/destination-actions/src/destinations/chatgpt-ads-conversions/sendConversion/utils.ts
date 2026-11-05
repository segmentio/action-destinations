import { isIP } from 'net'
import { PayloadValidationError } from '@segment/actions-core'
import { isAlreadyHashed, processHashing } from '../../../lib/hashing-utils'
import {
  ASCII_PUNCTUATION_AND_WHITESPACE_REGEX,
  CUSTOM_EVENT_NAME_REGEX,
  GAID_REGEX,
  ISO_COUNTRY_CODES,
  ISO_CURRENCY_CODES,
  MAX_CUSTOM_EVENT_NAME_LENGTH,
  MAX_EVENT_AGE_MS,
  MAX_LIST_VALUES,
  MAX_EVENT_FUTURE_MS,
  PHONE_DIGITS_REGEX,
  PHONE_STRIP_REGEX,
  STANDARD_EVENT_NAMES,
  ZERO_GAID
} from '../constants'

export function clean(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

export function cleanEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function cleanPhone(value: string): string {
  const stripped = value.replace(PHONE_STRIP_REGEX, '').replace(/^\+/, '').replace(/^0+/, '')
  return PHONE_DIGITS_REGEX.test(stripped) ? stripped : ''
}

export function cleanExternalId(value: string): string {
  return value.trim()
}

export function cleanName(value: string): string {
  return value.toLowerCase().replace(ASCII_PUNCTUATION_AND_WHITESPACE_REGEX, '')
}

export function hashValue(value: unknown, cleaner: (value: string) => string): string | undefined {
  const trimmed = clean(value)
  if (trimmed === undefined) {
    return undefined
  }
  if (isAlreadyHashed(trimmed, 'sha256', 'hex')) {
    return trimmed.toLowerCase()
  }
  const cleaned = cleaner(trimmed)
  return cleaned === '' ? undefined : processHashing(cleaned, 'sha256', 'hex')
}

export function hashValues(values: unknown, cleaner: (value: string) => string): string[] {
  const list = Array.isArray(values) ? values : [values]
  return list
    .map((value) => hashValue(value, cleaner))
    .filter((hash): hash is string => hash !== undefined)
    .slice(0, MAX_LIST_VALUES)
}

const MINOR_UNIT_EXPONENTS = new Map<string, number>()

export function toMinorUnitExponent(currency: string): number {
  const code = currency.toUpperCase()
  if (!ISO_CURRENCY_CODES.includes(code)) {
    throw new PayloadValidationError(`Currency "${currency}" is not a valid ISO 4217 currency code.`)
  }
  const cached = MINOR_UNIT_EXPONENTS.get(code)
  if (cached !== undefined) {
    return cached
  }
  const exponent =
    new Intl.NumberFormat('en', { style: 'currency', currency: code }).resolvedOptions().maximumFractionDigits ?? 2
  MINOR_UNIT_EXPONENTS.set(code, exponent)
  return exponent
}

export function toMinorUnits(amount: number, currency: string): number {
  const minorUnits = Math.round(Number(`${amount}e${toMinorUnitExponent(currency)}`))
  if (!Number.isSafeInteger(minorUnits) || minorUnits < 0) {
    throw new PayloadValidationError(`Amount "${amount}" cannot be converted to a non-negative integer of minor units.`)
  }
  return minorUnits
}

export function toMoney(
  amount: number | undefined,
  currency: string | undefined,
  missingCurrencyMessage: string
): { amount?: number; currency?: string } {
  if (amount === undefined) {
    return {}
  }
  if (currency === undefined) {
    throw new PayloadValidationError(missingCurrencyMessage)
  }
  return { amount: toMinorUnits(amount, currency), currency }
}

export function toCurrency(value: unknown): string | undefined {
  const currency = clean(value)
  if (currency === undefined) {
    return undefined
  }
  toMinorUnitExponent(currency)
  return currency.toUpperCase()
}

export function toTimestampMs(timestamp: string | number): number {
  const timestampMs = new Date(timestamp).getTime()
  if (Number.isNaN(timestampMs)) {
    throw new PayloadValidationError('Timestamp is not a valid date.')
  }
  const age = Date.now() - timestampMs
  if (age > MAX_EVENT_AGE_MS) {
    throw new PayloadValidationError('Timestamp is more than 7 days old, which ChatGPT Ads rejects.')
  }
  if (-age > MAX_EVENT_FUTURE_MS) {
    throw new PayloadValidationError('Timestamp is more than 10 minutes in the future, which ChatGPT Ads rejects.')
  }
  return timestampMs
}

function isHttpUrl(value: string): boolean {
  try {
    const { protocol, host } = new URL(value)
    return (protocol === 'http:' || protocol === 'https:') && host !== ''
  } catch {
    return false
  }
}

export function toSourceUrl(value: unknown, isRequired: boolean): string | undefined {
  const sourceUrl = clean(value)
  if (sourceUrl === undefined) {
    if (isRequired) {
      throw new PayloadValidationError('Source URL is required when Action Source is Web.')
    }
    return undefined
  }
  if (isHttpUrl(sourceUrl)) {
    return sourceUrl
  }
  if (isRequired) {
    throw new PayloadValidationError('Source URL must be a valid URL with a scheme and host.')
  }
  return undefined
}

export function toCustomEventName(value: unknown): string {
  const customEventName = clean(value)?.toLowerCase()
  if (customEventName === undefined) {
    throw new PayloadValidationError('Custom Event Name is required when Event Type is Custom.')
  }
  if (!CUSTOM_EVENT_NAME_REGEX.test(customEventName)) {
    throw new PayloadValidationError(
      'Custom Event Name must contain only letters, digits, underscores and hyphens, and start and end with a letter or digit.'
    )
  }
  if (customEventName.length > MAX_CUSTOM_EVENT_NAME_LENGTH) {
    throw new PayloadValidationError(
      `Custom Event Name must be at most ${MAX_CUSTOM_EVENT_NAME_LENGTH} characters, which ChatGPT Ads enforces.`
    )
  }
  if (STANDARD_EVENT_NAMES.includes(customEventName)) {
    throw new PayloadValidationError('Custom Event Name must not match a standard event type.')
  }
  return customEventName
}

export function toIpAddress(value: unknown): string | undefined {
  const ipAddress = clean(value)
  if (ipAddress !== undefined && isIP(ipAddress) === 0) {
    throw new PayloadValidationError(`IP Address "${ipAddress}" is not a valid IPv4 or IPv6 address.`)
  }
  return ipAddress
}

export function toCountry(value: unknown): string | undefined {
  const country = clean(value)?.toUpperCase()
  if (country !== undefined && !ISO_COUNTRY_CODES.includes(country)) {
    throw new PayloadValidationError(`Country "${country}" is not a valid ISO 3166-1 alpha-2 country code.`)
  }
  return country
}

export function toGaid(value: unknown): string | undefined {
  const gaid = clean(value)?.toLowerCase()
  return gaid !== undefined && GAID_REGEX.test(gaid) && gaid !== ZERO_GAID ? gaid : undefined
}

export function toVariants(variants: Record<string, unknown> | undefined): Record<string, string> | undefined {
  const entries = Object.entries(variants ?? {}).flatMap(([key, value]) => {
    const variantKey = clean(key)
    const variantValue = ['string', 'number', 'boolean'].includes(typeof value) ? clean(String(value)) : undefined
    return variantKey !== undefined && variantValue !== undefined ? [[variantKey, variantValue]] : []
  })
  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}
