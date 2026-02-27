import {
  RuntimeProperties,
  EventSpecResponseWire,
  PropertyConstraintWire,
  PropertyConstraint,
  EventSpecMetadata,
  PropertyValidationResult,
  ValidationResult,
  EventSchemaBody,
  EventSpec,
  EventProperty
} from '../types'
import { processHashing } from '../../../../lib/hashing-utils'
import { PayloadValidationError } from '@segment/actions-core'
import type { RequestClient } from '@segment/actions-core'
import type { Settings } from '../../generated-types'
import { extractSchema } from './schema-functions'
import { validateEvent } from './event-validator-functions'
import { Payload } from '../generated-types'
import { DEFAULT_BASE_URL } from '../../constants'

export const send = async (request: RequestClient, settings: Settings, payloads: Payload[]) => {
  const anonymousId = payloads[0]?.anonymousId
  const userId = payloads[0]?.userId
  const streamId = anonymousId ? anonymousId : userId ? processHashing(userId, 'sha256', 'hex') : 'unknown'
  const eventSpecMap = await fetchEventSpecsForBatch(request, settings, payloads, streamId)

  const { appVersionPropertyName, publicEncryptionKey, env, apiKey } = settings

  const json = payloads.map((payload) => {
    const { event, pageUrl, appName, properties, messageId, createdAt } = payload

    const eventProperties = extractSchema(payload.properties, publicEncryptionKey, env)
    const eventSpec = eventSpecMap?.get(event) ?? null
    let eventSpecMetadata: EventSpecMetadata | undefined

    if (eventSpec) {
      const validationResult: ValidationResult = validateEvent(properties as RuntimeProperties, eventSpec)
      mergeValidationResults(eventProperties, validationResult.propertyResults)
      eventSpecMetadata = validationResult.metadata
    }

    const itemJSON: EventSchemaBody = {
      appName: appName ?? (pageUrl ? pageUrl.split('/')[2] : 'unnamed Segment app'),
      appVersion:
        appVersionPropertyName && properties[appVersionPropertyName]
          ? (properties[appVersionPropertyName] as string)
          : payload.appVersion ?? 'unversioned',
      libVersion: '2.0.0',
      libPlatform: 'Segment',
      messageId,
      createdAt,
      sessionId: '',
      ...(publicEncryptionKey ? { publicEncryptionKey } : {}),
      type: 'event',
      streamId,
      eventName: event,
      eventProperties,
      eventId: null,
      eventHash: null,
      ...(typeof eventSpecMetadata !== 'undefined' ? { eventSpecMetadata } : {})
    }
    return itemJSON
  })

  if (!json || json.length === 0) {
    throw new PayloadValidationError('No events generated from payload')
  }

  const endpoint = 'https://api.avo.app/inspector/segment/v1/track'

  return request(endpoint, {
    method: 'post',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
      env,
      streamId
    },
    json
  })
}

async function fetchEventSpecsForBatch(
  request: RequestClient,
  settings: Settings,
  payload: Payload[],
  streamId: string
): Promise<Map<string, EventSpec | null> | null> {
  const { env, apiKey } = settings

  if (!['dev', 'staging'].includes(env)) {
    return Promise.resolve(null)
  }

  const eventSpecMap = new Map<string, EventSpec | null>()
  const uniqueEventNames = [...new Set(payload.map((p) => p.event))]
  const requests = uniqueEventNames.map(async (eventName) => {
    const queryParams = new URLSearchParams({
      apiKey,
      streamId,
      eventName
    })
    const url = `${DEFAULT_BASE_URL}/trackingPlan/eventSpec?${queryParams.toString()}`

    try {
      const response = await request<EventSpecResponseWire>(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Segment (Actions)'
        }
      })
      const { events, metadata } = response.data

      const eventSpec: EventSpec = {
        metadata,
        events: events.map((evt) => {
          const eventIds = [evt.id, ...evt.vids]

          return {
            branchId: evt.b,
            baseEventId: evt.id,
            variantIds: evt.vids,
            props: Object.fromEntries(
              Object.entries(evt.p).map(([propName, propWire]) => [
                propName,
                convertWirePropToConstraints(propWire, eventIds)
              ])
            )
          }
        })
      }
      return { eventName, spec: eventSpec }
    } catch {
      return { eventName, spec: null }
    }
  })

  const results = await Promise.all(requests)
  for (const { eventName, spec } of results) {
    eventSpecMap.set(eventName, spec)
  }

  return eventSpecMap
}

function convertWirePropToConstraints(wire: PropertyConstraintWire, eventIds: string[]): PropertyConstraint {
  const type = wire.t === 'string' ? wire.t : 'object'
  const required = wire.r
  const isListType = wire.l === true

  const result: PropertyConstraint = {
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

  // Handle nested properties
  const nestedSchema = wire && typeof wire.t === 'object' && wire.t !== null ? wire.t : undefined
  if (nestedSchema) {
    result.children = {}
    for (const [childName, childWire] of Object.entries(nestedSchema)) {
      result.children[childName] = convertWirePropToConstraints(childWire, eventIds)
    }
  }

  return result
}

/**
 * Type guard to check if a SchemaChild is an EventProperty
 */
function isEventProperty(child: unknown): child is EventProperty {
  return typeof child === 'object' && child !== null && !Array.isArray(child) && 'propertyName' in child
}

/**
 * Merges validation results into the event schema properties.
 * Recursively walks the schema and attaches failedEventIds/passedEventIds to matching properties.
 */
export function mergeValidationResults(
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
        // Filter to only include EventProperty objects (not strings)
        const childrenMap: Record<string, EventProperty> = {}
        for (const child of prop.children) {
          if (isEventProperty(child)) {
            childrenMap[child.propertyName] = child
          }
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
              // Filter children to only EventProperty objects before recursing
              const eventPropertyChildren = childProp.children.filter(isEventProperty)
              mergeValidationResults(eventPropertyChildren, childValidationResult.children)
            }
          }
        }
      }
    }
  }
}
