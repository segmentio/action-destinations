import { StatsContext } from '@segment/actions-core'
import { SubscriptionMetadata } from '@segment/actions-core/destination-kit'
import { CachableSchema, CachableList } from '../types'
import { LRUCache } from 'lru-cache'

export const schemaCache = new LRUCache<string, CachableSchema>({
  max: 2000,
  ttl: 1000 * 60 * 60
})

function getSchemaCacheKey(name: string, subscriptionMetadata: SubscriptionMetadata): string {
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

  const schema: CachableSchema | undefined = schemaCache.get(getSchemaCacheKey(name, subscriptionMetadata)) ?? undefined
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

  schemaCache.set(getSchemaCacheKey(schema.object_details.object_type, subscriptionMetadata), schema)
  statsContext?.statsClient?.incr('cache.save.success', 1, statsContext?.tags)
}

export const listCache = new LRUCache<string, CachableList>({
  max: 2000,
  ttl: 1000 * 60 * 30
})

function getListCacheKey(listName: string, objectType: string, subscriptionMetadata: SubscriptionMetadata): string {
  return `${subscriptionMetadata.actionConfigId}-listName-${listName}-objectType-${objectType}`
}

export function getListFromCache(
  name: string,
  objectType: string,
  subscriptionMetadata?: SubscriptionMetadata,
  statsContext?: StatsContext
): CachableList | undefined {
  if (!subscriptionMetadata || !subscriptionMetadata?.actionConfigId) {
    statsContext?.statsClient?.incr('cache.getList.error', 1, statsContext?.tags)
    return undefined
  }

  const cachableList: CachableList | undefined = listCache.get(getListCacheKey(name, objectType, subscriptionMetadata)) ?? undefined
  return cachableList
}

export async function saveListToCache(
  cachableList: CachableList,
  subscriptionMetadata?: SubscriptionMetadata,
  statsContext?: StatsContext
) {
  if (!subscriptionMetadata || !subscriptionMetadata?.actionConfigId) {
    console.log("ERROR saving to cache")
    statsContext?.statsClient?.incr('cache.saveList.error', 1, statsContext?.tags)
    return
  }

  console.log("Saving to cache")
  listCache.set(getListCacheKey(cachableList.name, cachableList.objectType, subscriptionMetadata), cachableList)
  statsContext?.statsClient?.incr('cache.saveList.success', 1, statsContext?.tags)
}

