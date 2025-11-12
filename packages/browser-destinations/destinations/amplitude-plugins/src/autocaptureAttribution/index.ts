/* eslint-disable @typescript-eslint/no-unsafe-call */
import { UniversalStorage } from '@segment/analytics-next'
import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getAttributionsFromURL, getAttributionsFromStorage, setAttributionsInStorage } from './functions'
import { AmplitudeAttributionValues, AMPLITUDE_ATTRIBUTION_KEYS, AmplitudeAttributionKey } from '@segment/actions-shared'
import { DESTINATION_INTEGRATION_NAME } from '../constants'
import isEqual from 'lodash/isEqual'

const action: BrowserActionDefinition<Settings, {}, Payload> = {
  title: 'Autocapture Attribution Plugin',
  description: 'Captures attribution details from the URL and attaches them to every Amplitude browser based event.',
  platform: 'web',
  defaultSubscription: 'type = "track" or type = "identify" or type = "group" or type = "page" or type = "alias"',
  fields: {
    excludeReferrers: {
      label: 'Exclude Referrers',
      description: 'A list of hostnames to ignore when capturing attribution data. If the current page referrer matches any of these hostnames, no attribution data will be captured from the URL.',
      type: 'string',
      required: false,
      multiple: true
    }
  },
  lifecycleHook: 'enrichment',
  perform: (_, { context, payload, analytics }) => {
    const referrer = document.referrer
    const referringDomain = referrer ? new URL(referrer).hostname : ''
    const { excludeReferrers } = payload
    const isExcluded = excludeReferrers?.includes(referringDomain)
    const current: Partial<AmplitudeAttributionValues> = isExcluded ? {} : {...getAttributionsFromURL(window.location.search), referrer, referring_domain: referringDomain}
    const previous = getAttributionsFromStorage(analytics.storage as UniversalStorage<Record<string, Partial<AmplitudeAttributionValues>>>)
    const setOnce: Partial<AmplitudeAttributionValues> = {} 
    const set: Partial<AmplitudeAttributionValues> = {}
    const unset: AmplitudeAttributionKey[] = []
    const currentPageHasAttribution = current && Object.values(current).some(v => typeof v === 'string' && v.length > 0)

    if (currentPageHasAttribution && !isEqual(current, previous)){   
      AMPLITUDE_ATTRIBUTION_KEYS.forEach(key => {
        setOnce[key] = current[key] ?? ""
        if(current[key]){
          set[key] = current[key]
        } 
        else{
          unset.push(key)
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
}
export default action