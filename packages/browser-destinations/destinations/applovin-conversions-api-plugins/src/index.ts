import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { UniversalStorage } from '@segment/analytics-next'
import applovinPlugin from './applovinPlugin'
import {
  alartCookieName,
  alartQuerystringName,
  aleidCookieName,
  aleidQuerystringName,
  setCookieValue,
  storageAlartKey,
  storageAleidKey,
  storageFallback
} from './utils'

export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: 'AppLovin Conversions API Plugins',
  mode: 'device',
  settings: {},
  actions: { applovinPlugin },
  initialize: async ({ analytics }) => {
    const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback
    const urlParams = new URLSearchParams(window.location.search)

    const aleid = urlParams.get(aleidQuerystringName)
    if (aleid) {
      storage.set(storageAleidKey, aleid)
      setCookieValue(aleidCookieName, aleid)
    }

    const alart = urlParams.get(alartQuerystringName)
    if (alart) {
      storage.set(storageAlartKey, alart)
      setCookieValue(alartCookieName, alart)
    }

    return {}
  }
}

export default browserDestination(destination)
