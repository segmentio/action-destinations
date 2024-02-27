import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import {
  storageSCIDCookieKey,
  storageClickIdKey,
  clickIdQuerystringName,
  scidCookieName,
  getCookieValue,
  storageFallback
} from './utils'
import { UniversalStorage } from '@segment/analytics-next'
import snapPlugin from './snapPlugin'

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, {}> = {
  name: 'Snap Browser Plugins',
  mode: 'device',
  initialize: async ({ analytics }) => {
    const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback

    const scid: string | null = getCookieValue(scidCookieName)
    if (scid) {
      storage.set(storageSCIDCookieKey, scid)
    }

    const urlParams = new URLSearchParams(window.location.search)
    const clickId: string | null = urlParams.get(clickIdQuerystringName) || null

    if (clickId) {
      storage.set(storageClickIdKey, clickId)
    }

    return {}
  },
  settings: {},
  actions: {
    snapPlugin
  }
}

export default browserDestination(destination)
