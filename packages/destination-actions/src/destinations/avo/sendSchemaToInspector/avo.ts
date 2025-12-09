/* eslint-disable @typescript-eslint/no-explicit-any */
import type { RequestClient } from '@segment/actions-core'
import { BaseBody, EventSchemaBody, EventProperty } from './avo-types'

import { AvoSchemaParser } from './AvoSchemaParser'
import { EventSpecFetcher } from './eventSpec/EventFetcher'
import type { EventSpecResponse, ValidationResult, PropertyValidationResult } from './eventSpec/EventFetcherTypes'
import { validateEvent } from './eventSpec/EventValidator'
import type { RuntimeProperties } from './eventSpec/EventValidator'

import { Payload } from './generated-types'

function getAppNameFromUrl(url: string) {
  return url.split('/')[2]
}

function generateBaseBody(event: Payload, appVersionPropertyName: string | undefined): BaseBody {
  const appName = event.appName ?? (event.pageUrl ? getAppNameFromUrl(event.pageUrl) : 'unnamed Segment app')

  let appVersion: string
  if (appVersionPropertyName !== undefined && appVersionPropertyName in event.properties) {
    // Using bracket notation for dynamic property name access with type assertion
    appVersion = event.properties[appVersionPropertyName] as string
  } else {
    appVersion = event.appVersion ?? 'unversioned'
  }

  return {
    appName: appName,
    appVersion: appVersion,
    libVersion: '1.0.0',
    libPlatform: 'Segment',
    messageId: event.messageId,
    createdAt: event.createdAt,
    sessionId: '_'
  }
}

function handleEvent(
  baseBody: BaseBody,
  event: Payload,
  eventProperties: EventProperty[],
  metadata?: Record<string, any>
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
 * Fetches the event spec if spec fetching is enabled (schemaId/sourceId provided).
 * Returns a Promise that resolves to an object with the event spec (or null) and debug info.
 *
 * Note: Spec fetching happens regardless of encryption key presence.
 * The encryption key only controls whether property values are sent (Phase 2).
 * If spec fetch fails (invalid status code), validation is skipped for that event.
 */
async function fetchEventSpec(
  eventName: string,
  apiKey: string,
  streamId: string | undefined,
  env: string,
  request: RequestClient
): Promise<EventSpecResponse | null> {
  if (!apiKey) {
    console.warn(`[Avo Inspector] apiKey is missing, cannot fetch event spec`)
    return null
  }

  if (!streamId) {
    console.warn(`[Avo Inspector] streamId is missing, cannot fetch event spec`)
    return null
  }

  try {
    const fetchParams = {
      apiKey: apiKey,
      streamId: streamId,
      eventName: eventName
    }

    // fetch from API (async)
    const shouldLog = process.env.NODE_ENV !== 'test'
    const result = await new EventSpecFetcher(request, shouldLog, env).fetch(fetchParams).catch((error: any) => {
      console.error(`[Avo Inspector] Failed to fetch event spec for ${eventName}:`, error)
      return null
    })

    return result
  } catch (error) {
    // Graceful degradation - log but don't fail
    console.error(`[Avo Inspector] Error in fetchEventSpecIfNeeded for ${eventName}:`, error)

    return null
  }
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

export async function extractSchemaFromEvent(
  event: Payload,
  appVersionPropertyName: string | undefined,
  apiKey: string,
  env: string,
  inspectorEncryptionKey: string | undefined,
  request: RequestClient
) {
  const baseBody: BaseBody = generateBaseBody(event, appVersionPropertyName)

  const eventSpec = await fetchEventSpec(event.event, apiKey, event.anonymousId, env, request)

  // Extract schema from event properties
  const eventProperties = AvoSchemaParser.extractSchema(event.properties, inspectorEncryptionKey, env)
  let validationMetadata: Record<string, any> | undefined

  // If event spec was successfully fetched, run validation
  if (eventSpec) {
    try {
      const validationResult: ValidationResult = validateEvent(event.properties as RuntimeProperties, eventSpec)
      // Merge validation results into the schema
      mergeValidationResults(eventProperties, validationResult.propertyResults)
      // Store metadata for inclusion in the final body
      validationMetadata = validationResult.metadata
    } catch (error) {
      console.error(`[Avo Inspector] Error validating event ${event.event}:`, error)
      // Continue without validation results if validation fails
    }
  }

  const eventBody: EventSchemaBody = handleEvent(baseBody, event, eventProperties, validationMetadata)

  return eventBody
}
