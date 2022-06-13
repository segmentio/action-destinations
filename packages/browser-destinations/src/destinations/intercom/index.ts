import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import { boot, initScript } from './init-script'

import trackEvent from './trackEvent'
import { Intercom } from './api'


declare global {
  interface Window {
    Intercom: Intercom
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, Intercom> = {
  name: 'Intercom (Actions)',
  slug: 'actions-intercom',
  mode: 'device',

  settings: {
    // Add any Segment destination settings required here
    appId: {
      required: true,
      label: 'App ID',
      type: 'string',
      description: 'The app_id of your Intercom app which will indicate where to store any data'
    }
  },

  initialize: async ({ settings }, deps) => {
    initScript({ appId: settings.appId })
    boot(settings.appId)
    await deps.resolveWhen(() => window.Intercom.booted === true, 100)
  
    return window.Intercom
  },

  actions: {
    trackEvent
  }
}

export default browserDestination(destination)