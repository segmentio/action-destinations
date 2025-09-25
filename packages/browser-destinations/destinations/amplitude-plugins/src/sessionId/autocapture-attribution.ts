
import { UniversalStorage } from '@segment/analytics-next'
import type { AttributionKey, AttributionValues } from './types'
import { KEYS, ATTRIBUTION_STORAGE_KEY } from './constants'

export function getAttributionFromURL(queryString: string | undefined): Partial<AttributionValues> {
  if (!queryString){
    return {}
  } 

  const urlParams = new URLSearchParams(queryString)

  return Object.fromEntries(
    KEYS
      .map(key => [key, urlParams.get(key)] as const)
      .filter(([, value]) => value !== null)
  ) as Partial<AttributionValues>
}

export function getAttributionFromStorage(storage: UniversalStorage<Record<string, AttributionValues>>): Partial<AttributionValues> {
  const values = storage.get(ATTRIBUTION_STORAGE_KEY)
  return values ?? {}
}

export function getAttributionDiff(
  oldValues: Partial<AttributionValues>,
  newValues: Partial<AttributionValues>
): { itemsToSet: Partial<AttributionValues>, itemsToUnset: AttributionKey[], changes: boolean } {
    const itemsToSet: Partial<AttributionValues> = {}

    KEYS.forEach((key) => {
        const newVal = newValues[key] ?? null
        if (newVal !== null && newVal !== oldValues[key]) {
            itemsToSet[key] = newVal
        }
    })

    const itemsToUnset = KEYS.filter(
        (key) => oldValues[key] !== null && !(key in itemsToSet)
    )

    return { 
        itemsToSet, 
        itemsToUnset, 
        changes: Object.entries(itemsToSet).length > 0 || Object.entries(itemsToUnset).length > 0 
    }
}
