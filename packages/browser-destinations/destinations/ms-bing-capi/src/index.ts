import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import {
  storageClickIdKey,
  clickIdQuerystringName,
  storageFallback
} from './utils'
import { UniversalStorage } from '@segment/analytics-next'
import msclkidPlugin from './msclkidPlugin'

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, {}> = {
  name: 'Microsoft Bing CAPI Browser Plugins',
  mode: 'device',
  initialize: async ({ analytics }) => {
    const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback
    const urlParams = new URLSearchParams(window.location.search)
    const msclkid: string | null = urlParams.get(clickIdQuerystringName) || null

    if (msclkid) {
      storage.set(storageClickIdKey, msclkid)
    }

    return {}
  },
  settings: {},
  actions: {
    msclkidPlugin
  }
}

export default browserDestination(destination)
