/* eslint-disable @typescript-eslint/no-unsafe-call */
import { UniversalStorage } from '@segment/analytics-next'
import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getAttributionsFromURL, getAttributionsFromStorage, setAttributionsInStorage } from './functions'
import { AmplitudeAttributionValues, AmplitudeAttributionComparison } from '@segment/actions-shared'
import { DESTINATION_INTEGRATION_NAME } from '../constants'

const action: BrowserActionDefinition<Settings, {}, Payload> = {
  title: 'Autocapture Attribution Plugin',
  description: 'Captures attribution details from the URL and attaches them to every Amplitude browser based event.',
  platform: 'web',
  defaultSubscription: 'type = "track" or type = "identify" or type = "group" or type = "page" or type = "alias"',
  fields: {},
  lifecycleHook: 'enrichment',
  perform: (_, { context, analytics }) => {
    const urlAttributions = getAttributionsFromURL(window.location.search)
    const cachedAttributions = getAttributionsFromStorage(analytics.storage as UniversalStorage<Record<string, Partial<AmplitudeAttributionValues>>>)
    
    const comparison: AmplitudeAttributionComparison = {
      old: cachedAttributions,
      new: urlAttributions
    }

    if (context.event.integrations?.All !== false || context.event.integrations[DESTINATION_INTEGRATION_NAME]) {
      context.updateEvent(`integrations.${DESTINATION_INTEGRATION_NAME}`, {})
      context.updateEvent(`integrations.${DESTINATION_INTEGRATION_NAME}.autocapture_attribution`, comparison)
    }
    
    if(Object.entries(urlAttributions).length >0) {
      setAttributionsInStorage(analytics.storage as UniversalStorage<Record<string, Partial<AmplitudeAttributionValues>>>, urlAttributions)
    }
    return
  }
}
export default action