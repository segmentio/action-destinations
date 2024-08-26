import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { UniversalStorage } from '@segment/analytics-next'
import nextdoorPlugin from './nextdoorPlugin'
import { storageFallback, clickIdCookieName, clickIdQuerystringName } from './utils'

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: 'Nextdoor Plugins',
  slug: 'actions-nextdoor-plugins',
  mode: 'device',
  settings: {},
  actions: { nextdoorPlugin },
  initialize: async ({ analytics }) => {
    const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback
    const urlParams = new URLSearchParams(window.location.search)
    const clickId: string | null = urlParams.get(clickIdQuerystringName) || null

    if (clickId) {
      storage.set(clickIdCookieName, clickId)
    }

    return {}
  }
}

export default browserDestination(destination)
