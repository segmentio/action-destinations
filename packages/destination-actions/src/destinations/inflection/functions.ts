import { PayloadValidationError, RequestClient } from '@segment/actions-core'
import type { Settings } from './generated-types'
import {
  ARRAY_HANDLING,
  ARRAY_JOIN_DELIMITER,
  ENVIRONMENT,
  KEY_SEPARATOR,
  OBJECT_HANDLING,
  PRODUCTION_URL,
  TESTING_URL
} from './constants'
import type {
  MaybeAudiencePayload,
  Audience,
  FlatRecord,
  FlatValue,
  InflectionJSON,
  NestedValueOptions,
  TraitsOrProperties
} from './types'

export function getEndpoint(settings: Settings): string {
  return settings.environment === ENVIRONMENT.TESTING ? TESTING_URL : PRODUCTION_URL
}

export function requiredString(value: string, label: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new PayloadValidationError(`${label} must not be empty.`)
  }
  return trimmed
}

export function optionalString(value?: string): string | undefined {
  return value?.trim() || undefined
}

function stringifyValue(value: unknown): FlatValue | undefined {
  if (value === null || value === undefined) {
    return undefined
  }
  if (typeof value === 'string') {
    return value.trim() || undefined
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'object' && Object.keys(value).length === 0) {
    return undefined
  }
  return JSON.stringify(value)
}

function joinArray(values: unknown[]): string | undefined {
  const joined = values
    .filter((item) => item !== null && item !== undefined)
    .map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item).trim()))
    .filter(Boolean)
    .join(ARRAY_JOIN_DELIMITER)
  return joined || undefined
}

function collectEntries(key: string, value: unknown, options: NestedValueOptions): Array<[string, FlatValue]> {
  if (Array.isArray(value)) {
    if (options.arrays === ARRAY_HANDLING.FLATTEN) {
      return value.flatMap((item, index) => collectEntries(`${key}${KEY_SEPARATOR}${index}`, item, options))
    }
    if (options.arrays === ARRAY_HANDLING.JOIN) {
      const joined = joinArray(value)
      return joined === undefined ? [] : [[key, joined]]
    }
  } else if (typeof value === 'object' && value !== null && options.objects === OBJECT_HANDLING.FLATTEN) {
    return Object.entries(value).flatMap(([childKey, child]) =>
      collectEntries(`${key}${KEY_SEPARATOR}${childKey}`, child, options)
    )
  }
  const flat = stringifyValue(value)
  return flat === undefined ? [] : [[key, flat]]
}

export function flattenValues(
  values?: Record<string, unknown>,
  options: NestedValueOptions = {}
): FlatRecord | undefined {
  if (!values) {
    return undefined
  }
  const entries = Object.entries(values).flatMap(([key, value]) => collectEntries(key, value, options))
  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

function getAudience({ audienceDetails }: MaybeAudiencePayload, resolvedMembership?: boolean): Audience | undefined {
  const audienceName = optionalString(audienceDetails?.audienceName)
  const audienceMembership = audienceDetails?.audienceMembership ?? resolvedMembership
  return audienceName && typeof audienceMembership === 'boolean' ? { audienceName, audienceMembership } : undefined
}

export function buildAttributes(
  traitsOrProperties: TraitsOrProperties,
  payload: MaybeAudiencePayload,
  resolvedMembership?: boolean,
  reservedKey?: string
): FlatRecord | undefined {
  const audience = getAudience(payload, resolvedMembership)
  const engageKey = optionalString(payload.engageAudienceKey)
  const flattened = flattenValues(traitsOrProperties, {
    objects: payload.nestedValueHandling?.objectHandling,
    arrays: payload.nestedValueHandling?.arrayHandling
  })

  const attributes = Object.entries({
    ...flattened,
    ...(audience ? { [audience.audienceName]: audience.audienceMembership } : {})
  }).filter(([key]) => {
    const isOverriddenEngageKey = audience && key === engageKey && key !== audience.audienceName
    const isReserved = reservedKey && key.toLowerCase() === reservedKey.toLowerCase()
    return !isOverriddenEngageKey && !isReserved
  })

  return attributes.length > 0 ? Object.fromEntries(attributes) : undefined
}

export function send(request: RequestClient, settings: Settings, json: InflectionJSON) {
  return request(getEndpoint(settings), {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${settings.apiKey}:`).toString('base64')}`
    },
    json
  })
}
