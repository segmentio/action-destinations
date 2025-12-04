import type { Payload } from './generated-types'
import isEqual from 'lodash/isEqual'
import { DESTINATION_INTEGRATION_NAME } from '../constants'
import { 
  UniversalStorage, 
  Analytics, 
  Context 
} from '@segment/analytics-next'
import { 
  AMPLITUDE_ATTRIBUTION_STORAGE_KEY, 
  AmplitudeAttributionValues, 
  AMPLITUDE_ATTRIBUTION_KEYS, 
  AmplitudeSetOnceAttributionValues, 
  AmplitudeAttributionUnsetValues 
} from '@segment/actions-shared'
    
export function enrichWithAutocaptureAttribution(context: Context, payload: Payload, analytics: Analytics, isNewSession: boolean): void {  
  console.log(isNewSession, isNewSession, isNewSession, isNewSession) 
  
  const referrer = document.referrer
    const referringDomain = referrer ? new URL(referrer).hostname : ''
    const { excludeReferrers } = payload
    const isExcluded = excludeReferrers?.includes(referringDomain)
    const current: Partial<AmplitudeAttributionValues> = isExcluded ? {} : {...getAttributionsFromURL(window.location.search), referrer, referring_domain: referringDomain}
    const previous = getAttributionsFromStorage(analytics.storage as UniversalStorage<Record<string, Partial<AmplitudeAttributionValues>>>)
    const setOnce: Partial<AmplitudeSetOnceAttributionValues> = {} 
    const set: Partial<AmplitudeAttributionValues> = {}
    const unset: Partial<AmplitudeAttributionUnsetValues> = {}
    const currentPageHasAttribution = current && Object.values(current).some(v => typeof v === 'string' && v.length > 0)

    if ((currentPageHasAttribution && !isEqual(current, previous)) || isNewSession) {   
      AMPLITUDE_ATTRIBUTION_KEYS.forEach(key => {
        setOnce[`initial_${key}`] = current[key]?.trim() || "EMPTY"
        if(current[key]){
          set[key] = current[key]
        } 
        else{
          unset[key] = '-'
        }
      })
      if(Object.entries(current).length >0) {
        setAttributionsInStorage(analytics.storage as UniversalStorage<Record<string, Partial<AmplitudeAttributionValues>>>, current)
      }
    }

    if (context.event.integrations?.All !== false || context.event.integrations[DESTINATION_INTEGRATION_NAME]) {
      context.updateEvent(`integrations.${DESTINATION_INTEGRATION_NAME}`, {})
      context.updateEvent(`integrations.${DESTINATION_INTEGRATION_NAME}.autocapture_attribution`, {
        enabled: true,
        set_once: setOnce,
        set: set,
        unset: unset
      })
    }
    
    return
}

function getAttributionsFromURL(queryString: string): Partial<AmplitudeAttributionValues> {
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

function getAttributionsFromStorage(storage: UniversalStorage<Record<string, Partial<AmplitudeAttributionValues>>>): Partial<AmplitudeAttributionValues> {
  const values = storage.get(AMPLITUDE_ATTRIBUTION_STORAGE_KEY)
  return values ?? {}
}

function setAttributionsInStorage(storage: UniversalStorage<Record<string, Partial<AmplitudeAttributionValues>>>, attributions: Partial<AmplitudeAttributionValues>): void {
  storage.set(AMPLITUDE_ATTRIBUTION_STORAGE_KEY, attributions)
}