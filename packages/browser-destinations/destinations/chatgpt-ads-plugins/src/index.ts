import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import {
  storageOpprefKey,
  storageObrefKey,
  opprefQuerystringName,
  obrefCookieName,
  getQuerystringValue,
  getCookieValue,
  storageFallback
} from './utils'
import { UniversalStorage } from '@segment/analytics-next'
import chatgptAdsPlugin from './chatgptAdsPlugin'

export const destination: BrowserDestinationDefinition<Settings, {}> = {
  name: 'ChatGPT Ads Browser Plugins',
  description:
    'Captures the OpenAI browser reference (obref) and oppref click ID in the browser and adds them to events for ChatGPT Ads.',
  mode: 'device',
  initialize: async ({ analytics }) => {
    const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback

    const obref = getCookieValue(obrefCookieName)
    if (obref) {
      storage.set(storageObrefKey, obref)
    }

    const oppref = getQuerystringValue(window.location.search, opprefQuerystringName)
    if (oppref) {
      storage.set(storageOpprefKey, oppref)
    }

    return {}
  },
  settings: {},
  actions: {
    chatgptAdsPlugin
  }
}

export default browserDestination(destination)
