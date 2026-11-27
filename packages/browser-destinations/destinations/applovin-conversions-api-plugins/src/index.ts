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
  storageAlartKey,
  storageAleidKey
} from './constants'
import { resolveClickId, storageFallback } from './functions'

export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: 'AppLovin Conversions API Plugins',
  mode: 'device',
  settings: {},
  actions: { applovinPlugin },
  initialize: async ({ analytics }) => {
    const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback
    resolveClickId(storage, { queryName: aleidQuerystringName, cookieName: aleidCookieName, storageKey: storageAleidKey })
    resolveClickId(storage, { queryName: alartQuerystringName, cookieName: alartCookieName, storageKey: storageAlartKey })

    return {}
  }
}

export default browserDestination(destination)
