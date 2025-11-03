
import { UniversalStorage } from '@segment/analytics-next'
import type { AmplitudeAttributionValues } from '@segment/actions-shared/src/amplitude/types'
import { AMPLITUDE_ATTRIBUTION_KEYS, AMPLITUDE_ATTRIBUTION_STORAGE_KEY } from '@segment/actions-shared'

export function getAttributionsFromURL(queryString: string): Partial<AmplitudeAttributionValues> {
  if (!queryString){
    return {}
  } 

  const urlParams = new URLSearchParams(queryString)

  return Object.fromEntries(
    AMPLITUDE_ATTRIBUTION_KEYS
      .map(key => [key, urlParams.get(key)] as const)
      .filter(([, value]) => value !== null)
  ) as Partial<AmplitudeAttributionValues>
}

export function getAttributionsFromStorage(storage: UniversalStorage<Record<string, Partial<AmplitudeAttributionValues>>>): Partial<AmplitudeAttributionValues> {
  const values = storage.get(AMPLITUDE_ATTRIBUTION_STORAGE_KEY)
  return values ?? {}
}

export function setAttributionsInStorage(storage: UniversalStorage<Record<string, Partial<AmplitudeAttributionValues>>>, attributions: Partial<AmplitudeAttributionValues>): void {
  storage.set(AMPLITUDE_ATTRIBUTION_STORAGE_KEY, attributions)
}