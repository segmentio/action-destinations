/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseBody, EventSchemaBody, EventProperty } from './avo-types'

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
