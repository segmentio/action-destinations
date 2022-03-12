import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import type { KoalaSDK } from './types'
import { browserDestination } from '../../runtime/shim'
import { initScript } from './init-script'

declare global {
  interface Window {
    ko: KoalaSDK
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: 'Koala',
  slug: 'actions-koala',
  mode: 'device',

  settings: {
    project_slug: {
      type: 'string',
      label: 'Koala Project Slug',
      description: "Please enter your project's slug found in your Koala project settings.",
      required: true
    }
  },

  initialize: async ({ settings }, deps) => {
    initScript()
    await deps.loadScript(`https://cdn.koala.live/v1/${settings.project_slug}/sdk.js`)
    return window.ko
  },

  actions: {}
}

export default browserDestination(destination)
