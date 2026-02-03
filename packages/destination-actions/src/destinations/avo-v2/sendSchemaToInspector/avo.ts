/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseBody, EventSchemaBody, EventProperty } from './avo-types'

import { processHashing } from '../../../lib/hashing-utils'
import { PayloadValidationError } from '@segment/actions-core'
import type { RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'

import { AvoSchemaParser } from './AvoSchemaParser'
import { fetchEventSpec } from './eventSpec/EventFetcher'
import type {
  EventSpecResponse,
  ValidationResult,
  PropertyValidationResult,
  EventSpecMetadata,
  FetchEventSpecParams
} from './eventSpec/EventFetcherTypes'
import { validateEvent } from './eventSpec/EventValidator'
import type { RuntimeProperties } from './eventSpec/EventValidator'

import { Payload } from './generated-types'

// Re-export fetchEventSpec for use at the batch level
export { fetchEventSpec }
export type { EventSpecResponse, FetchEventSpecParams }

function getAppNameFromUrl(url: string) {
  return url.split('/')[2]
}

function generateBaseBody(
  event: Payload,
  appVersionPropertyName: string | undefined,
  publicEncryptionKey: string | undefined
): BaseBody {
  const appName = event.appName ?? (event.pageUrl ? getAppNameFromUrl(event.pageUrl) : 'unnamed Segment app')

  let appVersion: string
  if (appVersionPropertyName !== undefined && appVersionPropertyName in event.properties) {
    // Using bracket notation for dynamic property name access with type assertion
    appVersion = event.properties[appVersionPropertyName] as string
  } else {
    appVersion = event.appVersion ?? 'unversioned'
  }

  const baseBody: BaseBody = {
    appName: appName,
    appVersion: appVersion,
    libVersion: '1.0.0',
    libPlatform: 'Segment',
    messageId: event.messageId,
    createdAt: event.createdAt,
    sessionId: '_'
  }

  if (publicEncryptionKey) {
    baseBody.publicEncryptionKey = publicEncryptionKey
  }

  return baseBody
}

function handleEvent(
  baseBody: BaseBody,
  event: Payload,
  eventProperties: EventProperty[],
  metadata?: EventSpecMetadata
): EventSchemaBody {
  // Initially declare eventBody with the type EventSchemaBody
  // and explicitly set all properties to satisfy the type requirements.
  const eventBody: EventSchemaBody = {
    ...baseBody, // Spread operator to copy properties from baseBody
    type: 'event', // Explicitly set type as 'event'
    eventName: event.event, // Set from the event parameter
    eventProperties: eventProperties, // Use the provided event properties (may include validation results)
    eventId: null, // Set default or actual value
    eventHash: null, // Set default or actual value
    metadata: metadata // Include validation metadata if present
  }

  return eventBody
}

/**
 * Merges validation results into the event schema properties.
 * Recursively walks the schema and attaches failedEventIds/passedEventIds to matching properties.
 */
function mergeValidationResults(
  eventProperties: EventProperty[],
  propertyResults: Record<string, PropertyValidationResult>
): void {
  for (const prop of eventProperties) {
    const validationResult = propertyResults[prop.propertyName]
    if (validationResult) {
      // Attach validation results to the property
      if (validationResult.failedEventIds && validationResult.failedEventIds.length > 0) {
        prop.failedEventIds = validationResult.failedEventIds
      }
      if (validationResult.passedEventIds && validationResult.passedEventIds.length > 0) {
        prop.passedEventIds = validationResult.passedEventIds
      }
      // Recursively merge children if present
      // Note: prop.children is EventProperty[] (array), validationResult.children is Record<string, PropertyValidationResult> (object)
      if (prop.children && Array.isArray(prop.children) && validationResult.children) {
        // Convert children array to a lookup map for efficient matching
        const childrenMap: Record<string, EventProperty> = {}
        for (const child of prop.children) {
          childrenMap[child.propertyName] = child
        }
        // Merge validation results for each child
        for (const [childName, childValidationResult] of Object.entries(validationResult.children)) {
          const childProp = childrenMap[childName]
          if (childProp) {
            // Attach validation results to the child property
            if (childValidationResult.failedEventIds && childValidationResult.failedEventIds.length > 0) {
              childProp.failedEventIds = childValidationResult.failedEventIds
            }
            if (childValidationResult.passedEventIds && childValidationResult.passedEventIds.length > 0) {
              childProp.passedEventIds = childValidationResult.passedEventIds
            }
            // Recursively handle nested children
            if (childProp.children && Array.isArray(childProp.children) && childValidationResult.children) {
              mergeValidationResults(childProp.children, childValidationResult.children)
            }
          }
        }
      }
    }
  }
}

/**
 * Extracts schema from an event and optionally validates it against a pre-fetched event spec.
 *
 * @param event - The event payload
 * @param appVersionPropertyName - Optional property name to use for app version
 * @param inspectorEncryptionKey - Optional encryption key for property values
 * @param env - Environment (dev/staging/prod)
 * @param eventSpec - Optional pre-fetched event spec for validation (fetched at batch level)
 */
export function extractSchemaFromEvent(
  event: Payload,
  appVersionPropertyName: string | undefined,
  inspectorEncryptionKey: string | undefined,
  env: string,
  eventSpec: EventSpecResponse | null
): EventSchemaBody {
  const baseBody: BaseBody = generateBaseBody(event, appVersionPropertyName, inspectorEncryptionKey)

  // Extract schema from event properties
  const eventProperties = AvoSchemaParser.extractSchema(event.properties, inspectorEncryptionKey, env)
  let validationMetadata: EventSpecMetadata | undefined

  // If event spec was provided, run validation
  if (eventSpec) {
    try {
      const validationResult: ValidationResult = validateEvent(event.properties as RuntimeProperties, eventSpec)
      // Merge validation results into the schema
      mergeValidationResults(eventProperties, validationResult.propertyResults)
      // Store metadata for inclusion in the final body
      validationMetadata = validationResult.metadata
    } catch {
      // Continue without validation results if validation fails
    }
  }

  const eventBody: EventSchemaBody = handleEvent(baseBody, event, eventProperties, validationMetadata)

  return eventBody
}

/**
 * Hashes an ID using SHA-256 to ensure non-PII compliance.
 * @param id - The ID to hash
 * @returns The hex-encoded SHA-256 hash of the ID
 */
function hashId(id: string): string {
  return processHashing(id, 'sha256', 'hex')
}

/**
 * Fetches event specs for all unique event names in the batch.
 *
 * Implements within-batch caching: each unique event name is fetched exactly once,
 * even if multiple events in the batch share the same event name. This prevents
 * duplicate API calls for the same event spec within a single batch.
 *
 * The cache stores both successful responses (EventSpecResponse) and failed responses (null),
 * so failed fetches are also deduplicated and won't be retried for the same event name.
 *
 * @param request - RequestClient for making HTTP requests
 * @param settings - Destination settings including apiKey and env
 * @param payload - Array of events in the batch (all share the same anonymousId/streamId)
 * @param streamId - The anonymousId used as stream identifier (same for all events in batch)
 * @returns Map of event name -> event spec (or null if fetch failed)
 */
async function fetchEventSpecsForBatch(
  request: RequestClient,
  settings: Settings,
  payload: Payload[],
  streamId: string
): Promise<Map<string, EventSpecResponse | null>> {
  const eventSpecMap = new Map<string, EventSpecResponse | null>()

  // Extract unique event names to avoid duplicate fetches within the batch
  // Example: if batch has [EventA, EventB, EventA, EventC], we only fetch specs for [EventA, EventB, EventC]
  const uniqueEventNames = [...new Set(payload.map((p) => p.event))]

  // Fetch event specs for each unique event name in parallel
  // Each event name is fetched exactly once, regardless of how many times it appears in the batch
  const fetchPromises = uniqueEventNames.map(async (eventName) => {
    try {
      const spec = await fetchEventSpec(request, settings.env, {
        apiKey: settings.apiKey,
        streamId: streamId,
        eventName: eventName
      })
      return { eventName, spec }
    } catch {
      // Graceful degradation - continue without spec for this event
      // Cache null to prevent retrying failed fetches for the same event name
      return { eventName, spec: null }
    }
  })

  const results = await Promise.all(fetchPromises)

  // Build the cache map: event name -> event spec (or null for failed fetches)
  // This map is used to look up specs for all events in the batch
  for (const { eventName, spec } of results) {
    eventSpecMap.set(eventName, spec)
  }

  return eventSpecMap
}

export const processEvents = async (request: RequestClient, settings: Settings, payload: Payload[]) => {
  if (!payload || payload.length === 0) {
    throw new PayloadValidationError('No events to process')
  }

  // Resolve streamId: prefer anonymousId, fallback to hashed userId, or 'unknown' if both are missing
  // Events are batched by anonymousId/userId, so all events in a batch share the same identity
  const firstPayload = payload[0]
  let streamId: string
  if (firstPayload.anonymousId) {
    streamId = firstPayload.anonymousId
  } else if (firstPayload.userId) {
    // Hash userId to ensure non-PII compliance
    streamId = hashId(firstPayload.userId)
  } else {
    streamId = 'unknown'
  }

  // Fetch event specs once per unique event name in the batch (no caching, rely on batching)
  const eventSpecMap = await fetchEventSpecsForBatch(request, settings, payload, streamId)

  // Process each event with its pre-fetched event spec
  const events = payload.map((value) => {
    const eventSpec = eventSpecMap.get(value.event) ?? null
    return extractSchemaFromEvent(
      value,
      settings.appVersionPropertyName,
      settings.inspectorEncryptionKey,
      settings.env,
      eventSpec
    )
  })

  if (!events || events.length === 0) {
    throw new PayloadValidationError('No events generated from payload')
  }

  const endpoint = 'https://api.avo.app/inspector/segment/v1/track'

  return request(endpoint, {
    method: 'post',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': settings.apiKey,
      env: settings.env,
      streamId: streamId
    },
    body: JSON.stringify(events)
  })
}
