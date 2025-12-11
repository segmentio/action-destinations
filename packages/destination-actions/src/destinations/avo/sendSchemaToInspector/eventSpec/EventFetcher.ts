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

/**
 * EventSpecFetcher handles fetching event specifications from the Avo API.
 *
 * Endpoint: GET /trackingPlan/eventSpec
 * Base URL: https://api.avo.app
 */
export class EventSpecFetcher {
  /** Base URL for the event spec API */
  private readonly baseUrl: string
  /** Network timeout in milliseconds */
  private readonly timeout: number
  /** In-flight requests to prevent duplicate fetches */
  private inFlightRequests: Map<string, Promise<EventSpecResponse | null>>
  /** RequestClient for making HTTP requests */
  private readonly request: RequestClient
  /** Whether to log debug information */
  private readonly shouldLog: boolean
  /** Environment name */
  private readonly env: string

  constructor(request: RequestClient, shouldLog = false, env: string, baseUrl = 'https://api.avo.app', timeout = 2000) {
    this.baseUrl = baseUrl
    this.request = request
    this.shouldLog = shouldLog
    this.env = env
    this.timeout = timeout
    this.inFlightRequests = new Map()
  }

  /** Generates a unique key for tracking in-flight requests. */
  private generateRequestKey(params: FetchEventSpecParams): string {
    return `${params.apiKey}:${params.streamId}:${params.eventName}`
  }

  /**
   * Fetches an event specification from the API.
   *
   * Returns null if:
   * - The network request fails
   * - The response has an invalid status code (non-200)
   * - The response is invalid or malformed
   * - The request times out
   *
   * This method gracefully degrades - failures do not throw errors.
   * When null is returned, Phase 2 should skip validation for that event.
   */
  async fetch(params: FetchEventSpecParams): Promise<EventSpecResponse | null> {
    const requestKey: string = this.generateRequestKey(params)
    // Check if there's already an in-flight request for this spec
    const existingRequest: Promise<EventSpecResponse | null> | undefined = this.inFlightRequests.get(requestKey)
    if (existingRequest) {
      if (this.shouldLog) {
        console.log(
          `[EventSpecFetcher] Returning existing in-flight request for streamId=${params.streamId}, eventName=${params.eventName}`
        )
      }
      return existingRequest
    }
    // Create and track the new request
    const requestPromise: Promise<EventSpecResponse | null> = this.fetchInternal(params)
    this.inFlightRequests.set(requestKey, requestPromise)
    try {
      const result: EventSpecResponse | null = await requestPromise
      return result
    } finally {
      // Clean up the in-flight request tracking
      this.inFlightRequests.delete(requestKey)
    }
  }

  /** Internal fetch implementation. */
  private async fetchInternal(params: FetchEventSpecParams): Promise<EventSpecResponse | null> {
    // eslint-disable-next-line no-constant-condition
    if (this.env !== 'dev' && this.env !== 'staging') {
      return null
    }
    const url: string = this.buildUrl(params)
    if (this.shouldLog) {
      console.log(`[EventSpecFetcher] Fetching event spec for: ${params.eventName}`)
      console.log(`[EventSpecFetcher] Using base URL: ${this.baseUrl}`)
    }
    try {
      const wireResponse: EventSpecResponseWire | null = await this.makeRequest(url)
      if (!wireResponse) {
        if (this.shouldLog) {
          console.warn(`[EventSpecFetcher] Failed to fetch event spec for: ${params.eventName}`)
        }
        return null
      }
      // Basic structure check for wire format
      if (!this.hasExpectedShape(wireResponse)) {
        if (this.shouldLog) {
          console.warn(`[EventSpecFetcher] Invalid event spec response for: ${params.eventName}`)
        }
        return null
      }
      // Parse wire format to internal format
      const response: EventSpecResponse = EventSpecFetcher.parseEventSpecResponse(wireResponse)
      if (this.shouldLog) {
        console.log(`[EventSpecFetcher] Successfully fetched event spec for: ${params.eventName}`)
      }
      return response
    } catch (error) {
      if (this.shouldLog) {
        console.error(`[EventSpecFetcher] Error fetching event spec for: ${params.eventName}`, error)
      }
      return null
    }
  }

  /** Builds the complete URL with query parameters. */
  private buildUrl(params: FetchEventSpecParams): string {
    const queryParams: URLSearchParams = new URLSearchParams({
      apiKey: params.apiKey,
      streamId: params.streamId,
      eventName: params.eventName
    })
    return `${this.baseUrl}/trackingPlan/eventSpec?${queryParams.toString()}`
  }

  /**
   * Makes an HTTP GET request using RequestClient.
   * Returns the parsed JSON response or null on failure.
   */
  private async makeRequest(url: string): Promise<EventSpecResponseWire | null> {
    try {
      const response: any = await this.request(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Segment (Actions)' },
        timeout: this.timeout,
        throwHttpErrors: false
      })
      if (response.status === 200) {
        try {
          // RequestClient automatically parses JSON responses, so response.data should be the parsed object
          // But we check if it's a string just in case
          const data: any = typeof response.data === 'string' ? JSON.parse(response.data as string) : response.data
          return data
        } catch (error) {
          if (this.shouldLog) {
            console.error('[EventSpecFetcher] Failed to parse response:', error)
          }
          return null
        }
      } else {
        if (this.shouldLog) {
          console.warn(`[EventSpecFetcher] Request failed with status: ${response.status}`)
        }
        return null
      }
    } catch (error: any) {
      if (this.shouldLog) {
        console.error('[EventSpecFetcher] Network error occurred:', error)
        if (error.message) {
          console.error('[EventSpecFetcher] Error message:', error.message)
        }
      }
      return null
    }
  }

  /**
   * Basic shape check for wire format - ensures response has the minimum expected structure.
   * Format: { events: [{b, id, vids, p}], metadata: {...} }
   */
  private hasExpectedShape(response: any): response is EventSpecResponseWire {
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
  private static parseEventSpecResponse(wire: EventSpecResponseWire): EventSpecResponse {
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
          props[propName] = EventSpecFetcher.convertWirePropToConstraints(propWire, eventIds)
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
      metadata: wire.metadata || {}
    }
  }

  private static convertWirePropToConstraints(wire: PropertyConstraintsWire, eventIds: string[]): PropertyConstraints {
    const type = EventSpecFetcher.getTypeString(wire)
    const required = wire.r
    const isListType = wire.l === true

    const result: PropertyConstraints = {
      type: isListType ? 'list' : type,
      required,
      isList: isListType
    }

    // Allowed values (v)
    if (wire.v && Array.isArray(wire.v)) {
      // Key is the JSON stringified array of allowed values
      const key = JSON.stringify(wire.v)
      result.allowedValues = { [key]: [...eventIds] }
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
    const nestedSchema = EventSpecFetcher.getNestedSchema(wire)
    if (nestedSchema) {
      result.children = {}
      for (const [childName, childWire] of Object.entries(nestedSchema)) {
        result.children[childName] = EventSpecFetcher.convertWirePropToConstraints(childWire, eventIds)
      }
    }

    return result
  }

  /**
   * Gets the type string from a wire property.
   * If `t` is an object (for nested objects), returns "object".
   */
  private static getTypeString(wire: PropertyConstraintsWire): string {
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
  private static getNestedSchema(
    wire: PropertyConstraintsWire | undefined
  ): Record<string, PropertyConstraintsWire> | undefined {
    if (!wire) return undefined
    if (typeof wire.t === 'object' && wire.t !== null) {
      return wire.t
    }
    return undefined
  }
}
