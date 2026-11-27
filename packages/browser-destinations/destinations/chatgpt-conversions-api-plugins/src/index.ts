import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { storageOpprefKey, opprefQuerystringName, getQuerystringValue, storageFallback } from './utils'
import { UniversalStorage } from '@segment/analytics-next'
import chatgptConversionsApiPlugin from './chatgptConversionsApiPlugin'

export const destination: BrowserDestinationDefinition<Settings, {}> = {
  name: 'ChatGPT Conversions API Plugins',
  description:
    'Captures the OpenAI browser reference (obref) and oppref click ID in the browser and adds them to events for ChatGPT Conversions API.',
  mode: 'device',
  initialize: async ({ analytics }) => {
    const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback

    const oppref = getQuerystringValue(window.location.search, opprefQuerystringName)
    if (oppref) {
      storage.set(storageOpprefKey, oppref)
    }

    return {}
  },
  settings: {},
  actions: {
    chatgptConversionsApiPlugin
  }
}

export default browserDestination(destination)
