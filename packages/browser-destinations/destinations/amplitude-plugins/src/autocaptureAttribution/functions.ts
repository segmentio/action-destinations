
import { UniversalStorage } from '@segment/analytics-next'
import type { AttributionValues } from './types'
import { KEYS, ATTRIBUTION_STORAGE_KEY } from './constants'

export function getAttributionsFromURL(queryString: string): Partial<AttributionValues> {
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

export function getAttributionsFromStorage(storage: UniversalStorage<Record<string, Partial<AttributionValues>>>): Partial<AttributionValues> {
  const values = storage.get(ATTRIBUTION_STORAGE_KEY)
  return values ?? {}
}

export function setAttributionsInStorage(storage: UniversalStorage<Record<string, Partial<AttributionValues>>>, attributions: Partial<AttributionValues>): void {
  storage.set(ATTRIBUTION_STORAGE_KEY, attributions)
}