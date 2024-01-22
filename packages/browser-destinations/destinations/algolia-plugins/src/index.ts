import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { UniversalStorage } from '@segment/analytics-next'
import { storageFallback, storageQueryIdKey, queryIdQueryStringNameDefault } from './utils'

import algoliaPlugin from './algoliaPlugin'

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, {}> = {
  name: 'Algolia Plugins',
  slug: 'actions-algolia-plugins',
  mode: 'device',
  settings: {
    queryIdQueryStringName: {
      label: 'QueryID QueryString Name',
      description: 'QueryString name you use for when storing the Algolia QueryID in a page URL.',
      type: 'string',
      default: queryIdQueryStringNameDefault,
      required: false
    }
  },
  initialize: async ({ analytics, settings }) => {
    const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback

    const urlParams = new URLSearchParams(window.location.search)

    const queryId: string | null =
      urlParams.get(settings.queryIdQueryStringName ?? queryIdQueryStringNameDefault) || null

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
