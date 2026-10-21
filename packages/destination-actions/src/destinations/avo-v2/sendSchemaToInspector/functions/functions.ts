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
import { warehouseColumns } from './warehouse-columns'
import { createEncryptionSession, EncryptionSession } from './encryption-functions'
import { validateEvent } from './event-validator-functions'
import { Payload } from '../generated-types'
import { DEFAULT_BASE_URL } from '../../constants'

// With Gateway Support on, events go to the v2 endpoint, which understands the gateway
// coordinates. libPlatform doubles as the X-Avo-Client header there, so the two always agree.
const GATEWAY_CLIENT = {
  endpoint: `${DEFAULT_BASE_URL}/inspector/v2/track`,
  libPlatform: 'segment',
  libVersion: '2.1.0'
}
// Instances created before Gateway Support existed have no value for it, and keep sending
// exactly what they sent before.
const LEGACY_CLIENT = {
  endpoint: `${DEFAULT_BASE_URL}/inspector/segment/v1/track`,
  libPlatform: 'Segment',
  libVersion: '2.0.0'
}

export const send = async (request: RequestClient, settings: Settings, payloads: Payload[]) => {
  const anonymousId = payloads[0]?.anonymousId
  const userId = payloads[0]?.userId
  const streamId = anonymousId ? anonymousId : userId ? processHashing(userId, 'sha256', 'hex') : 'unknown'

  const { appVersionPropertyName, publicEncryptionKey, env, apiKey } = settings
  const gatewaySupport = settings.gatewaySupport === true
  const client = gatewaySupport ? GATEWAY_CLIENT : LEGACY_CLIENT

  // The gateway coordinates of each event, normalized once: they go on the track body and
  // select the spec the event is validated against.
  const coordinates = payloads.map((payload) => gatewayCoordinates(payload, gatewaySupport))
  const eventSpecMap = await fetchEventSpecsForBatch(request, settings, payloads, coordinates, streamId)

  // Create one encryption session for the entire batch — EC key generation happens
  // once here rather than once per event or once per property value.
  // Wrapped in try/catch so an invalid public key skips encryption for the batch
  // rather than aborting it entirely (matches the per-value graceful degradation of the original design).
  const isDevOrStaging = env === 'dev' || env === 'staging'
  let encryptionSession: EncryptionSession | undefined
  if (publicEncryptionKey && isDevOrStaging) {
    try {
      encryptionSession = createEncryptionSession(publicEncryptionKey)
    } catch {
      // Invalid key — proceed without encryption rather than dropping the whole batch
    }
  }

  const inspectedFields = gatewaySupport ? settings.inspectedFields : undefined

  const json = payloads.map((payload, index) => {
    const { event, pageUrl, appName, properties, messageId, createdAt } = payload

    // Warehouse columns add names and types only: their values are never encrypted or sent.
    const eventProperties = [
      ...extractSchema(payload.properties, encryptionSession),
      ...extractSchema(warehouseColumns(warehouseFields(payload), properties, inspectedFields))
    ]
    const { outputReference, originHint } = coordinates[index]
    const eventSpec = eventSpecMap?.get(eventSpecKey(event, coordinates[index])) ?? null
    let eventSpecMetadata: EventSpecMetadata | undefined

    if (eventSpec) {
      const validationResult: ValidationResult = validateEvent(properties as RuntimeProperties, eventSpec)
      mergeValidationResults(eventProperties, validationResult.propertyResults)
      eventSpecMetadata = validationResult.metadata
    }

    // The event's own version: the App Version Property setting, then the App Version field. In
    // gateway mode a blank value counts as none, like every other coordinate; the legacy path keeps
    // its truthiness check.
    const propertyVersion = appVersionPropertyName ? properties[appVersionPropertyName] : undefined
    const legacyVersion = (): unknown => (propertyVersion ? propertyVersion : payload.appVersion)

    const itemJSON: EventSchemaBody = {
      appName: appName ?? (pageUrl ? pageUrl.split('/')[2] : 'unnamed Segment app'),
      appVersion: gatewaySupport
        ? resolveAppVersion(originHint, versionCoordinate(propertyVersion) ?? versionCoordinate(payload.appVersion))
        : (legacyVersion() as string | undefined) ?? 'unversioned',
      libVersion: client.libVersion,
      libPlatform: client.libPlatform,
      messageId,
      createdAt,
      sessionId: '',
      ...(publicEncryptionKey ? { publicEncryptionKey } : {}),
      type: 'event',
      streamId,
      eventName: event,
      eventProperties,
      ...(outputReference ? { outputReference } : {}),
      ...(originHint ? { originHint } : {}),
      eventId: null,
      eventHash: null,
      ...(typeof eventSpecMetadata !== 'undefined' ? { eventSpecMetadata } : {})
    }
    return itemJSON
  })

  if (!json || json.length === 0) {
    throw new PayloadValidationError('No events generated from payload')
  }

  return request(client.endpoint, {
    method: 'post',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
      env,
      streamId,
      ...(gatewaySupport ? { 'X-Avo-Client': client.libPlatform } : {})
    },
    json
  })
}

interface GatewayCoordinates {
  outputReference?: string
  originHint?: string
}

// Without Gateway Support the mapped coordinates are ignored, so they are neither sent on the
// body nor used to fetch the spec.
function gatewayCoordinates(payload: Payload, gatewaySupport: boolean): GatewayCoordinates {
  if (!gatewaySupport) {
    return {}
  }
  return {
    outputReference: normalizeCoordinate(payload.outputReference),
    originHint: normalizeCoordinate(payload.originHint)
  }
}

// One spec per event name and checkpoint: a gateway-input spec (hint only), an output spec
// (hint and output) and a source spec (neither) for the same event name never share an entry.
// JSON keeps the parts apart whatever characters they contain.
export function eventSpecKey(eventName: string, { originHint, outputReference }: GatewayCoordinates): string {
  return JSON.stringify([eventName, originHint ?? null, outputReference ?? null])
}

// Gateway coordinates are trimmed; a blank value counts as not provided, and its key is
// omitted from the body rather than sent as null or "".
function normalizeCoordinate(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

// The event's context and envelope as the mapping provides them, keyed like a Segment event.
function warehouseFields(payload: Payload): Record<string, unknown> {
  return {
    context: payload.context,
    anonymousId: payload.anonymousId,
    userId: payload.userId,
    messageId: payload.messageId,
    event: payload.event,
    timestamp: payload.createdAt,
    originalTimestamp: payload.originalTimestamp,
    sentAt: payload.sentAt,
    receivedAt: payload.receivedAt
  }
}

// Gateway mode. Segment forwards the event it received, so the event's own version (the App Version
// Property setting, then the App Version field) is the source's version. With an origin hint and no
// version the version is null; without a hint and none it is 'unversioned'.
function resolveAppVersion(originHint: string | undefined, version: string | undefined): string | null {
  if (originHint) {
    return version ?? null
  }
  return version ?? 'unversioned'
}

// The App Version Property setting can name a property of any type: send a number or boolean as
// its string, and treat anything else that isn't a non-blank string as no version.
function versionCoordinate(value: unknown): string | undefined {
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return typeof value === 'string' ? normalizeCoordinate(value) : undefined
}

async function fetchEventSpecsForBatch(
  request: RequestClient,
  settings: Settings,
  payload: Payload[],
  coordinates: GatewayCoordinates[],
  streamId: string
): Promise<Map<string, EventSpec | null> | null> {
  const { env, apiKey } = settings

  if (!['dev', 'staging'].includes(env)) {
    return Promise.resolve(null)
  }

  const eventSpecMap = new Map<string, EventSpec | null>()
  // One fetch per distinct (event name, origin hint, output reference) in the batch.
  const uniqueLookups = new Map<string, { eventName: string } & GatewayCoordinates>()
  payload.forEach((p, index) => {
    const key = eventSpecKey(p.event, coordinates[index])
    if (!uniqueLookups.has(key)) {
      uniqueLookups.set(key, { eventName: p.event, ...coordinates[index] })
    }
  })
  const requests = [...uniqueLookups.entries()].map(async ([key, { eventName, originHint, outputReference }]) => {
    const queryParams = new URLSearchParams({
      apiKey,
      streamId,
      eventName
    })
    // Without coordinates the URL is exactly the one sent before gateways existed. A source
    // key ignores these params; a gateway key needs originHint to find a spec at all.
    if (originHint) {
      queryParams.append('originHint', originHint)
    }
    if (outputReference) {
      queryParams.append('outputReference', outputReference)
    }
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
      return { key, spec: eventSpec }
    } catch {
      // No spec (including the 404 a gateway key answers without an origin hint): the event
      // is still sent, just without value checks.
      return { key, spec: null }
    }
  })

  const results = await Promise.all(requests)
  for (const { key, spec } of results) {
    eventSpecMap.set(key, spec)
  }

  return eventSpecMap
}

/** Maximum nesting depth for wire constraint conversion — mirrors the validator's limit. */
const MAX_WIRE_DEPTH = 2

function convertWirePropToConstraints(wire: PropertyConstraintWire, eventIds: string[], depth = 0): PropertyConstraint {
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

  // Handle nested properties — guarded by depth limit to prevent stack overflow
  // from malformed or malicious wire payloads.
  const nestedSchema =
    depth < MAX_WIRE_DEPTH && wire && typeof wire.t === 'object' && wire.t !== null ? wire.t : undefined
  if (nestedSchema) {
    result.children = {}
    for (const [childName, childWire] of Object.entries(nestedSchema)) {
      result.children[childName] = convertWirePropToConstraints(childWire, eventIds, depth + 1)
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
