import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { UniversalStorage } from '@segment/analytics-next'
import { storageFallback, storageQueryIdKey, getQueryID } from './utils'

import algoliaPlugin from './algoliaPlugin'

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, {}> = {
  name: 'Algolia Plugins',
  slug: 'actions-algolia-plugins',
  mode: 'device',
  settings: {},
  initialize: async ({ analytics }) => {
    const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback

    const queryId: string | null = getQueryID()
    if (queryId) {
      storage.set(storageQueryIdKey, queryId)
    }

    return {}
  },
  actions: {
    algoliaPlugin
  }
}

export default browserDestination(destination)
