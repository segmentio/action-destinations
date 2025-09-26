
import { UniversalStorage } from '@segment/analytics-next'
import type { AttributionKey, AttributionValues } from './types'
import { KEYS, ATTRIBUTION_STORAGE_KEY } from './constants'

export function getAttributionsFromURL(queryString: string | undefined): Partial<AttributionValues> {
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

export function getAttributionsFromStorage(storage: UniversalStorage<Record<string, AttributionValues>>): Partial<AttributionValues> {
  const values = storage.get(ATTRIBUTION_STORAGE_KEY)
  return values ?? {}
}

export function getAttributionsDiff(
  cachedAttributions: Partial<AttributionValues>,
  urlAttributions: Partial<AttributionValues>
): { new_attributions: Partial<AttributionValues>, old_attributions: AttributionKey[], differences: boolean } {
    const newAttributions: Partial<AttributionValues> = {}

    KEYS.forEach((key) => {
        const newVal = urlAttributions[key] ?? null
        if (newVal !== null && newVal !== cachedAttributions[key]) {
            newAttributions[key] = newVal
        }
    })

    const oldAttributions = KEYS.filter(
        (key) => cachedAttributions[key] !== null && !(key in newAttributions)
    )

    return { 
        new_attributions: newAttributions, 
        old_attributions: oldAttributions, 
        differences: Object.entries(newAttributions).length > 0 || Object.entries(oldAttributions).length > 0 
    }
}