/**
 * Normalizes API response bodies before diffing.
 *
 * Strips all non-deterministic values (IDs, timestamps, job statuses)
 * and replaces them with type placeholders so structural diffs are clean.
 *
 * e.g.  { id: "abc123" }  →  { id: "<string>" }
 *       { created: "2026-04-01T..." }  →  { created: "<datetime>" }
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/
// Field names whose values are always non-deterministic
const NONDETERMINISTIC_KEYS = new Set([
  'id',
  'job_id',
  'request_id',
  'correlation_id',
  'created',
  'updated',
  'datetime',
  'completed_at',
  'expires_at',
  'scheduled_at',
  'started_at',
  'created_at',
  'updated_at',
  'completed_count',
  'errored_count',
  'failed_count',
  'total_count'
])

// Field names that are status strings that may change mid-flight
const STATUS_KEYS = new Set(['status'])

export function normalizeValue(key: string, value: unknown): unknown {
  if (value === null) return null
  if (value === undefined) return undefined

  if (NONDETERMINISTIC_KEYS.has(key)) {
    if (typeof value === 'string') return '<string>'
    if (typeof value === 'number') return '<number>'
    return '<value>'
  }

  if (STATUS_KEYS.has(key) && typeof value === 'string') {
    return '<status>'
  }

  if (typeof value === 'string') {
    if (UUID_RE.test(value)) return '<uuid>'
    if (ISO_DATE_RE.test(value)) return '<datetime>'
    // Don't replace opaque IDs in values unless the key is known non-deterministic
    return value
  }

  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value

  if (Array.isArray(value)) {
    return value.map((item) => normalize(item))
  }

  if (typeof value === 'object') {
    return normalize(value as Record<string, unknown>)
  }

  return value
}

export function normalize(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map((item) => normalize(item))

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    result[key] = normalizeValue(key, value)
  }
  return result
}

export interface NormalizedResponse {
  status: number
  body: unknown
  headers: Record<string, string>
}

// Headers we care about structurally (not values like rate limit remaining)
const STRUCTURAL_HEADERS = new Set(['content-type', 'x-klaviyo-rate-limit-tier'])

export function normalizeResponse(status: number, body: unknown, headers: Record<string, string>): NormalizedResponse {
  const filteredHeaders: Record<string, string> = {}
  for (const key of STRUCTURAL_HEADERS) {
    if (headers[key]) filteredHeaders[key] = headers[key]
  }

  return {
    status,
    body: normalize(body),
    headers: filteredHeaders
  }
}
