/* eslint-disable @typescript-eslint/no-unsafe-call */
import { UniversalStorage } from '@segment/analytics-next'
import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getAttributionsFromURL, getAttributionsFromStorage, setAttributionsInStorage } from './functions'
import { AmplitudeAttributionValues, AMPLITUDE_ATTRIBUTION_KEYS, AmplitudeAttributionKey } from '@segment/actions-shared'
import { DESTINATION_INTEGRATION_NAME } from '../constants'

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
    const referrerDomain = referrer ? new URL(referrer).hostname : ''
    const { excludeReferrers } = payload
    const isExcluded = excludeReferrers?.includes(referrerDomain)
    const current = isExcluded ? {} : getAttributionsFromURL(window.location.search)
    const previous = getAttributionsFromStorage(analytics.storage as UniversalStorage<Record<string, Partial<AmplitudeAttributionValues>>>)
    const setOnce: Partial<AmplitudeAttributionValues> = {} 
    const set: Partial<AmplitudeAttributionValues> = {}
    const unset: AmplitudeAttributionKey[] = []

    const currentPageHasAttribution = current && Object.values(current).some(v => typeof v === 'string' && v.length > 0)

    if (!currentPageHasAttribution) {
      return
    }

    AMPLITUDE_ATTRIBUTION_KEYS.forEach(key => {
      // Always set_once the current values from the URL if there is at least one attribution value present
      setOnce[key] = current[key] ?? ""
      if(current[key]){
        // If there are any attribution values on the page, set them 
        set[key] = current[key]
      } 
      else if(previous[key]){
        // if there are any previous attribution values which are not in current URL, unset them
        unset.push(key)
      }
    })
    
    if (context.event.integrations?.All !== false || context.event.integrations[DESTINATION_INTEGRATION_NAME]) {
      context.updateEvent(`integrations.${DESTINATION_INTEGRATION_NAME}`, {})
      context.updateEvent(`integrations.${DESTINATION_INTEGRATION_NAME}.autocapture_attribution`, {
        set_once: setOnce,
        set: set,
        unset: unset
      })
    }
    
    if(Object.entries(current).length >0) {
      setAttributionsInStorage(analytics.storage as UniversalStorage<Record<string, Partial<AmplitudeAttributionValues>>>, current)
    }

    return
  }
}
export default action