// Exception for explicit raw Customer ID: processHashing skips hashing a 64-hex ID,
// which would send the raw identifier. CAPI requires hashing the trimmed raw value.
// eslint-disable-next-line no-restricted-syntax
import { createHash } from 'crypto'
import { isIP } from 'net'
import { PayloadValidationError } from '@segment/actions-core'
import { processHashing } from '../../../lib/hashing-utils'
import type { Payload } from './generated-types'
import { EVENT_DATA_TYPES, GEO_LIST_FIELDS, HASH_LIST_FIELDS } from '../constants'

const fail = (message: string): never => {
  throw new PayloadValidationError(message)
}
const hash = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex')
const defined = (value: unknown) => value !== undefined && value !== null

function currencyCode(value: string | undefined): string | undefined {
  if (value === undefined) return undefined
  const code = value.trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(code)) fail('Currency must be a three-letter ISO 4217 code.')
  return code
}

export function minorAmount(
  value: number | undefined,
  currency: string | undefined,
  units: string
): number | undefined {
  if (value === undefined) return undefined
  if (!currency) fail('Currency is required when a value or item price is present.')
  if (!Number.isFinite(value)) fail('Value and item prices must be finite numbers.')
  if (units === 'minor') {
    if (!Number.isSafeInteger(value)) fail('Minor-unit amounts must be safe integers.')
    return value
  }
  // Decimal-string arithmetic avoids errors such as 19.99 * 100 = 1998.9999999999998.
  const digits =
    new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2
  const match = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(String(value))
  if (!match) return fail('Value must be a decimal number.')
  const [, sign, whole, fraction = '', exponent = '0'] = match
  const shift = digits + Number(exponent) - fraction.length
  let integer = BigInt(whole + fraction)
  if (shift >= 0) integer *= 10n ** BigInt(shift)
  else {
    const divisor = 10n ** BigInt(-shift)
    if (integer % divisor !== 0n) fail('Value has more decimal places than this currency supports.')
    integer /= divisor
  }
  const result = Number(sign === '-' ? -integer : integer)
  if (!Number.isSafeInteger(result)) fail('Amount is too large to send without losing precision.')
  return result
}

function matchingData(payload: Payload) {
  const user = { ...payload.user_data }
  if (defined(payload.email)) {
    if (defined(user.email_sha256)) fail('Map either Email or Email SHA-256, not both.')
    const email = payload.email.trim().toLowerCase()
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Email must be a valid email address.')
    user.email_sha256 = processHashing(email, 'sha256', 'hex')
  }
  if (defined(payload.external_id)) {
    if (defined(user.external_id_sha256)) fail('Map either Customer ID or External ID SHA-256, not both.')
    const externalId = payload.external_id.trim()
    if (!externalId) fail('Customer ID must not be blank.')
    user.external_id_sha256 = hash(externalId)
  }
  for (const name of ['email_sha256', 'external_id_sha256', ...HASH_LIST_FIELDS] as const) {
    const value = user[name]
    if (!defined(value)) continue
    const values = Array.isArray(value) ? value : [value]
    if (values.length > 3) fail(`Matching Data: ${name} supports at most three values.`)
    if (values.some((item) => typeof item !== 'string' || !/^[0-9a-f]{64}$/.test(item.trim()))) {
      fail(`Matching Data: ${name} requires lowercase, 64-character SHA-256 hashes.`)
    }
    // Keep hashing explicit. Never guess whether an arbitrary raw identifier is a hash.
    if (Array.isArray(value)) Object.assign(user, { [name]: value.map((item) => item.trim()) })
    else Object.assign(user, { [name]: value.trim() })
  }
  for (const name of GEO_LIST_FIELDS) {
    if ((user[name]?.length ?? 0) > 3) fail(`Matching Data: ${name} supports at most three values.`)
  }
  for (const [singular, plural] of [
    ['email_sha256', 'emails_sha256'],
    ['external_id_sha256', 'external_ids_sha256']
  ] as const) {
    if (user[plural] && new Set([...(user[plural] ?? []), ...(user[singular] ? [user[singular]] : [])]).size > 3) {
      fail(`Matching Data: ${singular} and ${plural} together support at most three unique values.`)
    }
  }
  if (user.ip_address !== undefined && !isIP(user.ip_address)) fail('IP Address must be a valid IPv4 or IPv6 address.')
  for (const name of ['obref', 'user_agent'] as const) {
    const value = user[name]
    if (value !== undefined && !value.trim()) fail(`Matching Data: ${name} must not be blank.`)
  }
  return Object.keys(user).length ? user : undefined
}

function pageUrl(value: string): string {
  try {
    const url = new URL(value)
    if (!['https:', 'http:'].includes(url.protocol) || !url.hostname)
      fail('Page URL must be an HTTP or HTTPS URL with a host.')
    // URLs often carry login tokens and personal data outside the path.
    // Attribution references have their own explicit field.
    url.username = ''
    url.password = ''
    url.search = ''
    url.hash = ''
    return url.toString()
  } catch {
    return fail('Page URL must be an HTTP or HTTPS URL with a host.')
  }
}

export function formatEvent(payload: Payload) {
  if (!Object.prototype.hasOwnProperty.call(EVENT_DATA_TYPES, payload.event_type))
    fail('Select a supported website Event Type.')
  const dataType = EVENT_DATA_TYPES[payload.event_type as keyof typeof EVENT_DATA_TYPES]
  if (!payload.event_id.trim()) fail('Event ID must not be blank.')
  const timestamp = typeof payload.timestamp === 'number' ? payload.timestamp : Date.parse(payload.timestamp)
  if (!Number.isSafeInteger(timestamp)) fail('Event Time must be a valid timestamp.')
  if (typeof payload.timestamp === 'string' && !/(Z|[+-]\d{2}:\d{2})$/i.test(payload.timestamp)) {
    fail('Event Time must include its timezone.')
  }
  const sourceUrl = pageUrl(payload.source_url)
  const units = payload.amount_units ?? 'major'
  if (!['major', 'minor'].includes(units)) fail('Amount Units must be major or minor.')
  const currency = currencyCode(payload.currency)
  const amount = minorAmount(payload.amount, currency, units)
  const canHaveItems = ['contents', 'plan_enrollment', 'custom'].includes(dataType)
  if (!canHaveItems && payload.contents?.length) fail('Items are not supported for this Event Type.')
  if (defined(payload.plan_id) && !['plan_enrollment', 'custom'].includes(dataType)) {
    fail('Plan ID is supported only for subscription, trial, or custom events.')
  }
  let customName: string | undefined
  if (payload.event_type === 'custom') {
    customName = payload.custom_event_name?.toLowerCase()
    if (!customName || !/^[a-z0-9](?:[a-z0-9_-]{0,62}[a-z0-9])?$/.test(customName)) {
      fail(
        'Custom Event Name must use 1–64 letters, numbers, underscores or hyphens, with a letter or number at each end.'
      )
    }
    if (
      Object.prototype.hasOwnProperty.call(EVENT_DATA_TYPES, customName ?? '') ||
      ['app_installed', 'app_opened'].includes(customName ?? '')
    ) {
      fail('Custom Event Name must not be a reserved standard event name.')
    }
  } else if (defined(payload.custom_event_name) || defined(payload.custom_properties)) {
    fail('Custom Event Name and Custom Properties are supported only for custom events.')
  }
  const reserved = ['type', 'amount', 'currency', 'contents', 'plan_id', 'custom_event_name']
  if (Object.keys(payload.custom_properties ?? {}).some((key) => reserved.includes(key))) {
    fail('Custom Properties must not override standard fields. Use their separate mapping fields.')
  }
  const contents = canHaveItems
    ? (payload.contents ?? []).map((item) => {
        const itemCurrency = currencyCode(item.currency) ?? currency
        if (item.quantity !== undefined && !Number.isSafeInteger(item.quantity))
          fail('Quantity must be a safe integer.')
        if (item.variant_dict && Object.values(item.variant_dict).some((value) => typeof value !== 'string')) {
          fail('Variant values must be strings.')
        }
        return { ...item, amount: minorAmount(item.amount, itemCurrency, units), currency: itemCurrency }
      })
    : undefined
  return {
    id: payload.event_id,
    type: payload.event_type,
    timestamp_ms: timestamp,
    action_source: 'web',
    source_url: sourceUrl,
    custom_event_name: customName,
    oppref: payload.oppref,
    opt_out: payload.opt_out,
    user: matchingData(payload),
    data: {
      ...payload.custom_properties,
      type: dataType,
      amount,
      currency,
      contents,
      plan_id: payload.plan_id
    }
  }
}
