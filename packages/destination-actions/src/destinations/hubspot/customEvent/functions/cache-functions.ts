import { PayloadValidationError, StatsContext } from '@segment/actions-core'
import { SubscriptionMetadata } from '@segment/actions-core/destination-kit'
import { SegmentProperty, Schema, CachableSchema, SchemaDiff } from '../types'
import { LRUCache } from 'lru-cache'

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
    return { match: 'no_match', missingProperties: {} }
  }

  if (schema1.name !== schema2.name && schema1.name !== schema2.fullyQualifiedName) {
    throw new PayloadValidationError("Hubspot.CustomEvent.compareSchemas: Schema names don't match")
  }

  const missingProperties: { [key: string]: SegmentProperty } = {}

  for (const [key, prop1] of Object.entries(schema1.properties)) {
    const prop2 = schema2.properties[key]
    if (prop2 === undefined) {
      missingProperties[key] = prop1
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
    missingProperties
  }
}
