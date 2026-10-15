import { PayloadValidationError, RequestClient } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { PRODUCTION_URL, TESTING_URL } from './constants'
import type { FlatRecord, FlatValue, InflectionJSON } from './types'

export function getEndpoint(settings: Settings): string {
  return settings.environment === 'testing' ? TESTING_URL : PRODUCTION_URL
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

function flattenValue(value: unknown): FlatValue | undefined {
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

export function flattenValues(values?: Record<string, unknown>): FlatRecord | undefined {
  if (!values) {
    return undefined
  }
  const entries = Object.entries(values).flatMap(([key, value]) => {
    const flat = flattenValue(value)
    return flat === undefined ? [] : [[key, flat] as const]
  })
  return entries.length > 0 ? Object.fromEntries(entries) : undefined
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
