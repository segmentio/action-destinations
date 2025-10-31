import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { storageFallback } from './utils'
import { STORAGE_LOCATION } from './constants'
import { UniversalStorage } from '@segment/analytics-next'
import sessionAttributesEncoded from './sessionAttributesEncoded'
import btoa from 'btoa-lite'

export const destination: BrowserDestinationDefinition<Settings, {}> = {
  name: 'Google Enhanced Conversions Browser Plugins',
  mode: 'device',
  description: 'Browser plugin to enrich Segment event payloads with data specifically for Google Enhanced Conversions.',
  initialize: async ({ analytics }) => {
    const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback
    const urlParams = new URLSearchParams(window.location.search) || []
    const params: Record<string, string> = {}

    urlParams.forEach((value, key) => {
      if (key.startsWith("gad_")) {
        params[key] = value
      }
    })

    if (Object.keys(params).length > 0 || urlParams.has("gclid") || urlParams.has("gbraid")) {
      params["session_start_time_usec"] = (
        new Date().getTime() * 1000
      ).toString()

      params["landing_page_url"] = window.location.href
      params["landing_page_referrer"] = document.referrer
      params["landing_page_user_agent"] = navigator.userAgent

      const sessionAttributesEncoded = btoa(JSON.stringify(params))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "")

      storage.set(STORAGE_LOCATION, sessionAttributesEncoded)
    }
    return {}
  },
  settings: {},
  actions: {
    sessionAttributesEncoded
  }
}

export default browserDestination(destination)
