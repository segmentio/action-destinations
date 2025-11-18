import type { RequestClient } from '@segment/actions-core'
import type { EventSpec, FetchEventSpecParams } from './EventFetcherTypes'

/**
 * EventSpecFetcher handles fetching event specifications from the Avo API.
 *
 * Endpoint: GET /getEventSpec
 * Base URL: https://api.avo.app/inspector/v1
 */
export class EventSpecFetcher {
  /** Base URL for the event spec API */
  private readonly baseUrl: string
  /** RequestClient for making HTTP requests */
  private readonly request: RequestClient
  /** Whether to log debug information */
  private readonly shouldLog: boolean

  constructor(request: RequestClient, shouldLog = false, baseUrl = 'https://api.avo.app/inspector/v1') {
    this.baseUrl = baseUrl
    this.request = request
    this.shouldLog = shouldLog
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
  async fetch(params: FetchEventSpecParams): Promise<EventSpec | null> {
    const requestPromise: Promise<EventSpec | null> = this.fetchInternal(params)
    const result: EventSpec | null = await requestPromise
    return result
  }

  /** Internal fetch implementation. */
  private async fetchInternal(params: FetchEventSpecParams): Promise<EventSpec | null> {
    const url: string = this.buildUrl(params)
    if (this.shouldLog) {
      console.log(`[EventSpecFetcher] Fetching event spec for: ${params.eventName}`)
      console.log(`[EventSpecFetcher] URL: ${url}`)
    }
    try {
      const response: any = await this.makeRequest(url)
      if (!response) {
        if (this.shouldLog) {
          console.warn(`[EventSpecFetcher] Failed to fetch event spec for: ${params.eventName}`)
        }
        return null
      }
      // Validate the response structure
      if (!this.isValidEventSpec(response)) {
        if (this.shouldLog) {
          console.warn(`[EventSpecFetcher] Invalid event spec response for: ${params.eventName}`)
        }
        return null
      }
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
      // apiKey: params.apiKey,
      // streamId: params.streamId,
      eventName: params.eventName,
      sourceId: 'WUFObVFR4PVbZGtT1hQ5WUFObVFR4PVbZGtT1hQ5',
      schemaId: 'fwtXqAc0fCLy7b7oGW40',
      branchId: 'master'
    })
    //return `${this.baseUrl}/getEventSpec?${queryParams.toString()}`
    return `${this.baseUrl}/?${queryParams.toString()}`
  }

  /**
   * Makes an HTTP GET request using RequestClient.
   * Returns the parsed JSON response or null on failure.
   */
  private async makeRequest(url: string): Promise<any> {
    try {
      const response: any = await this.request(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        throwHttpErrors: false
      })
      if (response.status === 200) {
        try {
          // RequestClient automatically parses JSON responses, so response.data should be the parsed object
          // But we check if it's a string just in case
          // Handle undefined/null response.data gracefully
          if (response.data === undefined || response.data === null) {
            return null
          }
          const data: any = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
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

  /** Validates that the response matches the EventSpec structure. */
  private isValidEventSpec(response: any): response is EventSpec {
    if (!response || typeof response !== 'object') {
      return false
    }
    // Check baseEvent structure
    if (
      !response.baseEvent ||
      typeof response.baseEvent !== 'object' ||
      typeof response.baseEvent.name !== 'string' ||
      typeof response.baseEvent.id !== 'string' ||
      !response.baseEvent.props ||
      typeof response.baseEvent.props !== 'object'
    ) {
      return false
    }
    // Variants are optional, but if present, validate the structure
    if (response.variants !== undefined) {
      if (!Array.isArray(response.variants)) {
        return false
      }
      for (const variant of response.variants) {
        if (
          !variant ||
          typeof variant !== 'object' ||
          typeof variant.variantId !== 'string' ||
          typeof variant.nameSuffix !== 'string' ||
          typeof variant.eventId !== 'string' ||
          !variant.props ||
          typeof variant.props !== 'object'
        ) {
          return false
        }
      }
    }
    return true
  }
}
