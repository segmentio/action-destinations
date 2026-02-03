/* eslint-disable @typescript-eslint/no-explicit-any */
import type { RequestClient } from '@segment/actions-core'
import type {
  EventSpecResponse,
  EventSpecResponseWire,
  EventSpecEntry,
  PropertyConstraints,
  PropertyConstraintsWire,
  FetchEventSpecParams
} from './EventFetcherTypes'

/** Base URL for the event spec API */
const DEFAULT_BASE_URL = 'https://api.avo.app'
/** Network timeout in milliseconds */
const DEFAULT_TIMEOUT = 2000

/**
 * Fetches an event specification from the API.
 *
 * Returns null if:
 * - The network request fails
 * - The response has an invalid status code (non-200)
 * - The response is invalid or malformed
 * - The request times out
 *
 * This function gracefully degrades - failures do not throw errors.
 * When null is returned, validation should be skipped for that event.
 */
export async function fetchEventSpec(
  request: RequestClient,
  env: string,
  params: FetchEventSpecParams,
  baseUrl: string = DEFAULT_BASE_URL,
  timeout: number = DEFAULT_TIMEOUT
): Promise<EventSpecResponse | null> {
  // Only fetch specs in dev/staging environments
  if (env !== 'dev' && env !== 'staging') {
    return null
  }

  const url = buildUrl(params, baseUrl)

  try {
    const wireResponse = await makeRequest(request, url, timeout)
    if (!wireResponse) {
      return null
    }

    // Basic structure check for wire format
    if (!hasExpectedShape(wireResponse)) {
      return null
    }

    // Parse wire format to internal format
    return parseEventSpecResponse(wireResponse)
  } catch {
    return null
  }
}

/** Builds the complete URL with query parameters. */
function buildUrl(params: FetchEventSpecParams, baseUrl: string): string {
  const queryParams = new URLSearchParams({
    apiKey: params.apiKey,
    streamId: params.streamId,
    eventName: params.eventName
  })
  return `${baseUrl}/trackingPlan/eventSpec?${queryParams.toString()}`
}

/**
 * Makes an HTTP GET request using RequestClient.
 * Returns the parsed JSON response or null on failure.
 */
async function makeRequest(
  request: RequestClient,
  url: string,
  timeout: number
): Promise<EventSpecResponseWire | null> {
  try {
    const response: any = await request(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Segment (Actions)' },
      timeout: timeout,
      throwHttpErrors: false
    })

    if (response.status === 200) {
      try {
        // RequestClient automatically parses JSON responses, so response.data should be the parsed object
        // But we check if it's a string just in case
        const data: any = typeof response.data === 'string' ? JSON.parse(response.data as string) : response.data
        return data
      } catch {
        return null
      }
    } else {
      return null
    }
  } catch {
    return null
  }
}

/**
 * Basic shape check for wire format - ensures response has the minimum expected structure.
 * Format: { events: [{b, id, vids, p}], metadata: {...} }
 */
function hasExpectedShape(response: any): response is EventSpecResponseWire {
  return (
    response &&
    typeof response === 'object' &&
    Array.isArray(response.events) &&
    response.metadata &&
    typeof response.metadata === 'object' &&
    // Basic check of first event if present
    (response.events.length === 0 ||
      (typeof response.events[0].id === 'string' &&
        typeof response.events[0].b === 'string' &&
        Array.isArray(response.events[0].vids) &&
        typeof response.events[0].p === 'object'))
  )
}

/**
 * Parses the wire format response into internal format.
 */
function parseEventSpecResponse(wire: EventSpecResponseWire): EventSpecResponse {
  const events: EventSpecEntry[] = []

  if (wire.events) {
    for (const evt of wire.events) {
      const baseEventId = evt.id
      const variantIds = evt.vids || []
      const branchId = evt.b

      // Collect all IDs that these constraints apply to
      // For per-event entries, this includes the base event and any variants listed
      const eventIds = [baseEventId, ...variantIds]

      const props: Record<string, PropertyConstraints> = {}

      for (const [propName, propWire] of Object.entries(evt.p)) {
        props[propName] = convertWirePropToConstraints(propWire, eventIds)
      }

      events.push({
        branchId,
        baseEventId,
        variantIds,
        props
      })
    }
  }

  return {
    events,
    metadata: wire.metadata
  }
}

function convertWirePropToConstraints(wire: PropertyConstraintsWire, eventIds: string[]): PropertyConstraints {
  const type = getTypeString(wire)
  const required = wire.r
  const isListType = wire.l === true

  const result: PropertyConstraints = {
    type: isListType ? 'list' : type,
    required,
    isList: isListType
  }

  // Allowed values (v)
  if (wire.v) {
    if (Array.isArray(wire.v)) {
      // Legacy format: v is an array, convert to object format
      const key = JSON.stringify(wire.v)
      result.allowedValues = { [key]: [...eventIds] }
    } else if (typeof wire.v === 'object') {
      // New format: v is already an object mapping JSON-stringified arrays to event IDs
      // Use the event IDs from wire.v directly (they specify which events this constraint applies to)
      result.allowedValues = {}
      for (const [allowedArrayJson, vEventIds] of Object.entries(wire.v)) {
        result.allowedValues[allowedArrayJson] = [...vEventIds]
      }
    }
  }

  // Min/Max ranges
  if (wire.min !== undefined || wire.max !== undefined) {
    // Format: "min,max" where min/max can be empty string
    // e.g. "0," means >= 0, ",100" means <= 100
    const minStr = wire.min !== undefined ? wire.min.toString() : ''
    const maxStr = wire.max !== undefined ? wire.max.toString() : ''
    const key = `${minStr},${maxStr}`
    result.minMaxRanges = { [key]: [...eventIds] }
  }

  // Regex patterns
  if (wire.rx) {
    result.regexPatterns = { [wire.rx]: [...eventIds] }
  }

  // Handle nested properties
  const nestedSchema = getNestedSchema(wire)
  if (nestedSchema) {
    result.children = {}
    for (const [childName, childWire] of Object.entries(nestedSchema)) {
      result.children[childName] = convertWirePropToConstraints(childWire, eventIds)
    }
  }

  return result
}

/**
 * Gets the type string from a wire property.
 * If `t` is an object (for nested objects), returns "object".
 */
function getTypeString(wire: PropertyConstraintsWire): string {
  if (typeof wire.t === 'string') {
    return wire.t
  }
  // t is an object containing nested property schemas
  return 'object'
}

/**
 * Gets the nested schema from a wire property.
 * Returns the nested property schemas if `t` is an object, otherwise undefined.
 */
function getNestedSchema(
  wire: PropertyConstraintsWire | undefined
): Record<string, PropertyConstraintsWire> | undefined {
  if (!wire) return undefined
  if (typeof wire.t === 'object' && wire.t !== null) {
    return wire.t
  }
  return undefined
}
