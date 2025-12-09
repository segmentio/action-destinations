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
   * API returns: { branchId, baseEvent: { name, id, props }, variants: [...] }
   */
  private hasExpectedShape(response: any): response is EventSpecResponseWire {
    return (
      response &&
      typeof response === 'object' &&
      typeof response.branchId === 'string' &&
      response.baseEvent &&
      typeof response.baseEvent === 'object' &&
      typeof response.baseEvent.name === 'string' &&
      typeof response.baseEvent.id === 'string' &&
      response.baseEvent.props &&
      typeof response.baseEvent.props === 'object' &&
      Array.isArray(response.variants)
    )
  }

  /**
   * Parses the wire format response into internal format.
   *
   * The API returns a single event with its variants. We transform this into
   * our internal format which has an array of EventSpecEntry (one entry containing
   * the base event ID and all variant IDs, with merged property constraints).
   */
  private static parseEventSpecResponse(wire: EventSpecResponseWire): EventSpecResponse {
    const baseEventId = wire.baseEvent.id
    const variantIds = wire.variants.map((v) => v.eventId)

    // Collect all event IDs (base + variants)
    const allEventIds = [baseEventId, ...variantIds]

    // Parse base event props and merge with variant props
    const mergedProps = EventSpecFetcher.parseAndMergeProps(
      wire.baseEvent.props,
      baseEventId,
      wire.variants,
      allEventIds
    )

    const entry: EventSpecEntry = {
      branchId: wire.branchId,
      baseEventId: baseEventId,
      variantIds: variantIds,
      props: mergedProps
    }

    return {
      events: [entry],
      metadata: {
        schemaId: '', // Not provided in this API format
        branchId: wire.branchId,
        latestActionId: '' // Not provided in this API format
      }
    }
  }

  /**
   * Parses and merges property constraints from base event and variants.
   *
   * For each property, we need to:
   * 1. Parse the wire format into internal format
   * 2. Convert allowed values array to Record<string, eventIds>
   * 3. Convert min/max to Record<string, eventIds>
   * 4. Track which event IDs have which constraints
   */
  private static parseAndMergeProps(
    baseProps: Record<string, PropertyConstraintsWire>,
    baseEventId: string,
    variants: Array<{ eventId: string; props: Record<string, PropertyConstraintsWire> }>,
    allEventIds: string[]
  ): Record<string, PropertyConstraints> {
    const result: Record<string, PropertyConstraints> = {}

    // Collect all property names from base and all variants
    const allPropNames = new Set<string>(Object.keys(baseProps))
    for (const variant of variants) {
      for (const propName of Object.keys(variant.props)) {
        allPropNames.add(propName)
      }
    }

    // Process each property
    for (const propName of Array.from(allPropNames)) {
      const baseProp = baseProps[propName]
      const variantProps = variants.map((v) => ({
        eventId: v.eventId,
        prop: v.props[propName]
      }))

      result[propName] = EventSpecFetcher.mergePropertyConstraints(baseProp, baseEventId, variantProps, allEventIds)
    }

    return result
  }

  /**
   * Merges property constraints from base event and variants into a single PropertyConstraints.
   */
  private static mergePropertyConstraints(
    baseProp: PropertyConstraintsWire | undefined,
    baseEventId: string,
    variantProps: Array<{ eventId: string; prop: PropertyConstraintsWire | undefined }>,
    allEventIds: string[]
  ): PropertyConstraints {
    // Determine type and required from first available definition
    let type = 'unknown'
    let required = false
    let isListType = false

    if (baseProp) {
      type = EventSpecFetcher.getTypeString(baseProp)
      required = baseProp.r
      isListType = baseProp.l === true
    } else {
      for (const vp of variantProps) {
        if (vp.prop) {
          type = EventSpecFetcher.getTypeString(vp.prop)
          required = vp.prop.r
          isListType = vp.prop.l === true
          break
        }
      }
    }

    const result: PropertyConstraints = {
      type: isListType ? 'list' : type,
      required
    }

    // Collect allowed values from all sources
    const allowedValuesMap: Record<string, string[]> = {}
    const minMaxRangesMap: Record<string, string[]> = {}

    // Process base prop
    if (baseProp) {
      EventSpecFetcher.addConstraintsFromProp(baseProp, baseEventId, allowedValuesMap, minMaxRangesMap)
    }

    // Process variant props
    for (const vp of variantProps) {
      if (vp.prop) {
        EventSpecFetcher.addConstraintsFromProp(vp.prop, vp.eventId, allowedValuesMap, minMaxRangesMap)
      }
    }

    // Add merged constraints to result
    if (Object.keys(allowedValuesMap).length > 0) {
      result.allowedValues = allowedValuesMap
    }
    if (Object.keys(minMaxRangesMap).length > 0) {
      result.minMaxRanges = minMaxRangesMap
    }

    // Handle nested properties (for object or list of objects)
    const nestedSchema = EventSpecFetcher.getNestedSchema(baseProp)
    if (nestedSchema) {
      result.children = {}
      for (const [childName, childWire] of Object.entries(nestedSchema)) {
        // For nested properties, collect constraints from all variants too
        const variantChildProps = variantProps.map((vp) => ({
          eventId: vp.eventId,
          prop: vp.prop ? EventSpecFetcher.getNestedSchema(vp.prop)?.[childName] : undefined
        }))

        result.children[childName] = EventSpecFetcher.mergePropertyConstraints(
          childWire,
          baseEventId,
          variantChildProps,
          allEventIds
        )
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

  /**
   * Adds constraints from a wire property to the accumulator maps.
   */
  private static addConstraintsFromProp(
    wire: PropertyConstraintsWire,
    eventId: string,
    allowedValuesMap: Record<string, string[]>,
    minMaxRangesMap: Record<string, string[]>
  ): void {
    // Handle allowed values (v is an array of strings in the API)
    if (wire.v && Array.isArray(wire.v)) {
      // Convert array to JSON string key for internal format
      const key = JSON.stringify(wire.v)
      if (!allowedValuesMap[key]) {
        allowedValuesMap[key] = []
      }
      allowedValuesMap[key].push(eventId)
    }

    // Handle min/max ranges
    if (wire.min !== undefined || wire.max !== undefined) {
      const min = wire.min ?? Number.MIN_SAFE_INTEGER
      const max = wire.max ?? Number.MAX_SAFE_INTEGER
      const key = `${min},${max}`
      if (!minMaxRangesMap[key]) {
        minMaxRangesMap[key] = []
      }
      minMaxRangesMap[key].push(eventId)
    }
  }
}
