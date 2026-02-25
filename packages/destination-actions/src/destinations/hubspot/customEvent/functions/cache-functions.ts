import { PayloadValidationError, StatsContext } from '@segment/actions-core'
import { SubscriptionMetadata } from '@segment/actions-core/destination-kit'
import { SegmentProperty, Schema, CachableSchema, SchemaDiff } from '../types'
import { LRUCache } from 'lru-cache'
import { Payload } from '../generated-types'

export const cache = new LRUCache<string, CachableSchema>({
  max: 2000,
  ttl: 1000 * 60 * 60
})

function getKey(name: string, subscriptionMetadata: SubscriptionMetadata): string {
  return `${subscriptionMetadata.actionConfigId}-${name}`
}

export function getSchemaFromCache(
  name: string,
  subscriptionMetadata?: SubscriptionMetadata,
  statsContext?: StatsContext
): CachableSchema | undefined {
  if (!subscriptionMetadata || !subscriptionMetadata?.actionConfigId) {
    statsContext?.statsClient?.incr('cache.get.error', 1, statsContext?.tags)
    return undefined
  }

  const schema: CachableSchema | undefined = cache.get(getKey(name, subscriptionMetadata)) ?? undefined
  return schema
}

export async function saveSchemaToCache(
  schema: CachableSchema,
  subscriptionMetadata?: SubscriptionMetadata,
  statsContext?: StatsContext
) {
  if (!subscriptionMetadata || !subscriptionMetadata?.actionConfigId) {
    statsContext?.statsClient?.incr('cache.save.error', 1, statsContext?.tags)
    return
  }

  cache.set(getKey(schema.name, subscriptionMetadata), schema)
  statsContext?.statsClient?.incr('cache.save.success', 1, statsContext?.tags)
}

export function compareSchemas(schema1: Schema, schema2: CachableSchema | undefined): SchemaDiff {
  if (schema2 === undefined) {
    return { match: 'no_match', missingProperties: {}, numericStrings: [] }
  }

  if (schema1.name !== schema2.name && schema1.name !== schema2.fullyQualifiedName) {
    throw new PayloadValidationError("Hubspot.CustomEvent.compareSchemas: Schema names don't match")
  }

  const missingProperties: { [key: string]: SegmentProperty } = {}
  const numericStrings: string[] = []

  for (const [key, prop1] of Object.entries(schema1.properties)) {
    const prop2 = schema2.properties[key]
    if (prop2 === undefined) {
      missingProperties[key] = prop1
      continue
    }
    // Handle case where we inferred number but HubSpot/cache has string
    if (prop1.type === 'number' && prop2.type === 'string') {
      numericStrings.push(key)
      continue
    }
    if (prop1.stringFormat === prop2.stringFormat && prop1.type === prop2.type) {
      continue
    } else {
      throw new PayloadValidationError("Hubspot.CustomEvent.compareSchemas: Schema property types don't match")
    }
  }

  return {
    match: Object.keys(missingProperties).length > 0 ? 'properties_missing' : 'full_match',
    missingProperties,
    numericStrings
  }
}

/**
 * Converts numeric property values to strings when the schema indicates they should be strings.
 * This handles the case where numeric strings like "123" get coerced to numbers during schema inference,
 * but HubSpot actually has the property defined as a string type.
 */
export function convertNumericStrings(validPayload: Payload, numericStrings: string[]): void {
  if (!validPayload.properties || numericStrings.length === 0) {
    return
  }
  for (const propName of numericStrings) {
    if (validPayload.properties[propName] !== undefined) {
      validPayload.properties[propName] = String(validPayload.properties[propName])
    }
  }
}
