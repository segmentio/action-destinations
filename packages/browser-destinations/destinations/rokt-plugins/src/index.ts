import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { storageFallback, storageRTIDKey, rtidQuerystringName } from './utils'
import { UniversalStorage } from '@segment/analytics-next'
import roktPlugin from './roktPlugin'

export const destination: BrowserDestinationDefinition<Settings, {}> = {
  name: 'Rokt Browser Plugins',
  mode: 'device',
  initialize: async ({ analytics }) => {
    const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback
    const urlParams = new URLSearchParams(window.location.search)
    const rtid: string | null = urlParams.get(rtidQuerystringName) || null
    if (rtid) {
      storage.set(storageRTIDKey, rtid)
    }
    return {}
  },
  settings: {},
  actions: {
    roktPlugin
  }
}

export default browserDestination(destination)
