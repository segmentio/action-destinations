/* eslint-disable @typescript-eslint/no-unsafe-call */
import { UniversalStorage } from '@segment/analytics-next'
import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getAttributionsFromURL, getAttributionsFromStorage, getAttributionsDiff } from './functions'
import { AttributionValues } from './types'

const action: BrowserActionDefinition<Settings, {}, Payload> = {
  title: 'Autocapture Attribution Plugin',
  description: 'Captures attribution details from the URL and attaches it to every Amplitude browser based event.',
  platform: 'web',
  hidden: false,
  defaultSubscription: 'type = "track" or type = "identify" or type = "group" or type = "page" or type = "alias"',
  fields: {
    autocaptureAttribution: {
      label: 'Autocapture Attribution',
      type: 'boolean',
      required: true,
      description: 'Whether to automatically capture latest interaction attribution data from the URL.'
    }
  },
  lifecycleHook: 'enrichment',
  perform: (_, { context, payload, analytics }) => {
    if (payload.autocaptureAttribution) {
      const urlAttributions = getAttributionsFromURL(window.location.search)
      const cachedAttributions = getAttributionsFromStorage(analytics.storage as UniversalStorage<Record<string, AttributionValues>>)
      if (context.event.integrations?.All !== false || context.event.integrations['Actions Amplitude']) {
        context.updateEvent('integrations.Actions Amplitude', {})
        context.updateEvent('integrations.Actions Amplitude.autocapture_attribution', getAttributionsDiff(cachedAttributions, urlAttributions))
      }
    }
    return
  }
}
export default action