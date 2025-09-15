import { StatsContext } from '@segment/actions-core'
import { SubscriptionMetadata } from '@segment/actions-core/destination-kit'
import { CachableSchema } from '../types'
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

  cache.set(getKey(schema.object_details.object_type, subscriptionMetadata), schema)
  statsContext?.statsClient?.incr('cache.save.success', 1, statsContext?.tags)
}
