import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import lead from './lead'
import { initScript } from './init-script'
import type { FBClient } from './types'

declare global {
  interface Window {
    fbq: FBClient
  }
}

export const destination: BrowserDestinationDefinition<Settings, FBClient> = {
  name: 'Facebook Conversions Api Web',
  slug: 'actions-facebook-conversions-api-web',
  mode: 'device',
  description: 'Send events to Facebook Conversions API from the browser.',
  settings: {
    pixelId: {
      description: 'The Pixel ID associated with your Facebook Pixel.',
      label: 'Pixel ID',
      type: 'string',
      required: true  
    }
  },
  initialize: async ({ settings }, deps) => {
    initScript(settings.pixelId)
    await deps.resolveWhen(() => typeof window.fbq === 'function', 100)
    return window.fbq
  },

  actions: {
    lead
  }
}

export default browserDestination(destination)
